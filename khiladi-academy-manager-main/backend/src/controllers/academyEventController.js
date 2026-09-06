import mongoose from "mongoose";

import AcademyEvent from "../models/AcademyEvent.js";
import AcademyEventParticipant from "../models/AcademyEventParticipant.js";
import BeltTest from "../models/BeltTest.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import Student from "../models/Student.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";

const EVENT_TYPES = ["belt_test", "championship"];
const EVENT_STATUSES = ["draft", "open", "finalized", "cancelled"];
const PARTICIPANT_FIELDS = [
  "status", "feeOverride", "discount", "amountPaid", "paymentStatus",
  "paymentMode", "paymentDate", "receiptNumber", "feeNote", "currentBelt",
  "currentDanRank", "promotedToBelt", "promotedToDanRank", "marks", "outOf",
  "result", "examinerRemarks", "certificateNumber", "entries",
];

const clean = (value) => String(value ?? "").trim();
const idOf = (value) => value?._id || value;
const numeric = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

const eventPayload = (body = {}) => ({
  type: clean(body.type).toLowerCase(),
  name: clean(body.name),
  branch: body.branch || null,
  status: EVENT_STATUSES.includes(body.status) ? body.status : "draft",
  startDate: body.startDate,
  endDate: body.endDate || body.startDate,
  venue: clean(body.venue),
  organizer: clean(body.organizer),
  examinerName: clean(body.examinerName),
  sport: clean(body.sport) || "Taekwondo",
  level: clean(body.level),
  country: clean(body.country) || "India",
  state: clean(body.state),
  city: clean(body.city),
  notes: clean(body.notes),
  feeRules: {
    defaultFee: numeric(body.feeRules?.defaultFee ?? body.defaultFee),
    additionalEntryFee: numeric(body.feeRules?.additionalEntryFee ?? body.additionalEntryFee),
    currencyCode: clean(body.feeRules?.currencyCode ?? body.currencyCode).toUpperCase() || "INR",
    currencySymbol: clean(body.feeRules?.currencySymbol ?? body.currencySymbol) || "₹",
    paymentDeadline: body.feeRules?.paymentDeadline || body.paymentDeadline || null,
  },
  settings: body.settings && typeof body.settings === "object" ? body.settings : {},
});

const participantPayload = ({ source = {}, event, student, userId }) => {
  const baseFee = numeric(event.feeRules?.defaultFee);
  const feeOverride = source.feeOverride === "" || source.feeOverride === null || source.feeOverride === undefined
    ? null
    : numeric(source.feeOverride);

  const entry = source.entries?.[0] || {};
  return {
    academy: event.academy,
    event: event._id,
    student: student._id,
    baseFeeSnapshot: baseFee,
    additionalEntryFeeSnapshot: numeric(event.feeRules?.additionalEntryFee),
    feeOverride,
    discount: numeric(source.discount),
    amountPaid: numeric(source.amountPaid),
    paymentMode: source.paymentMode || "",
    paymentDate: source.paymentDate || null,
    feeNote: clean(source.feeNote),
    currentBelt: clean(source.currentBelt || student.beltRank),
    currentDanRank: clean(source.currentDanRank || student.danRank),
    promotedToBelt: clean(source.promotedToBelt),
    promotedToDanRank: clean(source.promotedToDanRank),
    marks: source.marks === "" || source.marks === undefined ? null : numeric(source.marks),
    outOf: source.outOf === "" || source.outOf === undefined ? null : numeric(source.outOf),
    result: ["pending", "pass", "fail"].includes(source.result) ? source.result : "pending",
    examinerRemarks: clean(source.examinerRemarks),
    certificateNumber: clean(source.certificateNumber),
    entries: event.type === "championship"
      ? (Array.isArray(source.entries) && source.entries.length ? source.entries : [{
          label: "Primary Entry",
          eventType: entry.eventType || "Kyorugi",
          gender: entry.gender || student.gender || "Male",
          ageCategory: entry.ageCategory || student.ageCategory || "Senior",
          beltCategory: entry.beltCategory || student.beltRank || "",
          result: entry.result || "Participation",
        }])
      : [],
    createdBy: userId,
    updatedBy: userId,
  };
};

