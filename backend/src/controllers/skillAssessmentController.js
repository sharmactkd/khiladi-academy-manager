import mongoose from "mongoose";

import SkillAssessment from "../models/SkillAssessment.js";
import Skill from "../models/Skill.js";
import Student from "../models/Student.js";

import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { buildBranchAccessFilter } from "../services/branchAccessService.js";

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const validateStudentAndSkill = async ({ academyId, studentId, skillId, user }) => {
  const student = await Student.findOne({
    _id: studentId,
    academy: academyId,
    ...buildBranchAccessFilter(user),
  });

  if (!student) {
    throw new Error("Student not found or not allowed");
  }

  const skill = await Skill.findOne({
    _id: skillId,
    academy: academyId,
    isActive: true,
  });

  if (!skill) {
    throw new Error("Skill not found");
  }

  return { student, skill };
};

export const createSkillAssessment = asyncHandler(async (req, res) => {
  const { student, skill } = await validateStudentAndSkill({
    academyId: req.academyId,
    studentId: req.body.student,
    skillId: req.body.skill,
    user: req.user,
  });

  const maxScore = Number(req.body.maxScore || 10);
  const score = Number(req.body.score);

  if (score > maxScore) {
    return errorResponse(res, "Score cannot be greater than max score", 400);
  }

  const assessment = await SkillAssessment.create({
    academy: req.academyId,
    branch: student.branch || null,
    student: student._id,
    skill: skill._id,
    score,
    maxScore,
    assessmentDate: req.body.assessmentDate || new Date(),
    remarks: req.body.remarks || "",
    status: req.body.status || "published",
    rubricScores: Array.isArray(req.body.rubricScores) ? req.body.rubricScores : [],
    strengths: req.body.strengths || "",
    improvementAreas: req.body.improvementAreas || "",
    trainingRecommendation: req.body.trainingRecommendation || "",
    nextReviewDate: req.body.nextReviewDate || null,
    skillSnapshot: {
      skillName: skill.skillName,
      skillCode: skill.skillCode || "",
      category: skill.category,
      level: skill.level,
      martialArt: skill.martialArt,
      rubric: skill.rubric || [],
      version: skill.version || 1,
    },
    assessedBy: req.user._id,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  const populated = await SkillAssessment.findById(assessment._id)
    .populate("student", "firstName lastName admissionNumber")
    .populate("skill", "skillName category level martialArt")
    .populate("branch", "branchName branchCode")
    .populate("assessedBy", "name email role");

  return successResponse(
    res,
    "Skill assessment created successfully",
    populated,
    201
  );
});

export const getSkillAssessments = asyncHandler(async (req, res) => {
  const { branch, student, skill, category, status, fromDate, toDate, page, limit } = req.query;

  const query = {
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
    isDeleted: false,
  };

  if (branch) query.branch = branch;
  if (student) query.student = student;
  if (skill) query.skill = skill;
  if (status) query.status = status;

  if (fromDate || toDate) {
    query.assessmentDate = {};
    if (fromDate) query.assessmentDate.$gte = startOfDay(fromDate);
    if (toDate) query.assessmentDate.$lte = endOfDay(toDate);
  }

  let skillIds = null;
  if (category) {
    skillIds = await Skill.find({ academy: req.academyId, category }).distinct("_id");
    query.skill = { $in: skillIds };
  }

  const assessmentQuery = () => SkillAssessment.find(query)
    .populate("student", "firstName lastName admissionNumber")
    .populate("skill", "skillName category level martialArt")
    .populate("branch", "branchName branchCode")
    .populate("assessedBy", "name email role")
    .sort({ assessmentDate: -1, createdAt: -1 });

  if (page !== undefined || limit !== undefined) {
    const currentPage = Math.max(Number(page || 1), 1);
    const pageSize = Math.min(Math.max(Number(limit || 30), 1), 200);
    const [assessments, total, published, dueReviews] = await Promise.all([
      assessmentQuery().skip((currentPage - 1) * pageSize).limit(pageSize),
      SkillAssessment.countDocuments(query),
      SkillAssessment.countDocuments({ ...query, status: "published" }),
      SkillAssessment.countDocuments({ ...query, nextReviewDate: { $lte: new Date() } }),
    ]);
    return successResponse(res, "Skill assessments fetched successfully", { assessments, summary: { total, published, drafts: total - published, dueReviews }, pagination: { page: currentPage, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
  }

  const assessments = await assessmentQuery();

  return successResponse(
    res,
    "Skill assessments fetched successfully",
    assessments
  );
});

export const getStudentSkillProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.params.studentId,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
  }).populate("branch", "branchName branchCode");

  if (!student) {
    return errorResponse(res, "Student not found", 404);
  }

  const match = {
    academy: new mongoose.Types.ObjectId(req.academyId),
    student: new mongoose.Types.ObjectId(student._id),
    isDeleted: false,
  };

  const [assessments, categoryAverage, skillProgress] = await Promise.all([
    SkillAssessment.find(match)
      .populate("skill", "skillName category level martialArt")
      .populate("assessedBy", "name email role")
      .sort({ assessmentDate: -1 })
      .lean(),

    SkillAssessment.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "skills",
          localField: "skill",
          foreignField: "_id",
          as: "skillData",
        },
      },
      { $unwind: "$skillData" },
      {
        $group: {
          _id: "$skillData.category",
          averageScore: {
            $avg: {
              $multiply: [{ $divide: ["$score", "$maxScore"] }, 100],
            },
          },
          totalAssessments: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    SkillAssessment.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "skills",
          localField: "skill",
          foreignField: "_id",
          as: "skillData",
        },
      },
      { $unwind: "$skillData" },
      {
        $project: {
          skillName: "$skillData.skillName",
          category: "$skillData.category",
          assessmentDate: 1,
          percentage: {
            $multiply: [{ $divide: ["$score", "$maxScore"] }, 100],
          },
        },
      },
      { $sort: { assessmentDate: 1 } },
    ]),
  ]);

  const totalObtained = assessments.reduce((sum, item) => sum + Number(item.score || 0), 0);
  const totalPossible = assessments.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
  const overallAverage = totalPossible ? Math.round((totalObtained / totalPossible) * 100) : 0;

  return successResponse(res, "Student skill profile fetched successfully", {
    student,
    overallAverage,
    categoryAverage: categoryAverage.map((item) => ({
      category: item._id,
      averageScore: Math.round(item.averageScore || 0),
      totalAssessments: item.totalAssessments,
    })),
    skillProgress: skillProgress.map((item) => ({
      skillName: item.skillName,
      category: item.category,
      assessmentDate: item.assessmentDate,
      percentage: Math.round(item.percentage || 0),
    })),
    assessments,
  });
});

