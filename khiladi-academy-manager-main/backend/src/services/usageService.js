import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import GeneratedCertificate from "../models/GeneratedCertificate.js";
import GeneratedIdCard from "../models/GeneratedIdCard.js";
import Announcement from "../models/Announcement.js";

export const getAcademyUsage = async ({ academyId }) => {
  const [students, batches, certificates, idCards, announcements] =
    await Promise.all([
      Student.countDocuments({
        academy: academyId,
        status: { $ne: "left" },
      }),
      Batch.countDocuments({
        academy: academyId,
        status: { $ne: "archived" },
      }),
      GeneratedCertificate.countDocuments({
        academy: academyId,
        status: { $ne: "cancelled" },
      }),
      GeneratedIdCard.countDocuments({
        academy: academyId,
        status: { $ne: "cancelled" },
      }),
      Announcement.countDocuments({
        academy: academyId,
        status: { $ne: "archived" },
      }),
    ]);

  return {
    students,
    batches,
    certificates,
    idCards,
    announcements,
  };
};

export const getResourceUsage = async ({ academyId, resourceName }) => {
  const usage = await getAcademyUsage({ academyId });
  return usage[resourceName] || 0;
};