import mongoose from "mongoose";

import Academy from "../models/Academy.js";
import Student from "../models/Student.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import TournamentIntegration from "../models/TournamentIntegration.js";
import TournamentEntrySync from "../models/TournamentEntrySync.js";
import TournamentResultSync from "../models/TournamentResultSync.js";
import IntegrationLog from "../models/IntegrationLog.js";

import { createChampionshipTimeline } from "./timelineService.js";
import { submitEntry } from "./tournamentApiClient.js";

const EVENT_TYPES = ["kyorugi", "poomsae", "demo", "other"];
const RESULTS = ["gold", "silver", "bronze", "participated", "disqualified"];
const LEVELS = ["district", "state", "national", "international", "open"];

const safePayload = (payload = {}) => {
  const cloned = { ...payload };
  delete cloned.apiKey;
  delete cloned.webhookSecret;
  delete cloned.apiKeyHash;
  delete cloned.webhookSecretHash;
  return cloned;
};

export const createIntegrationLog = async ({
  academy = null,
  integration = null,
  direction,
  type,
  status,
  requestPayload = {},
  responsePayload = {},
  errorMessage = "",
  createdBy = null,
}) => {
  return IntegrationLog.create({
    academy,
    integration,
    direction,
    type,
    status,
    requestPayload: safePayload(requestPayload),
    responsePayload: safePayload(responsePayload),
    errorMessage,
    createdBy,
  });
};

export const getAcademyForUser = async (user) => {
  if (!user) return null;

  if (user.role === "super_admin") {
    return Academy.findOne({ isActive: true }).sort({ createdAt: -1 });
  }

  return Academy.findOne({ owner: user._id, isActive: true });
};

export const assertStudentBelongsToAcademy = async ({ studentId, academyId }) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error("Invalid student ID");
  }

  const student = await Student.findOne({
    _id: studentId,
    academy: academyId,
  });

  if (!student) {
    throw new Error("Student not found in this academy");
  }

  return student;
};

export const getActiveTournamentIntegration = async (academyId) => {
  return TournamentIntegration.findOne({
    academy: academyId,
    provider: "khiladi_tournament_manager",
    status: "active",
  });
};

export const submitTournamentEntry = async ({
  academy,
  student,
  integration = null,
  payload,
  userId = null,
  rawApiKey = "",
}) => {
  const duplicate = await TournamentEntrySync.findOne({
    academy,
    student: student._id,
    externalTournamentId: payload.externalTournamentId,
    eventType: payload.eventType,
    weightCategory: payload.weightCategory || "",
    syncStatus: { $ne: "cancelled" },
  });

  if (duplicate) {
    throw new Error(
      "This student is already submitted for this tournament, event and weight category"
    );
  }

  const entrySync = await TournamentEntrySync.create({
    academy,
    student: student._id,
    integration: integration?._id || null,
    externalTournamentId: payload.externalTournamentId,
    tournamentName: payload.tournamentName,
    eventType: payload.eventType || "kyorugi",
    ageCategory: payload.ageCategory || "",
    weightCategory: payload.weightCategory || "",
    gender: payload.gender || student.gender,
    syncStatus: "pending",
    submittedAt: new Date(),
    metadata: payload.metadata || {},
    createdBy: userId,
    updatedBy: userId,
  });

  await createIntegrationLog({
    academy,
    integration: integration?._id || null,
    direction: "outbound",
    type: "entry_submit",
    status: "pending",
    requestPayload: payload,
    createdBy: userId,
  });

  if (!integration?.apiBaseUrl) {
    return entrySync;
  }

  const externalPayload = {
    academyStudentId: String(student._id),
    student: {
      id: String(student._id),
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: payload.gender || student.gender,
      dateOfBirth: student.dateOfBirth,
      phone: student.phone,
      email: student.email,
      martialArt: student.martialArt,
      beltRank: student.beltRank,
    },
    tournament: {
      externalTournamentId: payload.externalTournamentId,
      tournamentName: payload.tournamentName,
    },
    entry: {
      eventType: payload.eventType || "kyorugi",
      ageCategory: payload.ageCategory || "",
      weightCategory: payload.weightCategory || "",
      gender: payload.gender || student.gender,
    },
  };

  const externalResponse = await submitEntry({
    apiBaseUrl: integration.apiBaseUrl,
    apiKey: rawApiKey,
    payload: externalPayload,
  });

  if (externalResponse.success) {
    entrySync.syncStatus = "synced";
    entrySync.externalPlayerId =
      externalResponse.data?.externalPlayerId ||
      externalResponse.data?.playerId ||
      entrySync.externalPlayerId;
    entrySync.lastSyncedAt = new Date();
    entrySync.metadata = {
      ...(entrySync.metadata || {}),
      externalResponse: externalResponse.data || {},
    };

    await entrySync.save();

    integration.lastSyncAt = new Date();
    integration.lastError = "";
    await integration.save();

    await createIntegrationLog({
      academy,
      integration: integration._id,
      direction: "outbound",
      type: "entry_submit",
      status: "success",
      requestPayload: externalPayload,
      responsePayload: externalResponse,
      createdBy: userId,
    });

    return entrySync;
  }

  entrySync.syncStatus = "failed";
  entrySync.metadata = {
    ...(entrySync.metadata || {}),
    externalError: externalResponse.message,
    externalResponse: externalResponse.data,
  };

  await entrySync.save();

  integration.status = "error";
  integration.lastError = externalResponse.message;
  await integration.save();

  await createIntegrationLog({
    academy,
    integration: integration._id,
    direction: "outbound",
    type: "entry_submit",
    status: "failed",
    requestPayload: externalPayload,
    responsePayload: externalResponse,
    errorMessage: externalResponse.message,
    createdBy: userId,
  });

  return entrySync;
};

