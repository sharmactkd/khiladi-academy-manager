import axios from "axios";
import { assertAllowedTournamentApiUrl } from "../utils/integrationSecurity.js";

const normalizeBaseUrl = (apiBaseUrl) => {
  const value = String(apiBaseUrl || "").trim();

  if (!value) {
    throw new Error("Tournament API base URL is not configured");
  }

  return assertAllowedTournamentApiUrl(value);
};

export const createTournamentApiClient = ({ apiBaseUrl, apiKey }) => {
  const baseURL = normalizeBaseUrl(apiBaseUrl);

  const headers = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  return axios.create({
    baseURL,
    timeout: 15000,
    maxRedirects: 0,
    maxContentLength: 1024 * 1024,
    maxBodyLength: 1024 * 1024,
    headers,
  });
};

export const submitEntry = async ({ apiBaseUrl, apiKey, payload }) => {
  try {
    const client = createTournamentApiClient({ apiBaseUrl, apiKey });

    const response = await client.post("/api/external/academy-entries", payload);

    return {
      success: true,
      data: response.data?.data || response.data || {},
      message: response.data?.message || "Entry submitted successfully",
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to submit entry to Tournament Manager";

    return {
      success: false,
      data: error.response?.data || null,
      message,
    };
  }
};
