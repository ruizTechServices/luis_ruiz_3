export const MEDIA_BUCKET = "photos";
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_UPLOAD_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
export const MEDIA_PAGE_SIZE = 48;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const MEDIA_FOLDERS = ["portfolio", "hero"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export interface MediaImage {
  name: string;
  path: string;
  url: string;
  size: number | null;
}

export class MediaInputError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = "MediaInputError";
  }
}
