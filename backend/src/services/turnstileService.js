import env from "../config/env.js";

export const verifyTurnstile = async ({ token, ip }) => {
  if (!env.TURNSTILE_SECRET_KEY) return { success: true, skipped: true };
  if (!token) return { success: false, reason: "missing-token" };
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set("remoteip", ip);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(env.TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    if (!response.ok) return { success: false, reason: "verification-unavailable" };
    const result = await response.json();
    return { success: result.success === true, reason: result["error-codes"]?.join(",") || "" };
  } catch {
    return { success: false, reason: "verification-unavailable" };
  } finally {
    clearTimeout(timeout);
  }
};
