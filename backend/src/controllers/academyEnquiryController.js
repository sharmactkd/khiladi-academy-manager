import Academy from "../models/Academy.js";
import AcademyEnquiry, { enquiryFingerprint } from "../models/AcademyEnquiry.js";
import AuditLog from "../models/AuditLog.js";
import PublicAcademyProfile from "../models/PublicAcademyProfile.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";

const clean = (value, max) => String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
const phoneDigits = (value) => String(value ?? "").replace(/\D/g, "");
const ownerAcademy = (req) => Academy.findOne(req.user.role === "super_admin" && req.query.academyId ? { _id: req.query.academyId } : { owner: req.user._id });

export const createPublicEnquiry = asyncHandler(async (req, res) => {
  if (req.body?.website) return successResponse(res, "Enquiry received", null, 201);
  const profile = await PublicAcademyProfile.findOne({ slug: req.params.slug, status: "published" }).select("+academy");
  if (!profile) return errorResponse(res, "Academy not found", 404);
  const name = clean(req.body?.name, 100); const phone = phoneDigits(req.body?.phone).slice(0, 15);
  const email = clean(req.body?.email, 180).toLowerCase(); const consentToContact = req.body?.consentToContact === true;
  if (name.length < 2 || phone.length < 10 || !consentToContact) return errorResponse(res, "Valid name, phone and contact consent are required", 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse(res, "Enter a valid email address", 400);
  const studentAge = req.body?.studentAge === "" || req.body?.studentAge == null ? null : Number(req.body.studentAge);
  if (studentAge !== null && (!Number.isInteger(studentAge) || studentAge < 3 || studentAge > 100)) return errorResponse(res, "Student age must be between 3 and 100", 400);
  const preferredDate = req.body?.preferredDate ? new Date(req.body.preferredDate) : null;
  if (preferredDate && (Number.isNaN(preferredDate.getTime()) || preferredDate < new Date(new Date().setHours(0, 0, 0, 0)))) return errorResponse(res, "Preferred date must be today or later", 400);
  const fingerprint = enquiryFingerprint({ academyId: profile.academy, phone, ip: req.ip });
  const duplicate = await AcademyEnquiry.exists({ academy: profile.academy, fingerprint, createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } });
  if (duplicate) return successResponse(res, "Your request is already with the academy", null, 200);
  await AcademyEnquiry.create({ academy: profile.academy, publicProfile: profile._id, name, phone, email, studentAge, martialArt: clean(req.body?.martialArt, 80), branchName: clean(req.body?.branchName, 120), message: clean(req.body?.message, 600), requestType: ["general", "trial_class", "admission"].includes(req.body?.requestType) ? req.body.requestType : "trial_class", preferredDate, consentToContact, fingerprint });
  return successResponse(res, "Enquiry sent successfully. The academy will contact you soon.", null, 201);
});

