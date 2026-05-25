import TournamentIntegration from "../models/TournamentIntegration.js";
import IntegrationLog from "../models/IntegrationLog.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  generateSecureToken,
  hashSecret,
} from "../services/webhookVerificationService.js";
import { createIntegrationLog } from "../services/tournamentSyncService.js";

const safeIntegrationResponse = (integration) => {
  if (!integration) return null;

  return {
    id: integration._id,
    academy: integration.academy,
    integrationName: integration.integrationName,
    provider: integration.provider,
    apiBaseUrl: integration.apiBaseUrl,
    status: integration.status,
    lastSyncAt: integration.lastSyncAt,
    lastError: integration.lastError,
    createdBy: integration.createdBy,
    updatedBy: integration.updatedBy,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  };
};

export const connectTournamentIntegration = asyncHandler(async (req, res) => {
  const apiKey = generateSecureToken("khiladi_api");
  const webhookSecret = generateSecureToken("khiladi_webhook");

  const payload = {
    academy: req.academyId,
    integrationName:
      req.body.integrationName?.trim() || "KHILADI Tournament Manager",
    provider: "khiladi_tournament_manager",
    apiBaseUrl: req.body.apiBaseUrl?.trim() || "",
    apiKeyHash: hashSecret(apiKey),
    webhookSecretHash: hashSecret(webhookSecret),
    status: "active",
    lastError: "",
    createdBy: req.user._id,
    updatedBy: req.user._id,
  };

  const integration = await TournamentIntegration.findOneAndUpdate(
    {
      academy: req.academyId,
      provider: "khiladi_tournament_manager",
    },
    {
      $set: payload,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  await createIntegrationLog({
    academy: req.academyId,
    integration: integration._id,
    direction: "outbound",
    type: "connect",
    status: "success",
    requestPayload: {
      integrationName: payload.integrationName,
      apiBaseUrl: payload.apiBaseUrl,
    },
    responsePayload: {
      integrationId: integration._id,
      status: integration.status,
    },
    createdBy: req.user._id,
  });

  return successResponse(
    res,
    "Tournament integration connected successfully. Copy API key and webhook secret now. They will not be shown again.",
    {
      integration: safeIntegrationResponse(integration),
      credentials: {
        apiKey,
        webhookSecret,
      },
    },
    201
  );
});

export const getTournamentIntegrationStatus = asyncHandler(async (req, res) => {
  const integration = await TournamentIntegration.findOne({
    academy: req.academyId,
    provider: "khiladi_tournament_manager",
  });

  if (!integration) {
    return successResponse(res, "Tournament integration is not connected", {
      connected: false,
      integration: null,
    });
  }

  await createIntegrationLog({
    academy: req.academyId,
    integration: integration._id,
    direction: "outbound",
    type: "status_check",
    status: "success",
    requestPayload: {},
    responsePayload: {
      status: integration.status,
    },
    createdBy: req.user._id,
  });

  return successResponse(res, "Tournament integration status fetched", {
    connected: integration.status === "active",
    integration: safeIntegrationResponse(integration),
  });
});

export const disconnectTournamentIntegration = asyncHandler(async (req, res) => {
  const integration = await TournamentIntegration.findOne({
    academy: req.academyId,
    provider: "khiladi_tournament_manager",
  });

  if (!integration) {
    return errorResponse(res, "Tournament integration not found", 404);
  }

  integration.status = "inactive";
  integration.updatedBy = req.user._id;
  await integration.save();

  await createIntegrationLog({
    academy: req.academyId,
    integration: integration._id,
    direction: "outbound",
    type: "disconnect",
    status: "success",
    requestPayload: {},
    responsePayload: {
      status: integration.status,
    },
    createdBy: req.user._id,
  });

  return successResponse(res, "Tournament integration disconnected", {
    integration: safeIntegrationResponse(integration),
  });
});

export const regenerateTournamentIntegrationKey = asyncHandler(
  async (req, res) => {
    const integration = await TournamentIntegration.findOne({
      academy: req.academyId,
      provider: "khiladi_tournament_manager",
    }).select("+apiKeyHash +webhookSecretHash");

    if (!integration) {
      return errorResponse(res, "Tournament integration not found", 404);
    }

    const apiKey = generateSecureToken("khiladi_api");
    const webhookSecret = generateSecureToken("khiladi_webhook");

    integration.apiKeyHash = hashSecret(apiKey);
    integration.webhookSecretHash = hashSecret(webhookSecret);
    integration.status = "active";
    integration.lastError = "";
    integration.updatedBy = req.user._id;

    await integration.save();

    await createIntegrationLog({
      academy: req.academyId,
      integration: integration._id,
      direction: "outbound",
      type: "regenerate_key",
      status: "success",
      requestPayload: {},
      responsePayload: {
        integrationId: integration._id,
        status: integration.status,
      },
      createdBy: req.user._id,
    });

    return successResponse(
      res,
      "Tournament integration keys regenerated. Copy them now. They will not be shown again.",
      {
        integration: safeIntegrationResponse(integration),
        credentials: {
          apiKey,
          webhookSecret,
        },
      }
    );
  }
);

export const getTournamentIntegrationLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    academy: req.academyId,
  };

  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  if (req.query.fromDate || req.query.toDate) {
    filter.createdAt = {};

    if (req.query.fromDate) {
      filter.createdAt.$gte = new Date(req.query.fromDate);
    }

    if (req.query.toDate) {
      filter.createdAt.$lte = new Date(req.query.toDate);
    }
  }

  const [logs, total] = await Promise.all([
    IntegrationLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role")
      .populate("integration", "integrationName provider status"),
    IntegrationLog.countDocuments(filter),
  ]);

  return successResponse(res, "Integration logs fetched successfully", {
    logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});