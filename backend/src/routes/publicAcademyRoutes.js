import express from "express";
import { getPublicAcademy, listPublicAcademies } from "../controllers/publicAcademyController.js";
import { createPublicEnquiry } from "../controllers/academyEnquiryController.js";
import { publicEnquiryRateLimiter } from "../middlewares/rateLimiter.js";
const router = express.Router();
router.get("/", listPublicAcademies);
router.post("/:slug/enquiries", publicEnquiryRateLimiter, createPublicEnquiry);
router.get("/:slug", getPublicAcademy);
export default router;
