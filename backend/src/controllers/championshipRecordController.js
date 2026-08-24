import ChampionshipRecord from "../models/ChampionshipRecord.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildSafeSearchRegex } from "../utils/search.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { createChampionshipTimeline } from "../services/timelineService.js";

const allowedFields = [
  "student",
  "championshipName",
  "championshipType",
  "officialCategory",
  "level",
  "grading",
  "sport",
  "eventType",
  "poomsaeType",
  "gender",
  "ageCategory",
  "weightCategory",
  "beltCategory",
  "danCategory",
  "result",
  "disqualificationReason",
  "ranking",
  "totalBouts",
  "bouts",
  "boutsWon",
  "boutsLost",
  "pointsScored",
  "pointsConceded",
  "byeReceived",
  "walkoverWin",
  "walkoverLoss",
  "startDate",
  "endDate",
  "date",
  "venue",
  "district",
  "state",
  "country",
  "organizer",
  "association",
  "registrationNumber",
  "sanctionNumber",
  "remarks",
  "certificateUrl",
  "medalPhotoUrl",
  "podiumPhotoUrl",
  "matchVideoUrl",
  "youtubeUrl",
  "newsUrl",
];

const clean = (value, max = 500) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);

const parseNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isNaN(number) ? fallback : number;
};

const parseNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return Boolean(value);
};

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const normalizeLegacyValue = (value, map = {}) => {
  const raw = clean(value);
  if (!raw) return raw;

  return map[raw] || map[raw.toLowerCase()] || raw;
};

const buildPayload = (body = {}) => {
  const raw = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      raw[field] = body[field];
    }
  });

  const championshipType = normalizeLegacyValue(
    raw.championshipType || "Open",
    {
      open: "Open",
      official: "Official",
    }
  );

  const level = normalizeLegacyValue(raw.level, {
    district: "District",
    regional: "Regional",
    state: "State",
    national: "National",
    international: "International",
    open: "District",
  });

  const eventType = normalizeLegacyValue(raw.eventType, {
    kyorugi: "Kyorugi",
    fresher: "Fresher",
    "tag team": "Tag Team",
    tagteam: "Tag Team",
    poomsae: "Poomsae",
    demo: "Kyorugi",
    other: "Kyorugi",
  });

  const result = normalizeLegacyValue(raw.result || "Participation", {
    gold: "Gold",
    silver: "Silver",
    bronze: "Bronze",
    participated: "Participation",
    participation: "Participation",
    disqualified: "Disqualified",
    "no medal": "No Medal",
  });

  const startDate = parseDate(raw.startDate || raw.date);
  const endDate = parseDate(raw.endDate || raw.date || raw.startDate);
  const bouts = Array.isArray(raw.bouts)
    ? raw.bouts.map((bout, index) => ({
        boutNumber: index + 1,
        outcomeMethod: clean(bout?.outcomeMethod, 40),
      }))
    : [];

  return {
    student: raw.student,

    championshipName: clean(raw.championshipName, 200),
    championshipType,
    officialCategory:
      championshipType === "Official" ? clean(raw.officialCategory, 80) : "",
    level,
    grading:
      championshipType === "Official" && level === "International"
        ? clean(raw.grading, 20)
        : "",

    sport: clean(raw.sport || raw.martialArt || "Taekwondo", 80),

    eventType,
    poomsaeType: eventType === "Poomsae" ? clean(raw.poomsaeType, 40) : "",

    gender: normalizeLegacyValue(raw.gender || "Male", {
      male: "Male",
      female: "Female",
      mixed: "Mixed",
    }),

    ageCategory: clean(raw.ageCategory, 50),
    weightCategory: clean(raw.weightCategory, 80),
    beltCategory: clean(raw.beltCategory, 80),
    danCategory:
      clean(raw.beltCategory, 80) === "Black" ? clean(raw.danCategory, 40) : "",

    result,
    disqualificationReason:
      result === "Disqualified" ? clean(raw.disqualificationReason, 500) : "",
    ranking: parseNullableNumber(raw.ranking),

    totalBouts: bouts.length || parseNumber(raw.totalBouts, 0),
    bouts,
    boutsWon: bouts.length || parseNumber(raw.boutsWon, 0),
    boutsLost: bouts.length ? 0 : parseNumber(raw.boutsLost, 0),
    pointsScored: parseNumber(raw.pointsScored, 0),
    pointsConceded: parseNumber(raw.pointsConceded, 0),

    byeReceived:
      bouts.some((bout) => bout.outcomeMethod === "Bye") ||
      parseBoolean(raw.byeReceived),
    walkoverWin: parseBoolean(raw.walkoverWin),
    walkoverLoss: parseBoolean(raw.walkoverLoss),

    startDate,
    endDate,
    date: startDate,

    venue: clean(raw.venue, 300),
    district: clean(raw.district || raw.city, 100),
    state: clean(raw.state, 100),
    country: clean(raw.country || "India", 100),

    organizer: clean(raw.organizer, 200),
    association: clean(raw.association, 200),
    registrationNumber: clean(raw.registrationNumber, 100),
    sanctionNumber: clean(raw.sanctionNumber, 100),

    remarks: clean(raw.remarks || raw.notes, 2000),

    certificateUrl: clean(raw.certificateUrl, 500),
    medalPhotoUrl: clean(raw.medalPhotoUrl, 500),
    podiumPhotoUrl: clean(raw.podiumPhotoUrl, 500),
    matchVideoUrl: clean(raw.matchVideoUrl, 500),
    youtubeUrl: clean(raw.youtubeUrl, 500),
    newsUrl: clean(raw.newsUrl, 500),
  };
};