export const normalizeTournamentResult = (payload = {}) => {
  const normalized = {
    externalTournamentId: String(payload.externalTournamentId || "").trim(),
    externalPlayerId: String(payload.externalPlayerId || "").trim(),
    academyStudentId: String(payload.academyStudentId || "").trim(),
    studentId: String(payload.studentId || "").trim(),
    tournamentName: String(payload.tournamentName || "").trim(),
    eventType: String(payload.eventType || "kyorugi").trim().toLowerCase(),
    ageCategory: String(payload.ageCategory || "").trim(),
    weightCategory: String(payload.weightCategory || "").trim(),
    level: String(payload.level || "open").trim().toLowerCase(),
    result: String(payload.result || "").trim().toLowerCase(),
    date: payload.date ? new Date(payload.date) : null,
    venue: String(payload.venue || "").trim(),
    organizer: String(payload.organizer || "").trim(),
    remarks: String(payload.remarks || "").trim(),
  };

  if (!normalized.externalTournamentId) {
    throw new Error("External tournament ID is required");
  }

  if (!normalized.tournamentName) {
    throw new Error("Tournament name is required");
  }

  if (!EVENT_TYPES.includes(normalized.eventType)) {
    throw new Error("Invalid event type");
  }

  if (!LEVELS.includes(normalized.level)) {
    throw new Error("Invalid tournament level");
  }

  if (!RESULTS.includes(normalized.result)) {
    throw new Error("Invalid tournament result");
  }

  if (!normalized.date || Number.isNaN(normalized.date.getTime())) {
    throw new Error("Valid result date is required");
  }

  return normalized;
};

export const findStudentForExternalResult = async ({ academy, result }) => {
  if (result.externalTournamentId && result.externalPlayerId) {
    const entrySync = await TournamentEntrySync.findOne({
      academy,
      externalTournamentId: result.externalTournamentId,
      externalPlayerId: result.externalPlayerId,
    });

    if (entrySync) {
      const student = await Student.findOne({
        _id: entrySync.student,
        academy,
      });

      if (student) {
        return { student, entrySync };
      }
    }
  }

  const directStudentId = result.academyStudentId || result.studentId;

  if (directStudentId && mongoose.Types.ObjectId.isValid(directStudentId)) {
    const student = await Student.findOne({
      _id: directStudentId,
      academy,
    });

    if (student) {
      return { student, entrySync: null };
    }
  }

  throw new Error("Matching student was not found for this tournament result");
};

