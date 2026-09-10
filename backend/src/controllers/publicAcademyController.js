import Academy from "../models/Academy.js";
import Branch from "../models/Branch.js";
import PublicAcademyProfile from "../models/PublicAcademyProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";

const clean = (value, max = 180) => String(value ?? "").trim().slice(0, max);
const list = (value, max = 20) => (Array.isArray(value) ? value : String(value ?? "").split(","))
  .map((item) => clean(item, 80)).filter(Boolean).slice(0, max);
const slugify = (value) => clean(value, 140).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "academy";

const uniqueSlug = async (name, academyId) => {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;
  while (await PublicAcademyProfile.exists({ slug, academy: { $ne: academyId } })) slug = `${base}-${++suffix}`;
  return slug;
};

const ownerAcademy = async (req) => Academy.findOne(req.user.role === "super_admin" && req.query.academyId
  ? { _id: req.query.academyId }
  : { owner: req.user._id });

const seedProfile = async (academy) => {
  const branches = await Branch.find({ academy: academy._id, isActive: true }).lean();
  return PublicAcademyProfile.create({
    academy: academy._id,
    slug: await uniqueSlug(academy.academyName, academy._id),
    academyName: academy.academyName,
    about: academy.about,
    logo: academy.logo,
    since: academy.since,
    martialArts: academy.martialArts,
    location: { address: academy.address, city: academy.city, state: academy.state, country: academy.country },
    contact: { countryCode: academy.countryCode, phone: academy.phone, email: academy.email, website: academy.socialLinks?.website },
    branches: branches.map((branch) => ({ name: branch.branchName, address: branch.address, city: branch.city, state: branch.state, martialArts: branch.martialArts, facilities: branch.facilities, languages: branch.languages, isMainBranch: branch.isMainBranch })),
  });
};

export const getMyPublicProfile = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req);
  if (!academy) return errorResponse(res, "Create your academy profile first", 404);
  const profile = await PublicAcademyProfile.findOne({ academy: academy._id }).select("+academy") || await seedProfile(academy);
  return successResponse(res, "Public academy profile loaded", { profile });
});

export const updateMyPublicProfile = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req);
  if (!academy) return errorResponse(res, "Academy not found", 404);
  let profile = await PublicAcademyProfile.findOne({ academy: academy._id }).select("+academy") || await seedProfile(academy);
  const b = req.body || {};
  if (b.slug !== undefined) profile.slug = await uniqueSlug(b.slug, academy._id);
  for (const key of ["academyName", "tagline", "about", "logo", "coverImage"]) if (b[key] !== undefined) profile[key] = clean(b[key], key === "about" ? 2000 : 250);
  for (const key of ["martialArts", "highlights", "facilities", "languages"]) if (b[key] !== undefined) profile[key] = list(b[key]);
  for (const key of ["trialAvailable", "onlineTraining", "girlsOnlyBatches"]) if (b[key] !== undefined) profile[key] = Boolean(b[key]);
  if (b.since !== undefined) profile.since = b.since || null;
  if (b.feeDisplay !== undefined) profile.feeDisplay = b.feeDisplay;
  if (b.startingFee !== undefined) profile.startingFee = b.startingFee === "" ? null : Number(b.startingFee);
  if (b.location) profile.location = { ...profile.location.toObject(), address: clean(b.location.address, 300), city: clean(b.location.city, 80), state: clean(b.location.state, 80), country: clean(b.location.country, 80) || "India" };
  if (b.contact) profile.contact = { ...profile.contact.toObject(), countryCode: clean(b.contact.countryCode, 10), phone: clean(b.contact.phone, 30), email: clean(b.contact.email, 180), website: clean(b.contact.website, 250), showPhone: Boolean(b.contact.showPhone), showEmail: Boolean(b.contact.showEmail) };
  await profile.save();
  return successResponse(res, "Public profile draft saved", { profile });
});

export const publishMyPublicProfile = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req);
  if (!academy) return errorResponse(res, "Academy not found", 404);
  const profile = await PublicAcademyProfile.findOne({ academy: academy._id });
  if (!profile) return errorResponse(res, "Save your public profile first", 400);
  if (!profile.academyName || !profile.about || !profile.location?.city || !profile.martialArts.length) return errorResponse(res, "Name, about, city and at least one martial art are required before publishing", 400);
  profile.status = "published"; profile.publishedAt = new Date(); await profile.save();
  return successResponse(res, "Academy is now published", { profile });
});

export const unpublishMyPublicProfile = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req);
  if (!academy) return errorResponse(res, "Academy not found", 404);
  const profile = await PublicAcademyProfile.findOneAndUpdate({ academy: academy._id }, { status: "draft" }, { new: true });
  return successResponse(res, "Academy removed from public directory", { profile });
});

export const listPublicAcademies = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12));
  const filter = { status: "published" };
  if (req.query.city) filter["location.city"] = new RegExp(`^${clean(req.query.city, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  if (req.query.martialArt) filter.martialArts = clean(req.query.martialArt, 80);
  if (req.query.trialAvailable === "true") filter.trialAvailable = true;
  if (req.query.search) filter.$text = { $search: clean(req.query.search, 100) };
  const [items, total] = await Promise.all([PublicAcademyProfile.find(filter).select("academyName slug tagline logo coverImage since martialArts highlights location trialAvailable onlineTraining feeDisplay startingFee").sort(req.query.sort === "newest" ? { publishedAt: -1 } : { academyName: 1 }).skip((page - 1) * limit).limit(limit).lean(), PublicAcademyProfile.countDocuments(filter)]);
  return successResponse(res, "Published academies loaded", { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getPublicAcademy = asyncHandler(async (req, res) => {
  const profile = await PublicAcademyProfile.findOne({ slug: req.params.slug, status: "published" }).select("-status -createdAt -updatedAt -__v").lean();
  if (!profile) return errorResponse(res, "Academy not found", 404);
  if (!profile.contact?.showPhone) { delete profile.contact.phone; delete profile.contact.countryCode; }
  if (!profile.contact?.showEmail) delete profile.contact.email;
  delete profile.contact.showPhone; delete profile.contact.showEmail;
  return successResponse(res, "Academy details loaded", { profile });
});
