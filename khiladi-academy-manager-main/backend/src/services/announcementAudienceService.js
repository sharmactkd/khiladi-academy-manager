import Batch from "../models/Batch.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import StudentGuardian from "../models/StudentGuardian.js";

const uniqueByUser = (items = []) => {
  const map = new Map();

  items.forEach((item) => {
    const userId = String(item.recipientUser?._id || item.recipientUser || "");

    if (!userId) return;

    map.set(userId, {
      recipientUser: userId,
      relatedStudent: item.relatedStudent || item.student || null,
      email: item.email || item.recipientUser?.email || "",
      phone: item.phone || item.recipientUser?.phone || "",
    });
  });

  return Array.from(map.values());
};

const getAllParentStudentUsers = async ({ academyId }) => {
  const links = await StudentGuardian.find({
    academy: academyId,
    isActive: true,
  })
    .populate("guardianUser", "name email phone role")
    .populate("student", "name batch")
    .lean();

  return uniqueByUser(
    links
      .filter((link) => link.guardianUser)
      .map((link) => ({
        recipientUser: link.guardianUser,
        relatedStudent: link.student?._id || link.student,
        email: link.guardianUser.email,
        phone: link.guardianUser.phone,
      }))
  );
};

const getAllParents = async ({ academyId }) => {
  const links = await StudentGuardian.find({
    academy: academyId,
    isActive: true,
  })
    .populate("guardianUser", "name email phone role")
    .lean();

  return uniqueByUser(
    links
      .filter((link) => link.guardianUser?.role === "parent")
      .map((link) => ({
        recipientUser: link.guardianUser,
        relatedStudent: link.student,
        email: link.guardianUser.email,
        phone: link.guardianUser.phone,
      }))
  );
};

const getAllStudents = async ({ academyId }) => {
  const links = await StudentGuardian.find({
    academy: academyId,
    isActive: true,
  })
    .populate("guardianUser", "name email phone role")
    .lean();

  return uniqueByUser(
    links
      .filter((link) => link.guardianUser?.role === "student")
      .map((link) => ({
        recipientUser: link.guardianUser,
        relatedStudent: link.student,
        email: link.guardianUser.email,
        phone: link.guardianUser.phone,
      }))
  );
};

const getBatchAudience = async ({ academyId, batchId }) => {
  const batch = await Batch.findOne({
    _id: batchId,
    academy: academyId,
  });

  if (!batch) return [];

  const students = await Student.find({
    academy: academyId,
    batch: batchId,
    status: "active",
  }).select("_id");

  const studentIds = students.map((student) => student._id);

  const links = await StudentGuardian.find({
    academy: academyId,
    student: { $in: studentIds },
    isActive: true,
  })
    .populate("guardianUser", "name email phone role")
    .lean();

  return uniqueByUser(
    links
      .filter((link) => link.guardianUser)
      .map((link) => ({
        recipientUser: link.guardianUser,
        relatedStudent: link.student,
        email: link.guardianUser.email,
        phone: link.guardianUser.phone,
      }))
  );
};

const getIndividualAudience = async ({
  academyId,
  studentIds = [],
  guardianUserIds = [],
}) => {
  const links = await StudentGuardian.find({
    academy: academyId,
    isActive: true,
    $or: [
      studentIds.length ? { student: { $in: studentIds } } : null,
      guardianUserIds.length ? { guardianUser: { $in: guardianUserIds } } : null,
    ].filter(Boolean),
  })
    .populate("guardianUser", "name email phone role")
    .lean();

  return uniqueByUser(
    links
      .filter((link) => link.guardianUser)
      .map((link) => ({
        recipientUser: link.guardianUser,
        relatedStudent: link.student,
        email: link.guardianUser.email,
        phone: link.guardianUser.phone,
      }))
  );
};

export const resolveAnnouncementAudience = async ({ announcement }) => {
  if (!announcement?.academy) return [];

  const academyId = announcement.academy;

  if (announcement.audienceType === "all") {
    return getAllParentStudentUsers({ academyId });
  }

  if (announcement.audienceType === "parents") {
    return getAllParents({ academyId });
  }

  if (announcement.audienceType === "students") {
    return getAllStudents({ academyId });
  }

  if (announcement.audienceType === "batch") {
    return getBatchAudience({
      academyId,
      batchId: announcement.batch,
    });
  }

  if (announcement.audienceType === "individual") {
    return getIndividualAudience({
      academyId,
      studentIds: announcement.students || [],
      guardianUserIds: announcement.guardianUsers || [],
    });
  }

  return [];
};

export const getLinkedStudentIdsForUser = async ({ userId }) => {
  const links = await StudentGuardian.find({
    guardianUser: userId,
    isActive: true,
  }).select("student academy canViewAttendance canViewFees canViewProgress canViewDocuments");

  return links;
};