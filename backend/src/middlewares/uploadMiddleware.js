import multer from "multer";

import { removeStoredUpload, storeImage } from "../services/mediaStorageService.js";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = [
  { extension: ".jpg", mimeType: "image/jpeg", matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { extension: ".png", mimeType: "image/png", matches: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { extension: ".webp", mimeType: "image/webp", matches: (b) => b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];
const LOCAL_DESTINATIONS = {
  profilePhoto: "private-uploads/students",
  frontBackground: "uploads/id-card-templates",
  backBackground: "uploads/id-card-templates",
  certificateBackground: "private-uploads/certificate-templates",
  logo: "uploads/academies",
};

const localDestinationFor = (fieldName = "") => {
  if (/^signature[0-5]$/.test(fieldName)) return "private-uploads/signatures";
  const destination = LOCAL_DESTINATIONS[fieldName];
  if (!destination) throw new Error("Unsupported upload field");
  return destination;
};

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 7, fields: 40, parts: 48, fieldNameSize: 64, fieldSize: 512 * 1024 },
});

const processFile = async (file) => {
  const imageType = IMAGE_TYPES.find((type) => type.matches(file.buffer));
  if (!imageType) throw new Error("Invalid image content. Upload a genuine JPG, PNG or WEBP file");
  const stored = await storeImage({
    buffer: file.buffer,
    fieldName: file.fieldname,
    localDestination: localDestinationFor(file.fieldname),
    extension: imageType.extension,
  });
  return {
    ...file,
    buffer: undefined,
    filename: stored.filename,
    path: stored.reference,
    storageReference: stored.reference,
    mimetype: imageType.mimeType,
    storedUpload: stored,
  };
};

const registerRollback = (req, res, uploads) => {
  req.storedUploads = [...(req.storedUploads || []), ...uploads];
  res.once("finish", () => {
    if (res.statusCode < 400) return;
    void Promise.allSettled(uploads.map(removeStoredUpload));
  });
};

export const uploadImage = {
  single(fieldName) {
    return (req, res, next) => {
      parser.single(fieldName)(req, res, async (error) => {
        if (error) return next(error);
        if (!req.file) return next();
        try {
          req.file = await processFile(req.file);
          registerRollback(req, res, [req.file.storedUpload]);
          return next();
        } catch (processingError) {
          return next(processingError);
        }
      });
    };
  },
  fields(fields) {
    return (req, res, next) => {
      parser.fields(fields)(req, res, async (error) => {
        if (error) return next(error);
        const uploads = [];
        try {
          const processedEntries = [];
          for (const [fieldName, files] of Object.entries(req.files || {})) {
            const processed = [];
            for (const file of files) {
              const nextFile = await processFile(file);
              processed.push(nextFile);
              uploads.push(nextFile.storedUpload);
            }
            processedEntries.push([fieldName, processed]);
          }
          req.files = Object.fromEntries(processedEntries);
          registerRollback(req, res, uploads);
          return next();
        } catch (processingError) {
          await Promise.allSettled(uploads.map(removeStoredUpload));
          return next(processingError);
        }
      });
    };
  },
};
