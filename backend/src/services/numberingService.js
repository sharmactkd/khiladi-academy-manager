const padNumber = (value, size = 5) => {
  return String(value).padStart(size, "0");
};

const safeDatePart = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
};

const buildPrefix = ({ prefix, academyId }) => {
  const academyPart = String(academyId || "ACD").slice(-4).toUpperCase();
  return `${prefix}-${academyPart}-${safeDatePart()}`;
};

export const generateSequentialNumber = async ({
  model,
  academyId,
  fieldName,
  prefix,
}) => {
  if (!model || !academyId || !fieldName || !prefix) {
    throw new Error("Invalid numbering configuration");
  }

  const numberPrefix = buildPrefix({ prefix, academyId });

  const latestRecord = await model
    .findOne({
      academy: academyId,
      [fieldName]: { $regex: `^${numberPrefix}-` },
    })
    .sort({ createdAt: -1 })
    .select(fieldName)
    .lean();

  let nextNumber = 1;

  if (latestRecord?.[fieldName]) {
    const parts = String(latestRecord[fieldName]).split("-");
    const lastPart = Number(parts[parts.length - 1]);

    if (!Number.isNaN(lastPart)) {
      nextNumber = lastPart + 1;
    }
  }

  return `${numberPrefix}-${padNumber(nextNumber)}`;
};

export const generateCardNumber = async ({ model, academyId }) => {
  return generateSequentialNumber({
    model,
    academyId,
    fieldName: "cardNumber",
    prefix: "IDC",
  });
};

export const generateCertificateNumber = async ({ model, academyId }) => {
  return generateSequentialNumber({
    model,
    academyId,
    fieldName: "certificateNumber",
    prefix: "CERT",
  });
};