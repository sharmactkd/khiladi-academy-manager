import Skill from "../models/Skill.js";

import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const OWNER_ROLES = ["academy_owner", "super_admin"];

const canManageSkills = (user) => OWNER_ROLES.includes(user?.role);

export const createSkill = asyncHandler(async (req, res) => {
  if (!canManageSkills(req.user)) {
    return errorResponse(res, "Only academy owner can create skills", 403);
  }

  const martialArt = req.body.martialArt || "Taekwondo";

  const existing = await Skill.findOne({
    academy: req.academyId,
    martialArt,
    skillName: req.body.skillName,
    category: req.body.category,
  });

  if (existing) {
    return errorResponse(res, "Skill already exists", 409);
  }

  const skill = await Skill.create({
    academy: req.academyId,
    martialArt,
    skillName: req.body.skillName,
    category: req.body.category,
    level: req.body.level || "all",
    isActive: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  return successResponse(res, "Skill created successfully", skill, 201);
});

export const getSkills = asyncHandler(async (req, res) => {
  const { martialArt, category, level, status = "active" } = req.query;

  const query = {
    academy: req.academyId,
  };

  if (martialArt) query.martialArt = martialArt;
  if (category) query.category = category;
  if (level) query.level = level;

  if (status === "active") query.isActive = true;
  if (status === "inactive") query.isActive = false;

  const skills = await Skill.find(query).sort({
    martialArt: 1,
    category: 1,
    level: 1,
    skillName: 1,
  });

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

  const allowedFields = [
    "martialArt",
    "skillName",
    "category",
    "level",
    "isActive",
  ];

  for (const field of allowedFields) {
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
  skill.updatedBy = req.user._id;

  await skill.save();

  return successResponse(res, "Skill deactivated successfully", skill);
});