export const createOrUpdateChampionshipRecordFromResult = async ({
  academy,
  student,
  result,
  userId = null,
}) => {
  const filter = {
    academy,
    student: student._id,
    championshipName: result.tournamentName,
    eventType: result.eventType,
    ageCategory: result.ageCategory || "",
    weightCategory: result.weightCategory || "",
    date: result.date,
    isDeleted: false,
  };

  const championshipRecord = await ChampionshipRecord.findOneAndUpdate(
    filter,
    {
      $set: {
        level: result.level,
        result: result.result,
        venue: result.venue || "",
        organizer: result.organizer || "",
        remarks: result.remarks || "",
        updatedBy: userId,
      },
      $setOnInsert: {
        academy,
        student: student._id,
        championshipName: result.tournamentName,
        eventType: result.eventType,
        ageCategory: result.ageCategory || "",
        weightCategory: result.weightCategory || "",
        date: result.date,
        createdBy: userId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  await createChampionshipTimeline({
    championshipRecord,
    userId,
  });

  return championshipRecord;
};

export const importTournamentResult = async ({
  academy,
  integration = null,
  payload,
  syncSource = "manual_import",
  userId = null,
}) => {
  const normalizedResult = normalizeTournamentResult(payload);
  const { student, entrySync } = await findStudentForExternalResult({
    academy,
    result: normalizedResult,
  });

  let existingResultSync = null;

  if (normalizedResult.externalPlayerId) {
    existingResultSync = await TournamentResultSync.findOne({
      academy,
      externalTournamentId: normalizedResult.externalTournamentId,
      externalPlayerId: normalizedResult.externalPlayerId,
      result: normalizedResult.result,
    });
  }

  const championshipRecord = await createOrUpdateChampionshipRecordFromResult({
    academy,
    student,
    result: normalizedResult,
    userId,
  });

  if (existingResultSync) {
    existingResultSync.syncStatus = "duplicate";
    existingResultSync.championshipRecord = championshipRecord._id;
    existingResultSync.rawPayload = payload;
    await existingResultSync.save();

    await createIntegrationLog({
      academy,
      integration: integration?._id || entrySync?.integration || null,
      direction: syncSource === "webhook" ? "inbound" : "outbound",
      type: syncSource === "webhook" ? "webhook" : "result_import",
      status: "duplicate",
      requestPayload: payload,
      responsePayload: {
        tournamentResultSync: existingResultSync._id,
        championshipRecord: championshipRecord._id,
      },
      createdBy: userId,
    });

    return {
      resultSync: existingResultSync,
      championshipRecord,
      duplicate: true,
    };
  }

  const resultSync = await TournamentResultSync.create({
    academy,
    student: student._id,
    entrySync: entrySync?._id || null,
    integration: integration?._id || entrySync?.integration || null,
    externalTournamentId: normalizedResult.externalTournamentId,
    externalPlayerId: normalizedResult.externalPlayerId || "",
    tournamentName: normalizedResult.tournamentName,
    eventType: normalizedResult.eventType,
    ageCategory: normalizedResult.ageCategory,
    weightCategory: normalizedResult.weightCategory,
    level: normalizedResult.level,
    result: normalizedResult.result,
    date: normalizedResult.date,
    venue: normalizedResult.venue,
    organizer: normalizedResult.organizer,
    remarks: normalizedResult.remarks,
    championshipRecord: championshipRecord._id,
    syncSource,
    syncStatus: "imported",
    rawPayload: payload,
    importedBy: userId,
  });

  await createIntegrationLog({
    academy,
    integration: integration?._id || entrySync?.integration || null,
    direction: syncSource === "webhook" ? "inbound" : "outbound",
    type: syncSource === "webhook" ? "webhook" : "result_import",
    status: "success",
    requestPayload: payload,
    responsePayload: {
      tournamentResultSync: resultSync._id,
      championshipRecord: championshipRecord._id,
    },
    createdBy: userId,
  });

  return {
    resultSync,
    championshipRecord,
    duplicate: false,
  };
};