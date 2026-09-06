import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const IMAGE_TYPES = [
  {
    extension: ".jpg",
    mimeType: "image/jpeg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    extension: ".png",
    mimeType: "image/png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ),
  },
  {
    extension: ".webp",
    mimeType: "image/webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

const resolveUploadFolder = (fieldName = "") => {
  if (fieldName === "profilePhoto") return "private-uploads/students";

  if (["frontBackground", "backBackground"].includes(fieldName)) {
    return "uploads/id-card-templates";
  }

  if (
    fieldName === "certificateBackground"
  ) {
    return "private-uploads/certificate-templates";
  }

  if (/^signature[0-5]$/.test(fieldName)) return "private-uploads/signatures";

  if (fieldName === "logo") return "uploads/academies";

  throw new Error("Unsupported upload field");
};

const detectImageType = (buffer) =>
  IMAGE_TYPES.find((type) => type.matches(buffer)) || null;

class VerifiedImageStorage {
  _handleFile(req, file, callback) {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      callback(error);
    };

    file.stream.on("data", (chunk) => {
      totalBytes += chunk.length;

      if (totalBytes > MAX_IMAGE_BYTES) {
        file.stream.resume();
        fail(new multer.MulterError("LIMIT_FILE_SIZE", file.fieldname));
        return;
      }

      chunks.push(chunk);
    });

    file.stream.once("error", fail);

    file.stream.once("end", async () => {
      if (settled) return;

      try {
        const buffer = Buffer.concat(chunks);
        const imageType = detectImageType(buffer);

        if (!imageType) {
          throw new Error(
            "Invalid image content. Upload a genuine JPG, PNG or WEBP file"
          );
        }

        const destination = resolveUploadFolder(file.fieldname);
        await fs.promises.mkdir(destination, { recursive: true, mode: 0o750 });

        const filename = `${crypto.randomUUID()}${imageType.extension}`;
        const filePath = path.join(destination, filename);

        await fs.promises.writeFile(filePath, buffer, {
          flag: "wx",
          mode: 0o640,
        });

        req.res?.once("finish", () => {
          if (req.res.statusCode >= 400) {
            fs.promises.unlink(filePath).catch(() => {});
          }
        });

        settled = true;
        callback(null, {
          destination,
          filename,
          path: filePath,
          size: buffer.length,
          mimetype: imageType.mimeType,
        });
      } catch (error) {
        fail(error);
      }
    });
  }

  _removeFile(_req, file, callback) {
    if (!file?.path) return callback(null);

    fs.unlink(file.path, (error) => {
      if (error?.code === "ENOENT") return callback(null);
      callback(error || null);
    });
  }
}

export const uploadImage = multer({
  storage: new VerifiedImageStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 7,
    fields: 40,
    parts: 48,
    fieldNameSize: 64,
    fieldSize: 512 * 1024,
  },
});