export const listMyEnquiries = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const page = Math.max(1, Number(req.query.page) || 1); const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = { academy: academy._id }; if (req.query.status) filter.status = req.query.status; if (req.query.requestType) filter.requestType = req.query.requestType;
  if (req.query.search) { const q = clean(req.query.search, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); filter.$or = [{ name: new RegExp(q, "i") }, { phone: new RegExp(q, "i") }, { email: new RegExp(q, "i") }]; }
  const [items, total, counts] = await Promise.all([
    AcademyEnquiry.find(filter).select("+ownerNotes").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AcademyEnquiry.countDocuments(filter), AcademyEnquiry.aggregate([{ $match: { academy: academy._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  return successResponse(res, "Admissions enquiries loaded", { items, counts: Object.fromEntries(counts.map(x => [x._id, x.count])), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getMyEnquiryDashboard = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const now = new Date(); const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(tomorrow); nextWeek.setDate(nextWeek.getDate() + 7);
  const staleBefore = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const active = { academy: academy._id, status: { $nin: ["converted", "closed"] } };
  const projection = "name phone email status priority followUpAt trialSchedule martialArt branchName requestType createdAt";
  const [overdue, today, upcomingTrials, stale, totals] = await Promise.all([
    AcademyEnquiry.find({ ...active, followUpAt: { $lt: now } }).select(projection).sort({ priority: -1, followUpAt: 1 }).limit(20).lean(),
    AcademyEnquiry.find({ ...active, followUpAt: { $gte: todayStart, $lt: tomorrow } }).select(projection).sort({ followUpAt: 1 }).limit(20).lean(),
    AcademyEnquiry.find({ ...active, "trialSchedule.date": { $gte: todayStart, $lt: nextWeek } }).select(projection).sort({ "trialSchedule.date": 1 }).limit(20).lean(),
    AcademyEnquiry.find({ ...active, status: { $in: ["new", "contacted"] }, followUpAt: null, createdAt: { $lt: staleBefore } }).select(projection).sort({ createdAt: 1 }).limit(20).lean(),
    AcademyEnquiry.aggregate([{ $match: { academy: academy._id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  return successResponse(res, "Admissions follow-up dashboard loaded", { overdue, today, upcomingTrials, stale, totals: Object.fromEntries(totals.map((item) => [item._id, item.count])), generatedAt: now });
});

export const getMyEnquiry = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const item = await AcademyEnquiry.findOne({ _id: req.params.id, academy: academy._id }).select("+ownerNotes +activity +communications").lean();
  if (!item) return errorResponse(res, "Enquiry not found", 404);
  return successResponse(res, "Enquiry details loaded", { item });
});

export const logMyEnquiryCommunication = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const channel = req.body?.channel;
  if (!["whatsapp", "phone", "email"].includes(channel)) return errorResponse(res, "Invalid communication channel", 400);
  const message = clean(req.body?.message, 1200); const template = clean(req.body?.template, 80);
  const sentAt = new Date();
  const item = await AcademyEnquiry.findOneAndUpdate(
    { _id: req.params.id, academy: academy._id },
    { lastContactedAt: sentAt, status: "contacted", $push: {
      communications: { $each: [{ channel, template, message, sentAt, actor: req.user._id }], $slice: -100 },
      activity: { $each: [{ type: "communication_sent", to: channel, at: sentAt, actor: req.user._id }], $slice: -100 },
    } },
    { new: true, runValidators: true }
  ).select("+ownerNotes +activity +communications");
  if (!item) return errorResponse(res, "Enquiry not found", 404);
  await AuditLog.create({ user: req.user._id, academy: academy._id, action: "LOG_ENQUIRY_COMMUNICATION", module: "admissions", ip: req.ip, userAgent: req.get("user-agent") || "", metadata: { enquiryId: String(item._id), channel, template } });
  return successResponse(res, "Communication logged", { item });
});

const csvCell = (value) => {
  let text = String(value ?? "").replace(/\r?\n/g, " ");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportMyEnquiries = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const items = await AcademyEnquiry.find({ academy: academy._id }).select("name phone email studentAge martialArt branchName requestType status priority followUpAt preferredDate createdAt").sort({ createdAt: -1 }).limit(5000).lean();
  const headers = ["Name", "Phone", "Email", "Age", "Martial Art", "Branch", "Request", "Status", "Priority", "Follow-up", "Preferred Date", "Received"];
  const rows = items.map((item) => [item.name, item.phone, item.email, item.studentAge, item.martialArt, item.branchName, item.requestType, item.status, item.priority, item.followUpAt?.toISOString() || "", item.preferredDate?.toISOString() || "", item.createdAt?.toISOString() || ""]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="academy-enquiries.csv"');
  return res.status(200).send(`\uFEFF${csv}`);
});

export const updateMyEnquiry = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const status = req.body?.status; const allowed = ["new", "contacted", "trial_scheduled", "trial_completed", "converted", "closed"];
  if (status !== undefined && !allowed.includes(status)) return errorResponse(res, "Invalid enquiry status", 400);
  const current = await AcademyEnquiry.findOne({ _id: req.params.id, academy: academy._id }).select("+ownerNotes +activity");
  if (!current) return errorResponse(res, "Enquiry not found", 404);
  const update = {}; const activity = [];
  if (status !== undefined) { update.status = status; if (status !== current.status) activity.push({ type: "status_changed", from: current.status, to: status, actor: req.user._id }); }
  if (req.body?.ownerNotes !== undefined) { update.ownerNotes = clean(req.body.ownerNotes, 1500); if (update.ownerNotes !== current.ownerNotes) activity.push({ type: "note_updated", actor: req.user._id }); }
  if (req.body?.priority !== undefined) {
    if (!["low", "normal", "high"].includes(req.body.priority)) return errorResponse(res, "Invalid priority", 400);
    update.priority = req.body.priority;
  }
  if (req.body?.followUpAt !== undefined) {
    const date = req.body.followUpAt ? new Date(req.body.followUpAt) : null;
    if (date && Number.isNaN(date.getTime())) return errorResponse(res, "Invalid follow-up date", 400);
    update.followUpAt = date; if (String(date || "") !== String(current.followUpAt || "")) activity.push({ type: "follow_up_set", to: date?.toISOString() || "", actor: req.user._id });
  }
  if (req.body?.trialSchedule !== undefined) {
    const schedule = req.body.trialSchedule || {};
    const date = schedule.date ? new Date(schedule.date) : null;
    if (date && Number.isNaN(date.getTime())) return errorResponse(res, "Invalid trial date", 400);
    update.trialSchedule = { date, startTime: clean(schedule.startTime, 8), endTime: clean(schedule.endTime, 8), branchName: clean(schedule.branchName, 120), notes: clean(schedule.notes, 500) };
    if (date && (!status || status === "new")) update.status = "trial_scheduled";
    if (date) activity.push({ type: "trial_scheduled", to: date.toISOString(), actor: req.user._id });
  }
  if (["contacted", "trial_scheduled", "trial_completed"].includes(status || update.status)) update.lastContactedAt = new Date();
  if (activity.length) update.$push = { activity: { $each: activity, $slice: -100 } };
  const item = await AcademyEnquiry.findOneAndUpdate({ _id: req.params.id, academy: academy._id }, update, { new: true, runValidators: true }).select("+ownerNotes");
  if (!item) return errorResponse(res, "Enquiry not found", 404);
  await AuditLog.create({ user: req.user._id, academy: academy._id, action: "UPDATE_ENQUIRY", module: "admissions", ip: req.ip, userAgent: req.get("user-agent") || "", metadata: { enquiryId: String(item._id), status: item.status } });
  return successResponse(res, "Enquiry updated", { item });
});

export const convertMyEnquiry = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const student = await Student.findOne({ _id: req.body?.studentId, academy: academy._id }).select("_id firstName lastName");
  if (!student) return errorResponse(res, "Student not found in this academy", 404);
  const item = await AcademyEnquiry.findOneAndUpdate(
    { _id: req.params.id, academy: academy._id },
    { status: "converted", convertedStudent: student._id, convertedAt: new Date(), followUpAt: null, $push: { activity: { type: "converted", to: String(student._id), actor: req.user._id } } },
    { new: true, runValidators: true }
  ).select("+ownerNotes");
  if (!item) return errorResponse(res, "Enquiry not found", 404);
  await AuditLog.create({ user: req.user._id, academy: academy._id, action: "CONVERT_ENQUIRY_TO_STUDENT", module: "admissions", ip: req.ip, userAgent: req.get("user-agent") || "", metadata: { enquiryId: String(item._id), studentId: String(student._id) } });
  return successResponse(res, "Lead converted to student", { item, student });
});

export const deleteMyEnquiry = asyncHandler(async (req, res) => {
  const academy = await ownerAcademy(req); if (!academy) return errorResponse(res, "Academy not found", 404);
  const item = await AcademyEnquiry.findOneAndDelete({ _id: req.params.id, academy: academy._id }); if (!item) return errorResponse(res, "Enquiry not found", 404);
  await AuditLog.create({ user: req.user._id, academy: academy._id, action: "DELETE_ENQUIRY", module: "admissions", ip: req.ip, userAgent: req.get("user-agent") || "", metadata: { enquiryId: String(item._id) } });
  return successResponse(res, "Enquiry deleted");
});
