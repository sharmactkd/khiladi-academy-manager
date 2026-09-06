import express from "express";
import { param, query } from "express-validator";
import { servePrivateMedia } from "../controllers/mediaController.js";
import validateRequest from "../middlewares/validateRequest.js";
import { privateMediaRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();
router.get(
  "/private/:encodedPath",
  privateMediaRateLimiter,
  param("encodedPath").isBase64({ urlSafe: true }).isLength({ min: 16, max: 512 }),
  query("expires").isInt({ min: 1 }),
  query("signature").isBase64({ urlSafe: true }).isLength({ min: 40, max: 64 }),
  validateRequest,
  servePrivateMedia
);
export default router;
