import express from "express";
import { ImportSession, ImportChunk } from "../models/ImportSession.js";
import { protect } from "../middlewares/authMiddleware.js";
import { allowAcademyManagement } from "../middlewares/roleMiddleware.js";
import { resolveUserAcademy, requireResolvedAcademy } from "../middlewares/academyAccessMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();
router.use(protect, allowAcademyManagement, resolveUserAcademy, requireResolvedAcademy);
// Each operator sees/resumes their own imports; academy and user are server-derived.
const scope = req => ({ academy: req.academyId, createdBy: req.user._id });
router.get("/", asyncHandler(async (req, res) => {
  const sessions = await ImportSession.find(scope(req)).select("-plan").sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, data: sessions });
}));
router.post("/", asyncHandler(async (req, res) => {
  const { fileName, fileHash, mode, plan } = req.body;
  if (!plan || JSON.stringify(plan).length > 700000) return res.status(400).json({ message: "Import plan too large. Select fewer players." });
  const session = await ImportSession.create({ ...scope(req), fileName, fileHash, mode, plan });
  res.status(201).json({ success: true, data: session });
}));
router.get("/:id", asyncHandler(async (req, res) => {
  const session = await ImportSession.findOne({ ...scope(req), _id: req.params.id }).lean();
  if (!session) return res.status(404).json({ message: "Import session not found" });
  const chunks = await ImportChunk.find({ session: session._id }).select("key status httpStatus response updatedAt").lean();
  res.json({ success: true, data: { ...session, chunks } });
}));
router.patch("/:id", asyncHandler(async (req, res) => {
  if (!["paused", "completed", "partial", "failed"].includes(req.body.status)) return res.status(400).json({ message: "Invalid import state" });
  const session = await ImportSession.findOneAndUpdate({ ...scope(req), _id: req.params.id }, { $set: { status: req.body.status } }, { new: true });
  if (!session) return res.status(404).json({ message: "Import session not found" });
  res.json({ success: true, data: session });
}));
export default router;
