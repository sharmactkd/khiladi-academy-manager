import { verifyMediaStorageConnection } from "../src/services/mediaStorageService.js";

try {
  const result = await verifyMediaStorageConnection();
  if (!result.enabled) {
    throw new Error("CLOUDINARY_ENABLED is not true in backend/.env");
  }
  console.log("Cloudinary connection verified successfully");
} catch (error) {
  console.error(`Cloudinary connection failed: ${error.message}`);
  process.exitCode = 1;
}
