import mongoose from "mongoose";
import Academy from "../models/Academy.js";
import Batch from "../models/Batch.js";
import Branch from "../models/Branch.js";
import PublicAcademyProfile from "../models/PublicAcademyProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";

const clean = (value, max = 180) => String(value ?? "").trim().slice(0, max);
const list = (value, max = 20) => (Array.isArray(value) ? value : String(value ?? "").split(",")).map((item) => clean(item, 80)).filter(Boolean).slice(0, max);
const slugify = (value) => clean(value, 140).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "academy";
const visibilityKeys = ["academyOverview", "academyContact", "socialLinks", "affiliations", "branches", "branchContact", "branchFacilities", "branchCoaches", "batches", "batchCoaches", "batchSchedule"];
const ownerAcademy = (req) => Academy.findOne(req.user.role === "super_admin" && req.query.academyId ? { _id: req.query.academyId } : { owner: req.user._id });

const uniqueSlug = async (name, academyId) => {
  const base = slugify(name); let slug = base; let suffix = 1;
  while (await PublicAcademyProfile.exists({ slug, academy: { $ne: academyId } })) slug = `${base}-${++suffix}`;
  return slug;
};

const seedProfile = async (academy) => PublicAcademyProfile.create({
  academy: academy._id, slug: await uniqueSlug(academy.academyName, academy._id), academyName: academy.academyName,
  about: academy.about, logo: academy.logo, since: academy.since, martialArts: academy.martialArts,
  location: { address: academy.address, city: academy.city, state: academy.state, country: academy.country },
  contact: { countryCode: academy.countryCode, phone: academy.phone, email: academy.email, website: academy.socialLinks?.website },
});

const validIds = (value) => [...new Set((Array.isArray(value) ? value : []).map(String).filter((id) => mongoose.isValidObjectId(id)))];
const managementPayload = async (academy, profile) => {
  const [branches, batches] = await Promise.all([
    Branch.find({ academy: academy._id }).select("branchName city state isMainBranch isActive").sort({ isMainBranch: -1, branchName: 1 }).lean(),
    Batch.find({ academy: academy._id }).select("batchName branch martialArt martialArts isActive").populate("branch", "branchName").sort({ batchName: 1 }).lean(),
  ]);
  return { ...profile.toObject(), availableBranches: branches, availableBatches: batches };
};

const publicBranch = (branch, visibility) => ({
  id: String(branch._id), name: branch.branchName, isMainBranch: branch.isMainBranch, since: branch.branchSince, directorName: branch.directorName,
  location: { address: branch.address, city: branch.city, state: branch.state, country: branch.country },
  martialArts: [...new Set([...(branch.martialArts || []), ...(branch.customMartialArts || [])])],
  languages: [...new Set([...(branch.languagesSpoken || []), ...(branch.customLanguages || [])])],
  ...(visibility.branchFacilities ? { facilities: [...new Set([...(branch.facilities || []), ...(branch.customFacilities || [])])] } : {}),
  ...(visibility.branchContact ? { contact: { countryCode: branch.countryCode, phone: branch.phone, email: branch.email } } : {}),
  ...(visibility.branchCoaches ? { coaches: [
    branch.headCoachName && { role: "Head coach", name: branch.headCoachName, achievements: branch.headCoachAchievements },
    branch.assistantCoachName && { role: "Assistant coach", name: branch.assistantCoachName, achievements: branch.assistantCoachAchievements },
    ...(branch.additionalCoaches || []).map((coach) => ({ role: "Coach", name: coach.name, achievements: coach.achievements })),
  ].filter(Boolean) } : {}),
});

