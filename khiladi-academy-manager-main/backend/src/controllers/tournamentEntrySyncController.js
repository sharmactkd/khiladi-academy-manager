import TournamentEntrySync from "../models/TournamentEntrySync.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  assertStudentBelongsToAcademy,
  getActiveTournamentIntegration,
  submitTournamentEntry,
  createIntegrationLog,
} from "../services/tournamentSyncService.js";

export const createTournamentEntrySync = asyncHandler(async (req, res) => {
  const student = await assertStudentBelongsToAcademy({
    studentId: req.body.student,
    academyId: req.academyId,
  });

  const integration = await getActiveTournamentIntegration(req.academyId);

  try {
    const entrySync = await submitTournamentEntry({
      academy: req.academyId,
      student,
      integration,
      payload: req.body,
      userId: req.user._id,
      rawApiKey: req.body.apiKey || "",
    });

    return successResponse(
      res,
      "Tournament entry sync created successfully",
      { entrySync },
      201
    );
  } catch (error) {
    await createIntegrationLog({
      academy: req.academyId,
      integration: integration?._id || null,
      direction: "outbound",
      type: "entry_submit",
      status: "failed",
      requestPayload: req.body,
      errorMessage: error.message,
      createdBy: req.user._id,
    });

    return errorResponse(res, error.message || "Failed to submit entry", 400);
  }
});

export const getTournamentEntrySyncs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    academy: req.academyId,
  };

  if (req.query.student) filter.student = req.query.student;
  if (req.query.externalTournamentId) {
    filter.externalTournamentId = req.query.externalTournamentId;
  }
  if (req.query.syncStatus) filter.syncStatus = req.query.syncStatus;

  const [entrySyncs, total] = await Promise.all([
    TournamentEntrySync.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "student",
        "firstName lastName admissionNumber gender phone beltRank status"
      )
      .populate("integration", "integrationName provider status")
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role"),
    TournamentEntrySync.countDocuments(filter),
  ]);

  return successResponse(res, "Tournament entry syncs fetched successfully", {
    entrySyncs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getStudentTournamentEntrySyncs = asyncHandler(async (req, res) => {
  await assertStudentBelongsToAcademy({
    studentId: req.params.studentId,
    academyId: req.academyId,
  });

  const entrySyncs = await TournamentEntrySync.find({
    academy: req.academyId,
    student: req.params.studentId,
  })
    .sort({ createdAt: -1 })
    .populate(
      "student",
      "firstName lastName admissionNumber gender phone beltRank status"
    )
    .populate("integration", "integrationName provider status");

  return successResponse(
    res,
    "Student tournament entry syncs fetched successfully",
    { entrySyncs }
  );
});

export const cancelTournamentEntrySync = asyncHandler(async (req, res) => {
  const entrySync = await TournamentEntrySync.findOne({
    _id: req.params.id,
    academy: req.academyId,
  });

  if (!entrySync) {
    return errorResponse(res, "Tournament entry sync not found", 404);
  }

  if (entrySync.syncStatus === "cancelled") {
    return successResponse(res, "Tournament entry sync already cancelled", {
      entrySync,
    });
  }

  entrySync.syncStatus = "cancelled";
  entrySync.updatedBy = req.user._id;
  await entrySync.save();

  await createIntegrationLog({
    academy: req.academyId,
    integration: entrySync.integration,
    direction: "outbound",
    type: "entry_submit",
    status: "success",
    requestPayload: {
      entrySyncId: entrySync._id,
      action: "cancel",
    },
    responsePayload: {
      syncStatus: entrySync.syncStatus,
    },
    createdBy: req.user._id,
  });

  return successResponse(res, "Tournament entry sync cancelled successfully", {
    entrySync,
  });
});