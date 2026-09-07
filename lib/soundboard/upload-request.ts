import { AudioInputError, MAX_AUDIO_BYTES } from "./audio-validation";

export async function readBoundedBody(request: Request, limit: number): Promise<Buffer> {
  if (!request.body) throw new AudioInputError("The request was empty.");
  if (Number(request.headers.get("content-length")) > limit) throw new AudioInputError("This upload is too large. Choose a file smaller than 3 MB.", 413);
  const chunks: Uint8Array[] = [];
  const reader = request.body.getReader();
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new AudioInputError("This upload is too large. Choose a file smaller than 3 MB.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export async function readAudioUpload(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data;")) throw new AudioInputError("Choose an audio file to upload.");
  const body = await readBoundedBody(request, MAX_AUDIO_BYTES + 32 * 1024);
  let form: FormData;
  try { form = await new Response(new Uint8Array(body), { headers: { "content-type": contentType } }).formData(); }
  catch { throw new AudioInputError("The upload could not be read. Choose your file again."); }
  if (!(form.get("file") instanceof File) || form.getAll("file").length !== 1) throw new AudioInputError("Choose one audio file.");
  return form;
}
