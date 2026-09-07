import "server-only";

import sharp from "sharp";

import { MAX_IMAGE_BYTES, MediaInputError } from "./config";

export async function processUploadedImage(bytes: Uint8Array): Promise<Buffer> {
  if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new MediaInputError("Choose an image smaller than 3 MB. Compress larger images before uploading.", 413);
  }

  const header = Buffer.from(bytes.subarray(0, 12));
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    throw new MediaInputError("Choose a JPEG, PNG, or WebP image. Export HEIC, SVG, and other formats as JPEG or PNG first.");
  }

  try {
    // Sharp inspects the actual bytes, not the filename or browser MIME claim.
    const image = sharp(bytes, { failOn: "warning", limitInputPixels: 25_000_000 });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new MediaInputError("Choose a JPEG, PNG, or WebP image. Export HEIC, SVG, and other formats as JPEG or PNG first.");
    }
    if ((metadata.pages ?? 1) > 1) {
      throw new MediaInputError("Choose a still image. Export animated images as a single PNG or JPEG frame.");
    }

    // Decode and encode again so malformed data is rejected and EXIF/location
    // metadata is omitted. Auto-orientation is applied before metadata removal.
    return await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
  } catch (error) {
    if (error instanceof MediaInputError) throw error;
    throw new MediaInputError("This image could not be read. Try a valid JPEG, PNG, or WebP under 25 megapixels.");
  }
}