const publicBatch = (batch, visibility) => ({
  id: String(batch._id), branchId: batch.branch?._id ? String(batch.branch._id) : null, branchName: batch.branch?.branchName || "", name: batch.batchName,
  martialArts: [...new Set([...(batch.martialArts || []), batch.martialArt].filter(Boolean))],
  types: [...new Set([...(batch.batchTypes || []), ...(batch.customBatchTypes || []), batch.batchType].filter(Boolean))],
  skillLevels: [...new Set([...(batch.skillLevels || []), batch.skillLevel].filter(Boolean))], modes: [...new Set([...(batch.modes || []), batch.mode].filter(Boolean))],
  sessionSlots: batch.sessionSlots || [], venue: batch.venue, genderGroup: batch.genderGroup,
  ageRange: { min: batch.noMinAgeLimit ? null : batch.minAge, max: batch.noMaxAgeLimit ? null : batch.maxAge },
  beltRange: { min: batch.noMinBeltLimit ? "" : batch.minBelt, max: batch.noMaxBeltLimit ? "" : batch.maxBelt },
  languages: [...new Set([...(batch.batchLanguages || []), ...(batch.customBatchLanguages || [])])], capacity: batch.noCapacityLimit ? null : batch.capacity,
  ...(visibility.batchSchedule ? { schedule: batch.schedule || [] } : {}),
  ...(visibility.batchCoaches ? { coaches: [
    batch.headCoachName && { role: "Head coach", name: batch.headCoachName, achievements: batch.headCoachAchievements },
    batch.assistantCoachName && { role: "Assistant coach", name: batch.assistantCoachName, achievements: batch.assistantCoachAchievements },
    ...(batch.additionalCoaches || []).map((coach) => ({ role: "Coach", name: coach.name, achievements: coach.achievements })),
  ].filter(Boolean) } : {}),
});

const buildPublicProfile = async (profile) => {
  const academy = await Academy.findById(profile.academy).lean();
  if (!academy?.isActive) return null;
  const visibility = profile.visibility?.toObject?.() || profile.visibility || {};
  const hiddenBranches = new Set((profile.hiddenBranchIds || []).map(String)); const hiddenBatches = new Set((profile.hiddenBatchIds || []).map(String));
  const branches = visibility.branches === false ? [] : await Branch.find({ academy: academy._id, isActive: true }).sort({ isMainBranch: -1, branchName: 1 }).lean();
  const visibleBranches = branches.filter((item) => !hiddenBranches.has(String(item._id)));
  const batches = visibility.batches === false ? [] : await Batch.find({ academy: academy._id, isActive: true }).populate("branch", "branchName").sort({ batchName: 1 }).lean();
  const visibleBatches = batches.filter((item) => !hiddenBatches.has(String(item._id)));
  const result = { _id: profile._id, slug: profile.slug, academyName: academy.academyName, ownerName: academy.ownerName, tagline: profile.tagline, logo: academy.logo || profile.logo, coverImage: profile.coverImage, trialAvailable: profile.trialAvailable, onlineTraining: profile.onlineTraining, girlsOnlyBatches: profile.girlsOnlyBatches, visibility };
  if (visibility.academyOverview !== false) Object.assign(result, { about: academy.about || profile.about, since: academy.since, martialArts: academy.martialArts || [], highlights: profile.highlights || [], facilities: profile.facilities || [], languages: profile.languages || [] });
  if (visibility.academyContact !== false) {
    result.location = { address: academy.address, city: academy.city, state: academy.state, country: academy.country };
    result.contact = { ...(profile.contact?.showPhone ? { countryCode: academy.countryCode, phone: academy.phone, phoneNumbers: academy.phoneNumbers || [] } : {}), ...(profile.contact?.showEmail ? { email: academy.email } : {}), ...(visibility.socialLinks !== false ? { website: academy.socialLinks?.website } : {}) };
  }
  if (visibility.socialLinks !== false) result.socialLinks = academy.socialLinks || {};
  if (visibility.affiliations !== false) result.affiliations = academy.affiliations || [];
  result.branches = visibleBranches.map((item) => publicBranch(item, visibility)); result.batches = visibleBatches.map((item) => publicBatch(item, visibility));
  return result;
};

export const getMyPublicProfile = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Create your academy profile first", 404);
  const profile = await PublicAcademyProfile.findOne({ academy: academy._id }).select("+academy") || await seedProfile(academy);
  return successResponse(res, "Public academy profile loaded", { profile: await managementPayload(academy, profile) });
});