export const getSkillAssessmentById = asyncHandler(async (req, res) => {
  const assessment = await SkillAssessment.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
    isDeleted: false,
  })
    .populate("student", "firstName lastName admissionNumber")
    .populate("skill", "skillName category level martialArt")
    .populate("branch", "branchName branchCode")
    .populate("assessedBy", "name email role");

  if (!assessment) {
    return errorResponse(res, "Skill assessment not found", 404);
  }

  return successResponse(
    res,
    "Skill assessment fetched successfully",
    assessment
  );
});

export const updateSkillAssessment = asyncHandler(async (req, res) => {
  const assessment = await SkillAssessment.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
    isDeleted: false,
  });

  if (!assessment) {
    return errorResponse(res, "Skill assessment not found", 404);
  }

  const nextScore =
    req.body.score !== undefined ? Number(req.body.score) : assessment.score;
  const nextMaxScore =
    req.body.maxScore !== undefined
      ? Number(req.body.maxScore)
      : assessment.maxScore;

  if (nextScore > nextMaxScore) {
    return errorResponse(res, "Score cannot be greater than max score", 400);
  }

  if (req.body.score !== undefined) assessment.score = nextScore;
  if (req.body.maxScore !== undefined) assessment.maxScore = nextMaxScore;
  if (req.body.assessmentDate !== undefined) {
    assessment.assessmentDate = req.body.assessmentDate;
  }
  if (req.body.remarks !== undefined) {
    assessment.remarks = req.body.remarks;
  }
  ["status", "rubricScores", "strengths", "improvementAreas", "trainingRecommendation", "nextReviewDate"].forEach((field) => {
    if (req.body[field] !== undefined) assessment[field] = req.body[field] || (field === "nextReviewDate" ? null : req.body[field]);
  });

  assessment.updatedBy = req.user._id;

  await assessment.save();

  return successResponse(
    res,
    "Skill assessment updated successfully",
    assessment
  );
});

export const deleteSkillAssessment = asyncHandler(async (req, res) => {
  const assessment = await SkillAssessment.findOne({
    _id: req.params.id,
    academy: req.academyId,
    ...buildBranchAccessFilter(req.user),
    isDeleted: false,
  });

  if (!assessment) {
    return errorResponse(res, "Skill assessment not found", 404);
  }

  assessment.isDeleted = true;
  assessment.deletedAt = new Date();
  assessment.deletedBy = req.user._id;
  assessment.deleteReason = req.body?.reason || "Removed from assessment history";
  assessment.updatedBy = req.user._id;
  await assessment.save();

  return successResponse(res, "Skill assessment deleted successfully");
});
