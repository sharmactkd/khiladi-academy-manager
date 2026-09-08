import sharp from "sharp";

const KB = 1024;

export const IMAGE_UPLOAD_PROFILES = Object.freeze({
  profilePhoto: { width: 512, height: 512, fit: "inside", targetBytes: 80 * KB, quality: 78, minQuality: 48 },
  logo: { width: 1024, height: 1024, fit: "inside", targetBytes: 180 * KB, quality: 82, minQuality: 55 },
  signature: { width: 1200, height: 500, fit: "inside", targetBytes: 120 * KB, quality: 82, minQuality: 55 },
  idCardBackground: { width: 1200, height: 1200, fit: "inside", targetBytes: 450 * KB, quality: 88, minQuality: 68 },
  certificateBackground: { width: 3508, height: 3508, fit: "inside", targetBytes: 1536 * KB, quality: 92, minQuality: 76 },
});

export const imageProfileForField = (fieldName = "") => {
  if (/^signature[0-5]$/.test(fieldName)) return IMAGE_UPLOAD_PROFILES.signature;
  if (fieldName === "certificateBackground") return IMAGE_UPLOAD_PROFILES.certificateBackground;
  if (fieldName === "frontBackground" || fieldName === "backBackground") return IMAGE_UPLOAD_PROFILES.idCardBackground;
  return IMAGE_UPLOAD_PROFILES[fieldName] || IMAGE_UPLOAD_PROFILES.profilePhoto;
};

const encode = (pipeline, quality) => pipeline.webp({ quality, effort: 5, smartSubsample: true }).toBuffer();

export const optimizeUploadedImage = async (buffer, fieldName) => {
  const profile = imageProfileForField(fieldName);
  const source = sharp(buffer, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
  const metadata = await source.metadata();
  if (!metadata.width || !metadata.height) throw new Error("Image dimensions could not be read");

  const pipeline = source.resize({
    width: profile.width,
    height: profile.height,
    fit: profile.fit,
    withoutEnlargement: true,
  });

  let quality = profile.quality;
  let output = await encode(pipeline.clone(), quality);
  while (output.length > profile.targetBytes && quality > profile.minQuality) {
    quality = Math.max(profile.minQuality, quality - 7);
    output = await encode(pipeline.clone(), quality);
  }

  return {
    buffer: output,
    extension: ".webp",
    mimeType: "image/webp",
    originalBytes: buffer.length,
    optimizedBytes: output.length,
    quality,
  };
};
