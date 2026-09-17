const targets = [process.env.FRONTEND_HEALTH_URL, process.env.BACKEND_HEALTH_URL].filter(Boolean);
if (!targets.length) throw new Error("Set FRONTEND_HEALTH_URL and/or BACKEND_HEALTH_URL");

const required = ["x-content-type-options", "referrer-policy", "permissions-policy", "strict-transport-security", "content-security-policy"];
let failed = false;
for (const target of targets) {
  const response = await fetch(target, { redirect: "follow" });
  const missing = required.filter((header) => !response.headers.get(header));
  const frameProtected = response.headers.get("x-frame-options") || /frame-ancestors/i.test(response.headers.get("content-security-policy") || "");
  if (!frameProtected) missing.push("frame protection");
  console.log(`${target}: HTTP ${response.status}; ${missing.length ? `missing ${missing.join(", ")}` : "security headers passed"}`);
  if (!response.ok || missing.length) failed = true;
}
if (failed) process.exit(1);