export const updateMyPublicProfile = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const profile = await PublicAcademyProfile.findOne({ academy: academy._id }).select("+academy") || await seedProfile(academy); const b = req.body || {};
  if (b.slug !== undefined) profile.slug = await uniqueSlug(b.slug, academy._id);
  for (const key of ["academyName", "tagline", "about", "logo", "coverImage"]) if (b[key] !== undefined) profile[key] = clean(b[key], key === "about" ? 2000 : 250);
  for (const key of ["martialArts", "highlights", "facilities", "languages"]) if (b[key] !== undefined) profile[key] = list(b[key]);
  for (const key of ["trialAvailable", "onlineTraining", "girlsOnlyBatches"]) if (b[key] !== undefined) profile[key] = Boolean(b[key]);
  if (b.since !== undefined) profile.since = b.since || null;
  if (b.location) profile.location = { ...profile.location.toObject(), address: clean(b.location.address, 300), city: clean(b.location.city, 80), state: clean(b.location.state, 80), country: clean(b.location.country, 80) || "India" };
  if (b.contact) profile.contact = { ...profile.contact.toObject(), countryCode: clean(b.contact.countryCode, 10), phone: clean(b.contact.phone, 30), email: clean(b.contact.email, 180), website: clean(b.contact.website, 250), showPhone: Boolean(b.contact.showPhone), showEmail: Boolean(b.contact.showEmail) };
  if (b.visibility) visibilityKeys.forEach((key) => { if (typeof b.visibility[key] === "boolean") profile.visibility[key] = b.visibility[key]; });
  const [branchIds, batchIds] = await Promise.all([Branch.find({ academy: academy._id }).distinct("_id"), Batch.find({ academy: academy._id }).distinct("_id")]);
  const branchSet = new Set(branchIds.map(String)); const batchSet = new Set(batchIds.map(String));
  if (b.hiddenBranchIds) profile.hiddenBranchIds = validIds(b.hiddenBranchIds).filter((id) => branchSet.has(id));
  if (b.hiddenBatchIds) profile.hiddenBatchIds = validIds(b.hiddenBatchIds).filter((id) => batchSet.has(id));
  await profile.save();
  return successResponse(res, "Public profile preferences saved", { profile: await managementPayload(academy, profile) });
});

export const publishMyPublicProfile = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const profile = await PublicAcademyProfile.findOne({ academy: academy._id }).select("+academy"); if (!profile) return errorResponse(res, "Save your public profile first", 400);
  if (!clean(academy.academyName, 120)) return errorResponse(res, "Complete the academy name before publishing", 400);
  profile.status = "published"; profile.publishedAt = new Date(); await profile.save();
  return successResponse(res, "Academy is now published", { profile: await managementPayload(academy, profile) });
});

export const unpublishMyPublicProfile = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const profile = await PublicAcademyProfile.findOneAndUpdate({ academy: academy._id }, { status: "draft" }, { new: true }).select("+academy");
  return successResponse(res, "Academy removed from public directory", { profile: profile ? await managementPayload(academy, profile) : null });
});

export const listPublicAcademies = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12)); const filter = { status: "published" };
  if (req.query.city) filter["location.city"] = new RegExp(`^${clean(req.query.city, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  if (req.query.martialArt) filter.martialArts = clean(req.query.martialArt, 80); if (req.query.trialAvailable === "true") filter.trialAvailable = true; if (req.query.search) filter.$text = { $search: clean(req.query.search, 100) };
  const [storedItems, total] = await Promise.all([PublicAcademyProfile.find(filter).select("+academy academyName slug tagline logo coverImage since martialArts highlights location trialAvailable onlineTraining").populate("academy", "academyName logo since martialArts city state country isActive").sort(req.query.sort === "newest" ? { publishedAt: -1 } : { academyName: 1 }).skip((page - 1) * limit).limit(limit).lean(), PublicAcademyProfile.countDocuments(filter)]);
  const items = storedItems.filter((item) => item.academy?.isActive).map((item) => ({ academyName: item.academy.academyName, slug: item.slug, tagline: item.tagline, logo: item.academy.logo || item.logo, coverImage: item.coverImage, since: item.academy.since, martialArts: item.academy.martialArts || [], highlights: item.highlights || [], location: { city: item.academy.city, state: item.academy.state, country: item.academy.country }, trialAvailable: item.trialAvailable, onlineTraining: item.onlineTraining }));
  return successResponse(res, "Published academies loaded", { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getPublicAcademy = asyncHandler(async (req, res) => {
  const profile = await PublicAcademyProfile.findOne({ slug: req.params.slug, status: "published" }).select("+academy"); if (!profile) return errorResponse(res, "Academy not found", 404);
  const publicProfile = await buildPublicProfile(profile); if (!publicProfile) return errorResponse(res, "Academy not found", 404);
  return successResponse(res, "Academy details loaded", { profile: publicProfile });
});
