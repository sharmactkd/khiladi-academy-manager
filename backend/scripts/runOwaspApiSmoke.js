const base = String(process.env.SECURITY_TEST_BASE_URL || "").replace(/\/+$/, "");
if (!base) throw new Error("SECURITY_TEST_BASE_URL is required");
const host = new URL(base).hostname;
const local = ["localhost", "127.0.0.1", "::1"].includes(host);
if (!local && process.env.SECURITY_TEST_AUTHORIZED !== "true") {
  throw new Error("Refusing remote security testing without SECURITY_TEST_AUTHORIZED=true");
}

const checks = [];
const record = (name, pass, detail = "") => checks.push({ name, pass, detail });
const health = await fetch(`${base}/api/health`, { headers: { Origin: "https://attacker.invalid" }, redirect: "manual" });
record("health endpoint", health.ok, String(health.status));
record("no technology disclosure", !health.headers.has("x-powered-by"));
record("nosniff", health.headers.get("x-content-type-options") === "nosniff");
record("hostile CORS origin rejected", health.headers.get("access-control-allow-origin") !== "https://attacker.invalid");
record("request correlation", Boolean(health.headers.get("x-request-id")));
const unknown = await fetch(`${base}/api/security-smoke-not-found`, { redirect: "manual" });
record("unknown API route is not exposed", unknown.status === 404, String(unknown.status));
console.table(checks);
if (checks.some((item) => !item.pass)) process.exitCode = 1;
