import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import FeePayment from "../models/FeePayment.js";
import BeltTest from "../models/BeltTest.js";
import ChampionshipRecord from "../models/ChampionshipRecord.js";
import GeneratedCertificate from "../models/GeneratedCertificate.js";
import StudentTimeline from "../models/StudentTimeline.js";

import { buildBranchAccessFilter } from "./branchAccessService.js";

const daysBetween = (fromDate, toDate = new Date()) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const createInsight = ({ type, title, message, severity = "info", meta = {} }) => {
  return {
    type,
    title,
    message,
    severity,
    meta,
    generatedAt: new Date(),
  };
};

const getAttendanceInsight = async ({ academyId, student }) => {
  const records = await Attendance.find({
    academy: academyId,
    student: student._id,
  })
    .sort({ date: -1 })
    .limit(30)
    .lean();

  if (!records.length) {
    return createInsight({
      type: "attendance_empty",
      title: "No attendance record",
      message: "This student does not have attendance records yet.",
      severity: "info",
    });
  }

  const present = records.filter((item) => item.status === "present").length;
  const percentage = Math.round((present / records.length) * 100);

  if (percentage < 60) {
    return createInsight({
      type: "low_attendance_warning",
      title: "Low attendance warning",
      message: `Recent attendance is only ${percentage}%. Please follow up.`,
      severity: "warning",
      meta: { percentage },
    });
  }

  let streak = 0;

  for (const record of records) {
    if (record.status === "present") streak += 1;
    else break;
  }

  return createInsight({
    type: "attendance_streak",
    title: "Attendance streak",
    message: `Student has a current attendance streak of ${streak} class(es).`,
    severity: "success",
    meta: { streak, percentage },
  });
};

const getFeeInsight = async ({ academyId, student }) => {
  const pendingFees = await FeePayment.find({
    academy: academyId,
    student: student._id,
    status: { $in: ["pending", "partial"] },
  }).lean();

  const pendingAmount = pendingFees.reduce((sum, fee) => {
    return sum + Number(fee.pendingAmount || fee.amount || 0);
  }, 0);

  if (pendingAmount > 0) {
    return createInsight({
      type: "pending_fee_warning",
      title: "Pending fee warning",
      message: `Pending fee amount is ₹${pendingAmount}.`,
      severity: "warning",
      meta: { pendingAmount },
    });
  }

  return createInsight({
    type: "fee_regular",
    title: "Fee status healthy",
    message: "No pending fee found for this student.",
    severity: "success",
  });
};

const getBeltInsight = async ({ academyId, student }) => {
  const lastBeltTest = await BeltTest.findOne({
    academy: academyId,
    student: student._id,
  })
    .sort({ testDate: -1, createdAt: -1 })
    .lean();

  if (!lastBeltTest) {
    return createInsight({
      type: "belt_progress_empty",
      title: "No belt test yet",
      message: "No belt test record found for this student.",
      severity: "info",
    });
  }

  const date = lastBeltTest.testDate || lastBeltTest.createdAt;
  const days = daysBetween(date);

  return createInsight({
    type: "belt_promotion_progress",
    title: "Belt promotion progress",
    message: `Last belt test was ${days} day(s) ago.`,
    severity: days > 120 ? "warning" : "info",
    meta: {
      daysSinceLastTest: days,
      result: lastBeltTest.result || lastBeltTest.status || "",
      newBeltRank: lastBeltTest.newBeltRank || lastBeltTest.promotedBeltRank || "",
    },
  });
};

const getMedalInsight = async ({ academyId, student }) => {
  const medal = await ChampionshipRecord.findOne({
    academy: academyId,
    student: student._id,
  })
    .sort({ championshipDate: -1, createdAt: -1 })
    .lean();

  if (!medal) {
    return createInsight({
      type: "no_tournament_record",
      title: "No tournament record",
      message: "No championship record found yet.",
      severity: "info",
    });
  }

  return createInsight({
    type: "tournament_medal_achievement",
    title: "Tournament achievement",
    message: `${medal.championshipName || medal.eventName || "Championship"}: ${
      medal.medal || medal.result || "participated"
    }.`,
    severity: medal.medal || medal.result ? "success" : "info",
    meta: {
      championshipName: medal.championshipName || medal.eventName || "",
      medal: medal.medal || medal.result || "",
    },
  });
};

const getCertificateInsight = async ({ academyId, student }) => {
  const certificate = await GeneratedCertificate.findOne({
    academy: academyId,
    student: student._id,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!certificate) {
    return createInsight({
      type: "certificate_empty",
      title: "No certificate issued",
      message: "No certificate has been issued yet.",
      severity: "info",
    });
  }

  return createInsight({
    type: "certificate_issued",
    title: "Certificate issued",
    message: "A certificate has been issued for this student.",
    severity: "success",
    meta: {
      certificateNumber: certificate.certificateNumber || "",
      issuedAt: certificate.createdAt,
    },
  });
};

const getInactiveRiskInsight = ({ student }) => {
  if (student.status === "left" || student.status === "inactive") {
    return createInsight({
      type: "inactive_risk",
      title: "Inactive risk",
      message: `Student status is ${student.status}. Please review this profile.`,
      severity: "warning",
      meta: {
        status: student.status,
      },
    });
  }

  return createInsight({
    type: "active_student",
    title: "Student active",
    message: "Student profile is currently active.",
    severity: "success",
    meta: {
      status: student.status,
    },
  });
};

export const generateSmartTimelineInsights = async ({
  academyId,
  studentId,
  user,
}) => {
  const student = await Student.findOne({
    _id: studentId,
    academy: academyId,
    ...buildBranchAccessFilter(user),
  }).lean();

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  const insights = await Promise.all([
    getAttendanceInsight({ academyId, student }),
    getFeeInsight({ academyId, student }),
    getBeltInsight({ academyId, student }),
    getMedalInsight({ academyId, student }),
    getCertificateInsight({ academyId, student }),
  ]);

  insights.push(getInactiveRiskInsight({ student }));

  return {
    student,
    insights: insights.sort(
      (a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)
    ),
  };
};

export const getSmartTimeline = async ({ academyId, studentId, user }) => {
  const smartData = await generateSmartTimelineInsights({
    academyId,
    studentId,
    user,
  });

  const timeline = await StudentTimeline.find({
    academy: academyId,
    student: studentId,
  })
    .sort({ eventDate: -1, createdAt: -1 })
    .limit(100)
    .lean();

  return {
    student: smartData.student,
    insights: smartData.insights,
    timeline,
  };
};

export const generateAndSaveSmartTimeline = async ({
  academyId,
  studentId,
  user,
}) => {
  const smartData = await generateSmartTimelineInsights({
    academyId,
    studentId,
    user,
  });

  const createdEvents = [];

  for (const insight of smartData.insights) {
    const existing = await StudentTimeline.findOne({
      academy: academyId,
      student: studentId,
      eventType: insight.type,
      title: insight.title,
    });

    if (existing) continue;

    const event = await StudentTimeline.create({
      academy: academyId,
      student: studentId,
      eventType: insight.type,
      title: insight.title,
      description: insight.message,
      eventDate: insight.generatedAt,
      metadata: insight.meta || {},
      createdBy: user._id,
    });

    createdEvents.push(event);
  }

  const timeline = await StudentTimeline.find({
    academy: academyId,
    student: studentId,
  })
    .sort({ eventDate: -1, createdAt: -1 })
    .limit(100)
    .lean();

  return {
    student: smartData.student,
    insights: smartData.insights,
    createdEvents,
    timeline,
  };
};