const populateEvent = (query) => query
  .populate("branch", "branchName currencyCode currencySymbol country")
  .populate("createdBy", "name email")
  .populate("updatedBy", "name email");

const populateParticipants = (query) => query
  .populate({
    path: "student",
    select: "firstName lastName name admissionNumber studentCode phone status beltRank danRank gender ageCategory martialArt branch batch photo profilePhoto",
    populate: [
      { path: "batch", select: "batchName martialArt monthlyFee" },
      { path: "branch", select: "branchName currencyCode currencySymbol" },
    ],
  })
  .sort({ createdAt: 1 });

const eventSummary = (participants = []) => participants.reduce(
  (summary, item) => {
    summary.participants += 1;
    summary.payable += Number(item.finalPayable || 0);
    summary.collected += Number(item.amountPaid || 0);
    summary.pending += Number(item.pendingAmount || 0);
    summary[item.paymentStatus] = (summary[item.paymentStatus] || 0) + 1;
    return summary;
  },
  { participants: 0, payable: 0, collected: 0, pending: 0, paid: 0, partial: 0, unpaid: 0, waived: 0 }
);

const getOwnedEvent = (academyId, eventId) => {
  if (!mongoose.Types.ObjectId.isValid(String(eventId || ""))) return null;
  return AcademyEvent.findOne({ _id: eventId, academy: academyId, isDeleted: false });
};

export const createAcademyEvent = asyncHandler(async (req, res) => {
  const payload = eventPayload(req.body);
  if (!EVENT_TYPES.includes(payload.type)) return errorResponse(res, "Event type is invalid", 400);
  if (!payload.name) return errorResponse(res, "Event name is required", 400);
  if (!payload.startDate) return errorResponse(res, "Event date is required", 400);

  const requestedParticipants = Array.isArray(req.body.participants) ? req.body.participants : [];
  const requestedStudentIds = [...new Set(requestedParticipants.map((item) => String(idOf(item.student))).filter(Boolean))];
  if (!requestedStudentIds.length) return errorResponse(res, "Select at least one participant", 400);

  const students = await Student.find({
    academy: req.academyId,
    _id: { $in: requestedStudentIds },
    status: { $in: ["active", "inactive"] },
  });
  if (students.length !== requestedStudentIds.length) return errorResponse(res, "One or more students are invalid", 400);

  const event = await AcademyEvent.create({
    ...payload,
    academy: req.academyId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  try {
    const studentMap = new Map(students.map((student) => [String(student._id), student]));
    const participantDocuments = requestedParticipants.map((source) => participantPayload({
      source,
      event,
      student: studentMap.get(String(idOf(source.student))),
      userId: req.user._id,
    }));
    await AcademyEventParticipant.create(participantDocuments);
  } catch (error) {
    await AcademyEvent.deleteOne({ _id: event._id });
    throw error;
  }

  const participants = await populateParticipants(AcademyEventParticipant.find({ event: event._id, isDeleted: false }));
  return successResponse(res, "Event and participants created successfully", {
    event,
    participants,
    summary: eventSummary(participants),
  }, 201);
});

export const getAcademyEvents = asyncHandler(async (req, res) => {
  const filter = { academy: req.academyId, isDeleted: false };
  if (EVENT_TYPES.includes(req.query.type)) filter.type = req.query.type;
  if (EVENT_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.search) filter.name = { $regex: clean(req.query.search), $options: "i" };

  const events = await populateEvent(AcademyEvent.find(filter).sort({ startDate: -1, createdAt: -1 })).lean();
  const ids = events.map((event) => event._id);
  const grouped = await AcademyEventParticipant.aggregate([
    { $match: { event: { $in: ids }, isDeleted: false } },
    { $group: { _id: "$event", participants: { $sum: 1 }, payable: { $sum: "$finalPayable" }, collected: { $sum: "$amountPaid" }, pending: { $sum: "$pendingAmount" } } },
  ]);
  const summaryMap = new Map(grouped.map((item) => [String(item._id), item]));
  return successResponse(res, "Events fetched successfully", {
    events: events.map((event) => ({ ...event, summary: summaryMap.get(String(event._id)) || eventSummary([]) })),
  });
});

export const getAcademyEventById = asyncHandler(async (req, res) => {
  const event = await populateEvent(getOwnedEvent(req.academyId, req.params.id));
  if (!event) return errorResponse(res, "Event not found", 404);
  const participants = await populateParticipants(AcademyEventParticipant.find({ event: event._id, isDeleted: false }));
  return successResponse(res, "Event fetched successfully", { event, participants, summary: eventSummary(participants) });
});

export const updateAcademyEvent = asyncHandler(async (req, res) => {
  const event = await getOwnedEvent(req.academyId, req.params.id);
  if (!event) return errorResponse(res, "Event not found", 404);
  if (event.status === "finalized") return errorResponse(res, "Finalized event cannot be edited", 409);
  const payload = eventPayload({ ...event.toObject(), ...req.body, feeRules: { ...event.feeRules?.toObject?.(), ...req.body.feeRules } });
  Object.assign(event, payload, { updatedBy: req.user._id });
  await event.save();
  return successResponse(res, "Event updated successfully", { event });
});

export const updateEventParticipant = asyncHandler(async (req, res) => {
  const event = await getOwnedEvent(req.academyId, req.params.id);
  if (!event) return errorResponse(res, "Event not found", 404);
  if (event.status === "finalized") return errorResponse(res, "Finalized event cannot be edited", 409);
  const participant = await AcademyEventParticipant.findOne({
    _id: req.params.participantId,
    event: event._id,
    academy: req.academyId,
    isDeleted: false,
  });
  if (!participant) return errorResponse(res, "Participant not found", 404);

  PARTICIPANT_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) participant[field] = req.body[field];
  });
  participant.updatedBy = req.user._id;
  await participant.save();
  await participant.populate("student", "firstName lastName name admissionNumber studentCode phone beltRank danRank batch");
  return successResponse(res, "Participant updated successfully", { participant });
});

