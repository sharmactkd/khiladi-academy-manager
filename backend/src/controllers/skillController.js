import Skill from "../models/Skill.js";
import DEFAULT_TAEKWONDO_SKILLS from "../data/defaultSkillCatalog.js";

import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const OWNER_ROLES = ["academy_owner", "super_admin"];

const canManageSkills = (user) => OWNER_ROLES.includes(user?.role);
const normalizeName = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const editableFields = ["martialArt", "skillCode", "skillName", "description", "category", "level", "targetBelts", "targetDans", "tags", "isRequired", "maxScore", "assessmentIntervalDays", "displayOrder", "rubric", "isActive"];

export const createSkill = asyncHandler(async (req, res) => {
  if (!canManageSkills(req.user)) {
    return errorResponse(res, "Only academy owner can create skills", 403);
  }

  const martialArt = req.body.martialArt || "Taekwondo";

  const existing = await Skill.findOne({
    academy: req.academyId,
    martialArt,
    normalizedName: normalizeName(req.body.skillName),
  });

  if (existing) {
    return errorResponse(res, "Skill already exists", 409);
  }

  const payload = { academy: req.academyId, createdBy: req.user._id, updatedBy: req.user._id };
  editableFields.forEach((field) => { if (req.body[field] !== undefined) payload[field] = req.body[field]; });
  payload.martialArt = martialArt;
  payload.isActive = req.body.isActive === undefined ? true : Boolean(req.body.isActive);
  const skill = await Skill.create(payload);

  return successResponse(res, "Skill created successfully", skill, 201);
});

export const getSkills = asyncHandler(async (req, res) => {
  const { martialArt, category, level, status = "active", search = "", page, limit } = req.query;

  const query = {
    academy: req.academyId,
  };

  if (martialArt) query.martialArt = martialArt;
  if (category) query.category = category;
  if (level) query.level = level;
  if (search) query.$or = [
    { skillName: { $regex: escapeRegex(search), $options: "i" } },
    { skillCode: { $regex: escapeRegex(search), $options: "i" } },
    { tags: { $regex: escapeRegex(search), $options: "i" } },
  ];

  if (status === "active") query.isActive = true;
  if (status === "inactive") query.isActive = false;

  const sort = {
    displayOrder: 1,
    martialArt: 1,
    category: 1,
    level: 1,
    skillName: 1,
  };

  if (page !== undefined || limit !== undefined) {
    const currentPage = Math.max(Number(page || 1), 1);
    const pageSize = Math.min(Math.max(Number(limit || 50), 1), 200);
    const [skills, total, active, categories] = await Promise.all([
      Skill.find(query).sort(sort).skip((currentPage - 1) * pageSize).limit(pageSize),
      Skill.countDocuments(query),
      Skill.countDocuments({ academy: req.academyId, isActive: true }),
      Skill.distinct("category", { academy: req.academyId, isActive: true }),
    ]);
    return successResponse(res, "Skills fetched successfully", { skills, summary: { total, active, categories: categories.length }, pagination: { page: currentPage, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
  }

  const skills = await Skill.find(query).sort(sort);

  return successResponse(res, "Skills fetched successfully", skills);
});

export const getSkillById = asyncHandler(async (req, res) => {
  const skill = await Skill.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!skill) {
    return errorResponse(res, "Skill not found", 404);
  }

  return successResponse(res, "Skill fetched successfully", skill);
});

export const updateSkill = asyncHandler(async (req, res) => {
  if (!canManageSkills(req.user)) {
    return errorResponse(res, "Only academy owner can update skills", 403);
  }

  const skill = await Skill.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!skill) {
    return errorResponse(res, "Skill not found", 404);
  }

  for (const field of editableFields) {
    if (req.body[field] !== undefined) {
      skill[field] = req.body[field];
    }
  }

  skill.updatedBy = req.user._id;

  await skill.save();

  return successResponse(res, "Skill updated successfully", skill);
});

export const deleteSkill = asyncHandler(async (req, res) => {
  if (!canManageSkills(req.user)) {
    return errorResponse(res, "Only academy owner can delete skills", 403);
  }

  const skill = await Skill.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!skill) {
    return errorResponse(res, "Skill not found", 404);
  }

  skill.isActive = false;
  skill.archivedAt = new Date();
  skill.updatedBy = req.user._id;

  await skill.save();

  return successResponse(res, "Skill deactivated successfully", skill);
});

export const seedDefaultSkills = asyncHandler(async (req, res) => {
  if (!canManageSkills(req.user)) return errorResponse(res, "Only academy owner can install the default skill catalog", 403);

  const existing = await Skill.find({ academy: req.academyId }).select("normalizedName skillName martialArt").lean();
  const keys = new Set(existing.map((item) => `${String(item.martialArt || "").toLowerCase()}::${item.normalizedName || normalizeName(item.skillName)}`));
  const missing = DEFAULT_TAEKWONDO_SKILLS.filter((item) => !keys.has(`${item.martialArt.toLowerCase()}::${normalizeName(item.skillName)}`));

  if (missing.length) {
    await Skill.insertMany(missing.map((item, index) => ({ ...item, normalizedName: normalizeName(item.skillName), displayOrder: index + 1, createdBy: req.user._id, updatedBy: req.user._id, academy: req.academyId })), { ordered: false });
  }

  return successResponse(res, "Default Taekwondo skill catalog installed successfully", { created: missing.length, skipped: DEFAULT_TAEKWONDO_SKILLS.length - missing.length, totalCatalogSkills: DEFAULT_TAEKWONDO_SKILLS.length }, missing.length ? 201 : 200);
});
