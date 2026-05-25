import TournamentIntegration from "../models/TournamentIntegration.js";
import TournamentResultSync from "../models/TournamentResultSync.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  assertStudentBelongsToAcademy,
  getActiveTournamentIntegration,
  importTournamentResult,
  createIntegrationLog,
} from "../services/tournamentSyncService.js";
import { verifyWebhookSignature } from "../services/webhookVerificationService.js";

export const importTournamentResultManually = asyncHandler(async (req, res) => {
  const integration = await getActiveTournamentIntegration(req.academyId);

  try {
    const result = await importTournamentResult({
      academy: req.academyId,
      integration,
      payload: req.body,
      syncSource: "manual_import",
      userId: req.user._id,
    });

    return successResponse(
      res,
      result.duplicate
        ? "Tournament result already imported. Existing record updated safely."
        : "Tournament result imported successfully",
      result,
      result.duplicate ? 200 : 201
    );
  } catch (error) {
    await createIntegrationLog({
      academy: req.academyId,
      integration: integration?._id || null,
      direction: "outbound",
      type: "result_import",
      status: "failed",
      requestPayload: req.body,
      errorMessage: error.message,
      createdBy: req.user._id,
    });

    return errorResponse(
      res,
      error.message || "Failed to import tournament result",
      400
    );
  }
});

export const getTournamentResultSyncs = asyncHandler(async (req, res) => {
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
  if (req.query.syncSource) filter.syncSource = req.query.syncSource;
  if (req.query.syncStatus) filter.syncStatus = req.query.syncStatus;
  if (req.query.result) filter.result = req.query.result;

  const [resultSyncs, total] = await Promise.all([
    TournamentResultSync.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(
        "student",
        "firstName lastName admissionNumber gender phone beltRank status"
      )
      .populate("entrySync", "externalTournamentId externalPlayerId syncStatus")
      .populate("integration", "integrationName provider status")
      .populate("championshipRecord")
      .populate("importedBy", "name email role"),
    TournamentResultSync.countDocuments(filter),
  ]);

  return successResponse(res, "Tournament result syncs fetched successfully", {
    resultSyncs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getStudentTournamentResultSyncs = asyncHandler(async (req, res) => {
  await assertStudentBelongsToAcademy({
    studentId: req.params.studentId,
    academyId: req.academyId,
  });

  const resultSyncs = await TournamentResultSync.find({
    academy: req.academyId,
    student: req.params.studentId,
  })
    .sort({ date: -1, createdAt: -1 })
    .populate(
      "student",
      "firstName lastName admissionNumber gender phone beltRank status"
    )
    .populate("championshipRecord")
    .populate("entrySync", "externalTournamentId externalPlayerId syncStatus");

  return successResponse(
    res,
    "Student tournament result history fetched successfully",
    { resultSyncs }
  );
});

export const tournamentResultWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-khiladi-signature"];
  const academyId =
    req.headers["x-academy-id"] || req.body.academyId || req.query.academyId;

  if (!academyId) {
    return errorResponse(res, "Academy ID is required for webhook", 400);
  }

  const integration = await TournamentIntegration.findOne({
    academy: academyId,
    provider: "khiladi_tournament_manager",
    status: "active",
  }).select("+webhookSecretHash");

  if (!integration) {
    await createIntegrationLog({
      academy: academyId,
      direction: "inbound",
      type: "webhook",
      status: "failed",
      requestPayload: req.body,
      errorMessage: "Active integration not found",
    });

    return errorResponse(res, "Active integration not found", 404);
  }

  const rawBody = JSON.stringify(req.body || {});

  const isValidSignature = verifyWebhookSignature({
    payload: rawBody,
    signature,
    rawSecret: integration.webhookSecretHash,
  });

  if (!isValidSignature) {
    await createIntegrationLog({
      academy: academyId,
      integration: integration._id,
      direction: "inbound",
      type: "webhook",
      status: "failed",
      requestPayload: req.body,
      errorMessage: "Invalid webhook signature",
    });

    return errorResponse(res, "Invalid webhook signature", 401);
  }

  try {
    const result = await importTournamentResult({
      academy: academyId,
      integration,
      payload: req.body,
      syncSource: "webhook",
      userId: null,
    });

    return successResponse(
      res,
      result.duplicate
        ? "Webhook result already imported"
        : "Webhook result imported successfully",
      result,
      result.duplicate ? 200 : 201
    );
  } catch (error) {
    await createIntegrationLog({
      academy: academyId,
      integration: integration._id,
      direction: "inbound",
      type: "webhook",
      status: "failed",
      requestPayload: req.body,
      errorMessage: error.message,
    });

    return errorResponse(
      res,
      error.message || "Failed to process webhook result",
      400
    );
  }
});