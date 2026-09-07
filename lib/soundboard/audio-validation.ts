/** Deliberately limited to MPEG Layer III and integer PCM WAV. Never trust a filename or MIME header. */
export const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 60;
export const AUDIO_BUCKET = "soundboard-audio";

export class AudioInputError extends Error {
  constructor(message: string, public status = 400) { super(message); this.name = "AudioInputError"; }
}

export interface ValidatedAudio { bytes: Buffer; extension: "mp3" | "wav"; contentType: "audio/mpeg" | "audio/wav"; durationSeconds: number }

function invalid(): never { throw new AudioInputError("This audio file could not be read. Export it as MP3 or a standard PCM WAV and try again."); }
function durationCheck(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0.05) throw new AudioInputError("Choose a sound at least 0.05 seconds long.");
  if (seconds > MAX_AUDIO_SECONDS) throw new AudioInputError("Trim the sound to 60 seconds or less.");
}

function parseWav(bytes: Buffer): ValidatedAudio {
  if (bytes.length < 44 || bytes.toString("ascii", 8, 12) !== "WAVE" || bytes.readUInt32LE(4) + 8 !== bytes.length) invalid();
  let offset = 12;
  let format: Buffer | null = null;
  let data: Buffer | null = null;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) invalid();
    const name = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + size;
    if (end > bytes.length) invalid();
    if (name === "fmt ") {
      if (format || size < 16) invalid();
      format = bytes.subarray(offset + 8, offset + 24);
    }
    if (name === "data") {
      if (!format || data || !size) invalid();
      data = bytes.subarray(offset + 8, end);
    }
    offset = end + (size % 2);
  }
  if (!format || !data || offset !== bytes.length) invalid();
  const channels = format.readUInt16LE(2);
  const sampleRate = format.readUInt32LE(4);
  const byteRate = format.readUInt32LE(8);
  const blockAlign = format.readUInt16LE(12);
  const bits = format.readUInt16LE(14);
  if (format.readUInt16LE(0) !== 1 || ![1, 2].includes(channels) || sampleRate < 8000 || sampleRate > 96000 || ![8, 16, 24, 32].includes(bits) || blockAlign !== channels * bits / 8 || byteRate !== sampleRate * blockAlign || data.length % blockAlign) invalid();
  const durationSeconds = data.length / byteRate;
  durationCheck(durationSeconds);
  // Keep only the audio and canonical format chunk; remove comments, location and other metadata.
  const output = Buffer.alloc(44 + data.length + (data.length % 2));
  output.write("RIFF", 0); output.writeUInt32LE(output.length - 8, 4); output.write("WAVEfmt ", 8);
  output.writeUInt32LE(16, 16); format.copy(output, 20); output.write("data", 36);
  output.writeUInt32LE(data.length, 40); data.copy(output, 44);
  return { bytes: output, extension: "wav", contentType: "audio/wav", durationSeconds };
}

function parseMp3(bytes: Buffer): ValidatedAudio {
  let start = 0;
  let end = bytes.length;
  if (bytes.toString("ascii", 0, 3) === "ID3") {
    if (bytes.length < 10 || ![2, 3, 4].includes(bytes[3]) || [6, 7, 8, 9].some((i) => bytes[i] > 127)) invalid();
    const tagSize = (bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9];
    start = 10 + tagSize + (bytes[3] === 4 && (bytes[5] & 0x10) ? 10 : 0);
  }
  if (end - start >= 128 && bytes.toString("ascii", end - 128, end - 125) === "TAG") end -= 128;
  let offset = start;
  let frames = 0;
  let durationSeconds = 0;
  let streamFormat = "";
  while (offset < end) {
    if (offset + 4 > end) invalid();
    const header = bytes.readUInt32BE(offset);
    const version = (header >>> 19) & 3;
    const layer = (header >>> 17) & 3;
    const bitrateIndex = (header >>> 12) & 15;
    const rateIndex = (header >>> 10) & 3;
    if ((header & 0xffe00000) >>> 0 !== 0xffe00000 || version === 1 || layer !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) invalid();
    const bitrates = version === 3 ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320] : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
    const sampleRate = [44100, 48000, 32000][rateIndex] / (version === 3 ? 1 : version === 2 ? 2 : 4);
    const frameLength = Math.floor((version === 3 ? 144 : 72) * bitrates[bitrateIndex] * 1000 / sampleRate) + ((header >>> 9) & 1);
    const format = `${version}:${sampleRate}`;
    if ((streamFormat && streamFormat !== format) || frameLength < 24 || offset + frameLength > end) invalid();
    streamFormat = format;
    durationSeconds += (version === 3 ? 1152 : 576) / sampleRate;
    if (durationSeconds > MAX_AUDIO_SECONDS) durationCheck(durationSeconds);
    offset += frameLength;
    frames += 1;
  }
  if (frames < 2 || offset !== end) invalid();
  durationCheck(durationSeconds);
  return { bytes: Buffer.from(bytes.subarray(start, end)), extension: "mp3", contentType: "audio/mpeg", durationSeconds };
}

export function validateAudio(input: Uint8Array): ValidatedAudio {
  if (!input.length) throw new AudioInputError("Choose an audio file.");
  if (input.length > MAX_AUDIO_BYTES) throw new AudioInputError("Choose an audio file smaller than 3 MB.", 413);
  const bytes = Buffer.from(input);
  return bytes.toString("ascii", 0, 4) === "RIFF" ? parseWav(bytes) : parseMp3(bytes);
}

/** Decode new MP3 uploads after the strict structural and duration bounds above. */
export async function verifyAudioPlayback(audio: ValidatedAudio): Promise<ValidatedAudio> {
  if (audio.extension === "wav") return audio; // Integer PCM samples are already validated directly.
  const { MPEGDecoder } = await import("mpg123-decoder");
  const decoder = new MPEGDecoder();
  await decoder.ready;
  try {
    const result = decoder.decode(audio.bytes);
    const decodedDuration = result.samplesDecoded / result.sampleRate;
    // mpg123 may conceal damaged frame bodies as silence without reporting an
    // error. A soundboard clip must contain actual audio as well as valid headers.
    let hasAudio = false;
    for (const channel of result.channelData) {
      for (const sample of channel) {
        if (!Number.isFinite(sample)) invalid();
        if (sample !== 0) hasAudio = true;
      }
    }
    if (result.errors.length || !hasAudio || !Number.isFinite(decodedDuration) || decodedDuration < 0.05 || decodedDuration > MAX_AUDIO_SECONDS) {
      throw new AudioInputError("This MP3 is damaged or decodes as silence. Export a playable sound as MP3 or PCM WAV and try again.");
    }
    return { ...audio, durationSeconds: decodedDuration };
  } finally { decoder.free(); }
}
