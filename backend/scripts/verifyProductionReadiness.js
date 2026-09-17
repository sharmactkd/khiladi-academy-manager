import mongoose from "mongoose";

const uri = String(process.env.MONGO_URI || "");
const failures = [];
if (!uri) failures.push("MONGO_URI is missing");
if (/localhost|127\.0\.0\.1/i.test(uri)) failures.push("Production database cannot use localhost");
if (/\/admin(?:\?|$)/i.test(uri)) failures.push("Application must not use the admin database");
if (!/[?&]appName=/i.test(uri)) failures.push("MONGO_URI should include appName=khiladi-academy-manager");
if (!process.env.REDIS_URL) failures.push("REDIS_URL is missing");
if (!process.env.TURNSTILE_SECRET_KEY) failures.push("TURNSTILE_SECRET_KEY is missing");

if (!failures.length) {
  try {
    const connection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const status = await connection.connection.db.command({ connectionStatus: 1, showPrivileges: false });
    const roles = status.authInfo?.authenticatedUserRoles || [];
    const unsafeRoles = roles.filter((item) => ["root", "dbOwner", "readWriteAnyDatabase", "userAdminAnyDatabase"].includes(item.role));
    if (unsafeRoles.length) failures.push(`Database user has excessive roles: ${unsafeRoles.map((item) => item.role).join(", ")}`);
  } catch (error) {
    failures.push(`Database readiness check failed: ${error.message}`);
  } finally {
    await mongoose.disconnect();
  }
}

if (failures.length) {
  console.error("Production readiness failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("Production database, Redis and anti-bot readiness checks passed.");
