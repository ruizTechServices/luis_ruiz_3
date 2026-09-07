"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ImagePlus, LoaderCircle } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { IMAGE_ACCEPT, MAX_IMAGE_BYTES, type MediaFolder, type MediaImage } from "@/lib/media/config";

export function MediaLibrary({ images, folder, page, hasMore, loadFailed }: { images: MediaImage[]; folder: MediaFolder; page: number; hasMore: boolean; loadFailed: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [uploaded, setUploaded] = useState<MediaImage | null>(null);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) return setFeedback({ error: true, message: "Choose an image first." });
    if (file.size > MAX_IMAGE_BYTES) return setFeedback({ error: true, message: "Choose an image smaller than 3 MB. Compress larger images before uploading." });
    setUploading(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/media/upload", { method: "POST", body: form });
      const result = await response.json() as { error?: string; image?: MediaImage };
      if (!response.ok || !result.image) throw new Error(result.error || "Your image was not uploaded. Please try again.");
      setUploaded(result.image);
      setFeedback({ error: false, message: "Image uploaded. Copy its URL for a project cover, or copy the story image to paste into your writing." });
      formRef.current?.reset();
      if (folder !== "portfolio" || page !== 0) router.push("/dashboard/media");
      else router.refresh();
    } catch (error) {
      setFeedback({ error: true, message: error instanceof Error ? error.message : "Your image was not uploaded. Check your connection and try again." });
    } finally {
      setUploading(false);
    }
  }

  const shownImages = uploaded && folder === "portfolio" && page === 0 && !images.some((image) => image.path === uploaded.path) ? [uploaded, ...images] : images;

  return (
    <>
      <form ref={formRef} onSubmit={upload} className="my-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4"><ImagePlus size={25} className="mt-1 shrink-0 text-primary" /><div><h2 className="font-display text-2xl">Add an image</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">JPEG, PNG, or still WebP · up to 3 MB. Large images are resized for the web.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Uploaded images are public to anyone with the link, including images you use in a private draft.</p></div></div>
        <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><label className="sr-only" htmlFor="media-file">Image file</label><input id="media-file" name="file" type="file" accept={IMAGE_ACCEPT} required disabled={uploading} className="min-h-11 min-w-0 max-w-full flex-1 text-sm file:mr-4 file:rounded-full file:border file:border-border file:bg-background file:px-4 file:py-3 file:text-sm file:text-foreground" /><button disabled={uploading} type="submit" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}{uploading ? "Uploading…" : "Upload image"}</button></div>
        {feedback && <p role={feedback.error ? "alert" : "status"} className={`mt-5 text-sm leading-6 ${feedback.error ? "text-destructive" : "text-foreground"}`}>{feedback.message}</p>}
      </form>

      <nav aria-label="Image collections" className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"><Link href="/dashboard/media" aria-current={folder === "portfolio" ? "page" : undefined} className={`rounded-full px-4 py-3 text-sm ${folder === "portfolio" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>New uploads</Link><Link href="/dashboard/media?folder=hero" aria-current={folder === "hero" ? "page" : undefined} className={`rounded-full px-4 py-3 text-sm ${folder === "hero" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Existing photos</Link></nav>
      {loadFailed && <p role="alert" className="mb-6 rounded-xl border border-border p-4 text-sm leading-6">Your saved images couldn’t be loaded. <button type="button" onClick={() => router.refresh()} className="font-medium underline">Try again</button>.</p>}
      {shownImages.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shownImages.map((image) => <MediaCard key={image.path} image={image} />)}</div> : !loadFailed && <p className="py-10 text-sm text-muted-foreground">{folder === "portfolio" ? "Your next project image starts here. Upload a picture above." : "There are no saved photos on this page."}</p>}
      {(page > 0 || hasMore) && <nav aria-label="Image pages" className="mt-8 flex items-center justify-between gap-4">{page > 0 ? <Link className="rounded-full border border-border px-5 py-3 text-sm" href={`/dashboard/media?folder=${folder}&page=${page - 1}`}>Previous</Link> : <span />}{hasMore && <Link className="rounded-full border border-border px-5 py-3 text-sm" href={`/dashboard/media?folder=${folder}&page=${page + 1}`}>Next</Link>}</nav>}
    </>
  );
}

function MediaCard({ image }: { image: MediaImage }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copy(storyImage: boolean) {
    try {
      const markdownUrl = image.url.replace(/\(/g, "%28").replace(/\)/g, "%29");
      await navigator.clipboard.writeText(storyImage ? `![Describe this image](${markdownUrl})` : image.url);
      setCopied(storyImage ? "Story image copied. Paste it into your story and replace the description." : "Image URL copied.");
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
      setCopied("Copy the image URL from the field below.");
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <a href={image.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] bg-muted"><Image src={image.url} alt={image.name} fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain" /></a>
      <div className="p-4"><p className="truncate text-sm font-medium" title={image.name}>{image.name}</p><p className="mt-1 text-xs text-muted-foreground">{image.size === null ? "Public image" : `${Math.max(1, Math.round(image.size / 1024)).toLocaleString()} KB · Public image`}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => copy(false)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3 text-xs hover:bg-muted"><Copy size={13} /> Copy URL</button><button type="button" onClick={() => copy(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3 text-xs hover:bg-muted"><Copy size={13} /> Copy story image</button></div>{copied && <p role="status" className="mt-3 text-xs leading-5 text-muted-foreground">{copied}</p>}{copyFailed && <input readOnly aria-label={`Image URL for ${image.name}`} value={image.url} onFocus={(event) => event.target.select()} className="mt-3 w-full rounded border border-border bg-background px-2 py-2 text-xs" />}</div>
    </article>
  );
}
