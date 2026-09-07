import "server-only";

import { MAX_IMAGE_BYTES, MAX_UPLOAD_BODY_BYTES, MediaInputError } from "./config";

export async function readUploadFile(request: Request): Promise<File> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data;") || !request.body) {
    throw new MediaInputError("Choose an image to upload.");
  }
  const declaredSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_UPLOAD_BODY_BYTES) {
    throw new MediaInputError("Choose an image smaller than 3 MB.", 413);
  }

  // Bound the entire request before parsing multipart, including chunked uploads
  // whose Content-Length is absent or cannot be trusted.
  const chunks: Uint8Array[] = [];
  const reader = request.body.getReader();
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_UPLOAD_BODY_BYTES) {
        await reader.cancel();
        throw new MediaInputError("Choose an image smaller than 3 MB.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  let form: FormData;
  try {
    form = await new Response(Buffer.concat(chunks), { headers: { "content-type": contentType } }).formData();
  } catch {
    throw new MediaInputError("The image upload could not be read. Choose the file again.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || form.getAll("file").length !== 1 || !file.size) {
    throw new MediaInputError("Choose one image to upload.");
  }
  if (file.size > MAX_IMAGE_BYTES) throw new MediaInputError("Choose an image smaller than 3 MB.", 413);
  return file;
}
