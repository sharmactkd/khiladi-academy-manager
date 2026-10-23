export const REGISTER_STUDENT_FIELDS = "admissionNumber firstName lastName phone countryCode status statusUpdatedAt joiningDate createdAt updatedAt batch dob dateOfBirth fatherName schoolName address";

export const IMPORTED_FEE_FIELDS = ["importedDueDate", "importedPaidDate", "importedFeePaid", "importedFeeStatus"];

// Preserve the existing newest-nonempty-per-field policy, including its
// 40-document horizon. Group before sending results over the database socket.
export const compactImportedFeeContextStages = () => [
  { $sort: { date: -1, updatedAt: -1 } },
  { $limit: 40 },
  { $project: { records: { student: 1, ...Object.fromEntries(IMPORTED_FEE_FIELDS.map(field => [field, 1])) } } },
  { $unwind: "$records" },
  { $match: { $or: IMPORTED_FEE_FIELDS.map(field => ({ [`records.${field}`]: { $exists: true, $nin: [null, ""] } })) } },
  { $group: {
    _id: "$records.student",
    ...Object.fromEntries(IMPORTED_FEE_FIELDS.map(field => [field, { $push: `$records.${field}` }])),
  } },
  { $project: {
    _id: 0,
    student: "$_id",
    ...Object.fromEntries(IMPORTED_FEE_FIELDS.map(field => [field, { $ifNull: [
      { $arrayElemAt: [{ $filter: { input: `$${field}`, as: "value", cond: {
        $ne: [{ $trim: { input: { $convert: { input: "$$value", to: "string", onError: "", onNull: "" } } } }, ""],
      } } }, 0] }, "",
    ] }])),
  } },
];

export const latestMetadataStages = () => {
  const fields = [...IMPORTED_FEE_FIELDS, "importedExtraNote"];
  return [
    { $sort: { updatedAt: -1 } },
    { $project: { student: 1, ...Object.fromEntries(fields.map(field => [field, 1])) } },
    { $facet: Object.fromEntries(fields.map(field => [field, [
      { $match: { [field]: { $exists: true, $nin: [null, ""] } } },
      { $group: { _id: "$student", student: { $first: "$student" }, [field]: { $first: `$${field}` } } },
      { $project: { _id: 0, student: 1, [field]: 1 } },
    ]])) },
  ];
};