const validateStudentAccess = async ({ academyId, studentId }) => {
  return Student.findOne({
    _id: studentId,
    academy: academyId,
  });
};

const validatePayload = async ({ payload, academyId, requireStudent = true }) => {
  if (requireStudent || payload.student) {
    const student = await validateStudentAccess({
      academyId,
      studentId: payload.student,
    });

    if (!student) return "Student not found in your academy";
  }

  if (!payload.championshipName) return "Championship name is required";
  if (!payload.level) return "Championship level is required";
  if (!payload.startDate) return "Start date is required";
  if (!payload.endDate) return "End date is required";
  if (!payload.eventType) return "Event type is required";
  if (!payload.ageCategory) return "Age category is required";

  if (payload.endDate < payload.startDate) {
    return "End date cannot be before start date";
  }

  if (payload.championshipType === "Official" && !payload.officialCategory) {
    return "Official category is required for official championship";
  }

  if (
    payload.championshipType === "Official" &&
    payload.level === "International" &&
    !payload.grading
  ) {
    return "Grading is required for official international championship";
  }

  if (payload.eventType === "Poomsae" && !payload.poomsaeType) {
    return "Poomsae type is required";
  }

  if (payload.result === "Disqualified" && !payload.disqualificationReason) {
    return "Disqualification reason is required";
  }

  if (
    payload.bouts.length > 0 &&
    (payload.bouts.length !== payload.totalBouts ||
      payload.bouts.some((bout) => !bout.outcomeMethod))
  ) {
    return "Please select an outcome for every bout";
  }

  if (payload.boutsWon + payload.boutsLost > payload.totalBouts) {
    return "Won + lost bouts cannot be greater than total bouts";
  }

  return "";
};

