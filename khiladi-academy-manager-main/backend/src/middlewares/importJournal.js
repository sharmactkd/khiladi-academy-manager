import crypto from "node:crypto";
import { ImportSession, ImportChunk } from "../models/ImportSession.js";
import asyncHandler from "../utils/asyncHandler.js";

// Replay confirmed responses. A crash between a write and its journal completion
// is deliberately NOT retried: return an uncertain-state error for manual review.
export const importJournal = asyncHandler(async (req, res, next) => {
  const { importSessionId, importChunkKey } = req.body || {};
  if (!importSessionId) return next();
  if (!/^(students|attendance)-\d+$/.test(importChunkKey || "")) return res.status(400).json({ message: "Invalid import chunk key" });
  const session = await ImportSession.findOne({ _id: importSessionId, academy: req.academyId, createdBy: req.user._id });
  if (!session) return res.status(404).json({ message: "Import session not found" });
  const kind = req.baseUrl.endsWith("students") ? "students" : "attendance";
  if (!importChunkKey.startsWith(kind + "-") || (kind === "attendance" && session.mode === "students")) return res.status(400).json({ message: "Import mode does not match this request" });
  const hash = crypto.createHash("sha256").update(JSON.stringify(req.body)).digest("hex");
  let entry;
  try { entry = await ImportChunk.create({ _id: `${session._id}:${importChunkKey}`, session: session._id, key: importChunkKey, hash, status: "running" }); }
  catch (error) {
    if (error.code !== 11000) throw error;
    const previous = await ImportChunk.findOne({ session: session._id, key: importChunkKey });
    if (previous.hash !== hash) return res.status(409).json({ message: "Import settings changed. Start a new reviewed import." });
    if (previous.status !== "done") return res.status(409).json({ message: "This chunk is running or its save outcome is uncertain. Check records before retrying; it was not sent twice." });
    return res.status(previous.httpStatus).json(previous.response);
  }
  session.status = "importing"; await session.save();
  const send = res.json.bind(res);
  res.json = (body) => {
    const status = res.statusCode;
    return ImportChunk.updateOne({ _id: entry._id }, { $set: { status: "done", response: body, httpStatus: status } })
      .then(() => send(body))
      .catch(() => { res.status(503); return send({ success: false, message: "Save outcome uncertain: journal confirmation failed. Check records before retrying." }); });
  };
  next();
});