export const addEventParticipants = asyncHandler(async (req, res) => {
  const event = await getOwnedEvent(req.academyId, req.params.id);
  if (!event) return errorResponse(res, "Event not found", 404);
  if (event.status === "finalized") return errorResponse(res, "Finalized event cannot be edited", 409);
  const requested = Array.isArray(req.body.participants) ? req.body.participants : [];
  const ids = [...new Set(requested.map((item) => String(idOf(item.student))).filter(Boolean))];
  const existing = await AcademyEventParticipant.find({ event: event._id, student: { $in: ids }, isDeleted: false }).distinct("student");
  const existingSet = new Set(existing.map(String));
  const newIds = ids.filter((id) => !existingSet.has(id));
  const students = await Student.find({ academy: req.academyId, _id: { $in: newIds } });
  const studentMap = new Map(students.map((student) => [String(student._id), student]));
  const docs = requested.filter((item) => studentMap.has(String(idOf(item.student)))).map((source) => participantPayload({ source, event, student: studentMap.get(String(idOf(source.student))), userId: req.user._id }));
  if (docs.length) await AcademyEventParticipant.create(docs);
  const participants = await populateParticipants(AcademyEventParticipant.find({ event: event._id, isDeleted: false }));
  return successResponse(res, `${docs.length} participants added`, { participants, summary: eventSummary(participants) });
});

export const removeEventParticipant = asyncHandler(async (req, res) => {
  const event = await getOwnedEvent(req.academyId, req.params.id);
  if (!event) return errorResponse(res, "Event not found", 404);
  if (event.status === "finalized") return errorResponse(res, "Finalized event cannot be edited", 409);
  const participant = await AcademyEventParticipant.findOneAndUpdate(
    { _id: req.params.participantId, event: event._id, academy: req.academyId, isDeleted: false },
    { $set: { isDeleted: true, updatedBy: req.user._id } },
    { new: true }
  );
  if (!participant) return errorResponse(res, "Participant not found", 404);
  return successResponse(res, "Participant removed successfully", { participant });
});

