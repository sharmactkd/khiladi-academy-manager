import StudentTimeline from "../models/StudentTimeline.js";

export const upsertTimelineEvent = async ({
  academy,
  student,
  type,
  title,
  description = "",
  date,
  sourceModule = "manual",
  sourceId = null,
  userId = null,
}) => {
  if (!academy || !student || !type || !title || !date) {
    return null;
  }

  const filter =
    sourceModule !== "manual" && sourceId
      ? { academy, student, sourceModule, sourceId }
      : null;

  const payload = {
    academy,
    student,
    type,
    title,
    description,
    date,
    sourceModule,
    sourceId,
    updatedBy: userId,
  };

  if (filter) {
    return StudentTimeline.findOneAndUpdate(
      filter,
      {
        $set: payload,
        $setOnInsert: {
          createdBy: userId,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
  }

  return StudentTimeline.create({
    ...payload,
    createdBy: userId,
  });
};

export const createManualTimelineNote = async ({
  academy,
  student,
  title,
  description = "",
  date,
  userId = null,
}) => {
  return StudentTimeline.create({
    academy,
    student,
    type: "note",
    title,
    description,
    date,
    sourceModule: "manual",
    sourceId: null,
    createdBy: userId,
    updatedBy: userId,
  });
};

export const createBeltTestTimeline = async ({ beltTest, userId = null }) => {
  if (!beltTest) return null;

  const isPass = beltTest.result === "pass";

  return upsertTimelineEvent({
    academy: beltTest.academy,
    student: beltTest.student,
    type: isPass ? "belt_promoted" : "belt_test",
    title: isPass
      ? `Promoted to ${beltTest.promotedToBelt}`
      : `Belt test: ${beltTest.currentBelt} to ${beltTest.promotedToBelt}`,
    description: `Result: ${beltTest.result}${
      beltTest.examinerName ? ` | Examiner: ${beltTest.examinerName}` : ""
    }${beltTest.remarks ? ` | Remarks: ${beltTest.remarks}` : ""}`,
    date: beltTest.testDate,
    sourceModule: "belt_test",
    sourceId: beltTest._id,
    userId,
  });
};

export const createChampionshipTimeline = async ({
  championshipRecord,
  userId = null,
}) => {
  if (!championshipRecord) return null;

  const medalResults = ["gold", "silver", "bronze"];
  const isMedal = medalResults.includes(championshipRecord.result);

  return upsertTimelineEvent({
    academy: championshipRecord.academy,
    student: championshipRecord.student,
    type: isMedal ? "medal" : "championship",
    title: isMedal
      ? `${championshipRecord.result.toUpperCase()} medal - ${
          championshipRecord.championshipName
        }`
      : `Championship: ${championshipRecord.championshipName}`,
    description: `Level: ${championshipRecord.level} | Event: ${
      championshipRecord.eventType
    } | Result: ${championshipRecord.result}${
      championshipRecord.venue ? ` | Venue: ${championshipRecord.venue}` : ""
    }`,
    date: championshipRecord.date,
    sourceModule: "championship_record",
    sourceId: championshipRecord._id,
    userId,
  });
};

export const createIdCardTimeline = async ({ idCard, userId = null }) => {
  if (!idCard) return null;

  return upsertTimelineEvent({
    academy: idCard.academy,
    student: idCard.student,
    type: "id_card",
    title: "ID card generated",
    description: `Card Number: ${idCard.cardNumber}`,
    date: idCard.issuedDate || new Date(),
    sourceModule: "id_card",
    sourceId: idCard._id,
    userId,
  });
};

export const createCertificateTimeline = async ({
  certificate,
  userId = null,
}) => {
  if (!certificate) return null;

  return upsertTimelineEvent({
    academy: certificate.academy,
    student: certificate.student,
    type: "certificate",
    title: `${certificate.certificateType} certificate issued`,
    description: `Certificate Number: ${certificate.certificateNumber}`,
    date: certificate.issueDate || new Date(),
    sourceModule: "certificate",
    sourceId: certificate._id,
    userId,
  });
};