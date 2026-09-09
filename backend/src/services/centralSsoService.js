import jwt from "jsonwebtoken";
import env from "../config/env.js";

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

export const exchangeCentralCode = async ({ code, codeVerifier }) => {
  const response = await fetch(`${env.KHILADI_IDENTITY_API_URL}/api/sso/exchange`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Khiladi-Request": "identity-v1",
    },
    body: JSON.stringify({
      code,
      codeVerifier,
      product: "academy",
      redirectUri: env.ACADEMY_SSO_REDIRECT_URI,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.data?.assertion) {
    throw fail(payload.message || "Central SSO code exchange failed", response.status || 502);
  }
  return payload.data.assertion;
};

export const verifyCentralAssertion = (assertion) => {
  if (!env.ACADEMY_SSO_ASSERTION_SECRET) throw fail("Academy SSO is not configured", 503);
  let claims;
  try {
    claims = jwt.verify(assertion, env.ACADEMY_SSO_ASSERTION_SECRET, {
      algorithms: ["HS256"],
      issuer: "https://khiladi-khoj.com",
      audience: "khiladi-academy",
      clockTolerance: 5,
    });
  } catch {
    throw fail("Central SSO assertion is invalid or expired", 401);
  }
  if (claims.type !== "khiladi_sso" || !claims.sub || !claims.email || claims.emailVerified !== true) {
    throw fail("Central SSO identity is incomplete or unverified", 403);
  }
  return claims;
};