const finalizeBeltParticipant = async ({ event, participant, userId }) => {
  if (participant.legacyBeltTest) return;
  if (!participant.currentBelt || !participant.promotedToBelt) throw new Error(`Complete belt path for ${participant.student?.firstName || "participant"}`);
  const record = await BeltTest.create({
    academy: event.academy,
    student: participant.student._id,
    currentBelt: participant.currentBelt,
    currentDanRank: participant.currentDanRank,
    promotedToBelt: participant.promotedToBelt,
    promotedToDanRank: participant.promotedToDanRank,
    marks: participant.marks,
    outOf: participant.outOf,
    testDate: event.startDate,
    result: participant.result,
    examinerName: event.examinerName,
    remarks: participant.examinerRemarks,
    certificateNumber: participant.certificateNumber,
    createdBy: userId,
    updatedBy: userId,
  });
  participant.legacyBeltTest = record._id;
  await participant.save();
  participant.status = "completed";
  if (participant.result === "pass") {
    await Student.updateOne({ _id: participant.student._id, academy: event.academy }, { $set: { beltRank: participant.promotedToBelt, danRank: participant.promotedToBelt === "Black" ? participant.promotedToDanRank : "", updatedBy: userId } });
  }
  await participant.save();
};

const finalizeChampionshipParticipant = async ({ event, participant, userId }) => {
  for (const entry of participant.entries) {
    if (entry.legacyRecord) continue;
    const record = await ChampionshipRecord.create({
      academy: event.academy,
      student: participant.student._id,
      championshipName: event.name,
      championshipType: event.settings?.championshipType || "Open",
      level: event.level || "District",
      sport: event.sport || "Taekwondo",
      eventType: entry.eventType || "Kyorugi",
      poomsaeType: entry.poomsaeType || "",
      gender: ["male", "female", "mixed"].includes(clean(entry.gender || participant.student.gender).toLowerCase())
        ? `${clean(entry.gender || participant.student.gender).charAt(0).toUpperCase()}${clean(entry.gender || participant.student.gender).slice(1).toLowerCase()}`
        : "Male",
      ageCategory: entry.ageCategory || participant.student.ageCategory || "Senior",
      weightCategory: entry.weightCategory || "",
      beltCategory: entry.beltCategory || participant.student.beltRank || "",
      danCategory: entry.danCategory || "",
      result: entry.result || "Participation",
      disqualificationReason: entry.disqualificationReason || "",
      ranking: entry.ranking,
      totalBouts: Number(entry.totalBouts || 0),
      bouts: entry.bouts || [],
      startDate: event.startDate,
      endDate: event.endDate,
      date: event.startDate,
      venue: event.venue,
      district: event.city,
      state: event.state,
      country: event.country,
      organizer: event.organizer,
      remarks: entry.remarks || event.notes,
      createdBy: userId,
      updatedBy: userId,
    });
    entry.legacyRecord = record._id;
    await participant.save();
  }
  participant.status = "completed";
  await participant.save();
};

export const finalizeAcademyEvent = asyncHandler(async (req, res) => {
  const event = await getOwnedEvent(req.academyId, req.params.id);
  if (!event) return errorResponse(res, "Event not found", 404);
  if (event.status === "finalized") return successResponse(res, "Event is already finalized", { event });
  const participants = await populateParticipants(AcademyEventParticipant.find({ event: event._id, isDeleted: false }));
  if (!participants.length) return errorResponse(res, "Event has no participants", 400);

  for (const participant of participants) {
    if (event.type === "belt_test") await finalizeBeltParticipant({ event, participant, userId: req.user._id });
    else await finalizeChampionshipParticipant({ event, participant, userId: req.user._id });
  }
  event.status = "finalized";
  event.finalizedAt = new Date();
  event.finalizedBy = req.user._id;
  event.updatedBy = req.user._id;
  await event.save();
  return successResponse(res, "Event finalized and student records generated", { event });
});

export const deleteAcademyEvent = asyncHandler(async (req, res) => {
  const event = await getOwnedEvent(req.academyId, req.params.id);
  if (!event) return errorResponse(res, "Event not found", 404);
  if (event.status === "finalized") return errorResponse(res, "Finalized event cannot be deleted", 409);
  event.isDeleted = true;
  event.deletedAt = new Date();
  event.updatedBy = req.user._id;
  await event.save();
  await AcademyEventParticipant.updateMany({ event: event._id }, { $set: { isDeleted: true, updatedBy: req.user._id } });
  return successResponse(res, "Event deleted successfully", { event });
});