export const createChampionshipRecord = asyncHandler(async (req, res) => {
  const payload = buildPayload(req.body);

  const validationError = await validatePayload({
    payload,
    academyId: req.academyId,
    requireStudent: true,
  });

  if (validationError) {
    return errorResponse(res, validationError, 400);
  }

  const championshipRecord = await ChampionshipRecord.create({
    ...payload,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await createChampionshipTimeline({
    championshipRecord,
    userId: req.user._id,
  });

  return successResponse(
    res,
    "Championship record created successfully",
    { championshipRecord },
    201
  );
});

export const getChampionshipRecords = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    academy: req.academyId,
    isDeleted: false,
  };

  if (req.query.student) filter.student = req.query.student;
  if (req.query.championshipType) {
    filter.championshipType = normalizeLegacyValue(req.query.championshipType, {
      open: "Open",
      official: "Official",
    });
  }
  if (req.query.officialCategory) filter.officialCategory = req.query.officialCategory;
  if (req.query.level) {
    filter.level = normalizeLegacyValue(req.query.level, {
      district: "District",
      regional: "Regional",
      state: "State",
      national: "National",
      international: "International",
    });
  }
  if (req.query.grading) filter.grading = req.query.grading;
  if (req.query.sport) filter.sport = req.query.sport;
  if (req.query.eventType) {
    filter.eventType = normalizeLegacyValue(req.query.eventType, {
      kyorugi: "Kyorugi",
      fresher: "Fresher",
      poomsae: "Poomsae",
      tagteam: "Tag Team",
      "tag team": "Tag Team",
    });
  }
  if (req.query.poomsaeType) filter.poomsaeType = req.query.poomsaeType;
  if (req.query.ageCategory) filter.ageCategory = req.query.ageCategory;
  if (req.query.result) {
    filter.result = normalizeLegacyValue(req.query.result, {
      gold: "Gold",
      silver: "Silver",
      bronze: "Bronze",
      participated: "Participation",
      participation: "Participation",
      disqualified: "Disqualified",
      "no medal": "No Medal",
    });
  }
  if (req.query.year) filter.championshipYear = Number(req.query.year);

  if (req.query.fromDate || req.query.toDate) {
    filter.startDate = {};

    if (req.query.fromDate) {
      filter.startDate.$gte = new Date(req.query.fromDate);
    }

    if (req.query.toDate) {
      filter.startDate.$lte = new Date(req.query.toDate);
    }
  }

  if (req.query.search) {
    const searchRegex = buildSafeSearchRegex(req.query.search);

    filter.$or = [
      { championshipName: searchRegex },
      { venue: searchRegex },
      { organizer: searchRegex },
      { association: searchRegex },
      { district: searchRegex },
      { state: searchRegex },
      { country: searchRegex },
      { ageCategory: searchRegex },
      { weightCategory: searchRegex },
      { remarks: searchRegex },
    ];
  }

  const [championshipRecords, total] = await Promise.all([
    ChampionshipRecord.find(filter)
      .sort({ startDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "student",
        "name firstName lastName studentCode admissionNumber phone beltRank profilePhoto photo status"
      )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email"),
    ChampionshipRecord.countDocuments(filter),
  ]);

  return successResponse(res, "Championship records fetched successfully", {
    championshipRecords,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getChampionshipRecordById = asyncHandler(async (req, res) => {
  const championshipRecord = await ChampionshipRecord.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  })
    .populate(
      "student",
      "name firstName lastName studentCode admissionNumber phone beltRank profilePhoto photo status"
    )
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!championshipRecord) {
    return errorResponse(res, "Championship record not found", 404);
  }

  return successResponse(res, "Championship record fetched successfully", {
    championshipRecord,
  });
});

export const getStudentChampionshipRecords = asyncHandler(async (req, res) => {
  const student = await validateStudentAccess({
    academyId: req.academyId,
    studentId: req.params.studentId,
  });

  if (!student) {
    return errorResponse(res, "Student not found in your academy", 404);
  }

  await student.populate([
    { path: "branch", select: "branchName branchCode" },
    { path: "batch", select: "batchName martialArt isActive" },
  ]);

  const championshipRecords = await ChampionshipRecord.find({
    academy: req.academyId,
    student: req.params.studentId,
    isDeleted: false,
  }).sort({ startDate: -1, createdAt: -1 });

  const summary = championshipRecords.reduce(
    (acc, item) => {
      acc.total += 1;
      acc.totalBouts += Number(item.totalBouts || 0);
      acc.boutsWon += Number(item.boutsWon || 0);
      acc.boutsLost += Number(item.boutsLost || 0);

      if (item.result === "Gold") acc.gold += 1;
      if (item.result === "Silver") acc.silver += 1;
      if (item.result === "Bronze") acc.bronze += 1;
      if (item.result === "Participation") acc.participation += 1;
      if (item.level === "National") acc.national += 1;
      if (item.level === "International") acc.international += 1;

      return acc;
    },
    {
      total: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      participation: 0,
      national: 0,
      international: 0,
      totalBouts: 0,
      boutsWon: 0,
      boutsLost: 0,
    }
  );

  summary.winPercentage =
    summary.totalBouts > 0
      ? Math.round((summary.boutsWon / summary.totalBouts) * 100)
      : 0;

  return successResponse(
    res,
    "Student championship history fetched successfully",
    {
      student,
      championshipRecords,
      summary,
    }
  );
});

export const updateChampionshipRecord = asyncHandler(async (req, res) => {
  const championshipRecord = await ChampionshipRecord.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!championshipRecord) {
    return errorResponse(res, "Championship record not found", 404);
  }

  const payload = buildPayload({
    ...championshipRecord.toObject(),
    ...req.body,
  });

  const validationError = await validatePayload({
    payload,
    academyId: req.academyId,
    requireStudent: Boolean(payload.student),
  });

  if (validationError) {
    return errorResponse(res, validationError, 400);
  }

  Object.assign(championshipRecord, payload, {
    updatedBy: req.user._id,
  });

  await championshipRecord.save();

  await createChampionshipTimeline({
    championshipRecord,
    userId: req.user._id,
  });

  return successResponse(res, "Championship record updated successfully", {
    championshipRecord,
  });
});

export const deleteChampionshipRecord = asyncHandler(async (req, res) => {
  const championshipRecord = await ChampionshipRecord.findOne({
    _id: req.params.id,
    academy: req.academyId,
    isDeleted: false,
  });

  if (!championshipRecord) {
    return errorResponse(res, "Championship record not found", 404);
  }

  championshipRecord.isDeleted = true;
  championshipRecord.deletedAt = new Date();
  championshipRecord.updatedBy = req.user._id;

  await championshipRecord.save();

  return successResponse(res, "Championship record deleted successfully", {
    championshipRecord,
  });
});
