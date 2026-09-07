"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Bold, Check, Code2, Eye, Heading2, Italic, Link2, List, LoaderCircle, LockKeyhole, PenLine, Quote } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { MarkdownContent } from "@/components/content/markdown";
import { saveStory } from "@/lib/editor/actions";
import type { EditorStory, StoryInput, StoryStatus } from "@/lib/editor/types";

type WritingFields = Pick<StoryInput, "title" | "summary" | "body" | "tags" | "references">;

const FORMATTING_TOOLS = [
  { label: "Heading", icon: Heading2, before: "\n## ", after: "\n", placeholder: "Heading" },
  { label: "Bold", icon: Bold, before: "**", after: "**", placeholder: "text" },
  { label: "Italic", icon: Italic, before: "*", after: "*", placeholder: "text" },
  { label: "Link", icon: Link2, before: "[", after: "](https://example.com)", placeholder: "link text" },
  { label: "Quote", icon: Quote, before: "\n> ", after: "\n", placeholder: "Quote" },
  { label: "List", icon: List, before: "\n- ", after: "\n", placeholder: "List item" },
  { label: "Code block", icon: Code2, before: "\n```javascript\n", after: "\n```\n", placeholder: "// Your code" },
];

function writingFields(story: EditorStory | null): WritingFields {
  return { title: story?.title ?? "", summary: story?.summary ?? "", body: story?.body ?? "", tags: story?.tags ?? "", references: story?.references ?? "" };
}

export function StoryEditor({ initialStory }: { initialStory: EditorStory | null }) {
  const router = useRouter();
  const [story, setStory] = useState(initialStory);
  const [fields, setFields] = useState(() => writingFields(initialStory));
  const [savedFields, setSavedFields] = useState(() => JSON.stringify(writingFields(initialStory)));
  const [preview, setPreview] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const dirty = JSON.stringify(fields) !== savedFields;
  const dirtyRef = useRef(dirty);
  const words = fields.body.trim().split(/\s+/).filter(Boolean).length;
  const status = story?.status ?? "draft";

  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function beforeNavigate(event: MouseEvent) {
      if (!dirtyRef.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.href === window.location.href || anchor.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm("You have unsaved writing. Leave without saving?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeNavigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeNavigate, true);
    };
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = "auto";
      bodyRef.current.style.height = `${Math.max(420, bodyRef.current.scrollHeight)}px`;
    }
  }, [fields.body, preview]);

  function update(field: keyof WritingFields, value: string) {
    setFields((previous) => ({ ...previous, [field]: value }));
    setFeedback(null);
  }

  function format(before: string, after = "", placeholder = "text") {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = fields.body.slice(start, end) || placeholder;
    const next = `${fields.body.slice(0, start)}${before}${selected}${after}${fields.body.slice(end)}`;
    update("body", next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function save(nextStatus: StoryStatus) {
    if (pending) return;
    if (status === "published" && nextStatus === "draft" && !window.confirm("Unpublish this story? It will disappear from your public site and remain a private draft.")) return;
    const submitted = { ...fields };
    startTransition(async () => {
      try {
        const result = await saveStory({ ...submitted, id: story?.id ?? null, expectedUpdatedAt: story?.updated_at ?? null, status: nextStatus });
        if (!result.ok) {
          setFeedback({ error: true, message: result.message });
          return;
        }
        setStory(result.story);
        const saved = writingFields(result.story);
        setFields(saved);
        setSavedFields(JSON.stringify(saved));
        dirtyRef.current = false;
        setFeedback({ error: false, message: result.message });
        if (!story) router.replace(`/dashboard/write/${result.story.id}`);
      } catch {
        setFeedback({ error: true, message: "Your story was not saved. Keep this tab open. Check your connection and sign-in, then try again." });
      }
    });
  }

  return (
    <main id="main-content" className="mx-auto min-h-screen max-w-6xl px-4 pb-20 sm:px-8">
      <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/write" aria-label="Your stories" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /><span className="hidden sm:inline">Your stories</span></Link>
          <span className="border-l border-border pl-4 text-xs text-muted-foreground" role="status" aria-live="polite">{pending ? "Saving…" : dirty ? "Unsaved changes" : story ? "All changes saved" : "New story"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPreview(!preview)} aria-pressed={preview} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm hover:bg-muted">{preview ? <PenLine size={15} /> : <Eye size={15} />}{preview ? "Write" : "Preview"}</button>
          {status === "draft" ? (
            <button type="button" disabled={pending} onClick={() => save("draft")} className="min-h-11 rounded-full border border-border px-4 text-sm hover:bg-muted disabled:opacity-50">Save draft</button>
          ) : (
            <button type="button" disabled={pending} onClick={() => save("draft")} className="min-h-11 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted disabled:opacity-50">Unpublish</button>
          )}
          <button type="button" disabled={pending} onClick={() => save("published")} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{pending && <LoaderCircle size={15} className="animate-spin" />}{status === "published" ? "Update story" : "Publish"}</button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl pt-10 sm:pt-16">
        <div className="mb-9 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">{status === "draft" ? <LockKeyhole size={14} /> : <Check size={14} />}{status === "draft" ? "Private draft · by Luis Ruiz" : "Published · by Luis Ruiz"}</span>
          <span>{words.toLocaleString("en-US")} words · {Math.max(1, Math.ceil(words / 220))} min read</span>
        </div>

        {feedback && <div role={feedback.error ? "alert" : "status"} className={`mb-8 rounded-xl border p-4 text-sm leading-6 ${feedback.error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-muted"}`}>{feedback.message}{!feedback.error && story?.status === "published" && <Link href={`/blog/${story.id}`} target="_blank" className="ml-2 inline-flex items-center gap-1 font-medium underline">View story<ArrowUpRight size={13} /></Link>}</div>}

        {preview ? (
          <article className="min-h-[480px] break-words">
            <h1 className="mb-5 font-serif text-4xl leading-tight tracking-tight sm:text-6xl">{fields.title || "Your story title"}</h1>
            {fields.summary && <p className="mb-10 text-xl leading-8 text-muted-foreground">{fields.summary}</p>}
            <MarkdownContent content={fields.body || "Your story preview will appear here."} />
            {fields.references && <section className="mt-12 border-t border-border pt-6"><h2 className="mb-4 text-lg font-medium">Sources & further reading</h2><MarkdownContent content={fields.references} /></section>}
          </article>
        ) : (
          <fieldset disabled={pending} className="min-w-0">
            <label htmlFor="story-title" className="sr-only">Story title</label>
            <textarea id="story-title" name="title" value={fields.title} onChange={(event) => update("title", event.target.value)} maxLength={240} rows={2} placeholder="Title" className="w-full resize-none border-0 bg-transparent font-serif text-4xl leading-tight tracking-tight outline-none placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring sm:text-6xl" />
            <label htmlFor="story-summary" className="sr-only">Subtitle</label>
            <textarea id="story-summary" name="summary" value={fields.summary} onChange={(event) => update("summary", event.target.value)} maxLength={500} rows={2} placeholder="Add a subtitle that makes someone want to keep reading…" className="mb-6 w-full resize-y border-0 bg-transparent text-xl leading-8 text-muted-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring" />
            <div className="mb-7 flex flex-wrap items-center gap-1 border-y border-border py-2" role="toolbar" aria-label="Story formatting">
              {FORMATTING_TOOLS.map(({ label, icon: Icon, before, after, placeholder }) => <button key={label} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => format(before, after, placeholder)} className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><Icon size={17} /></button>)}
              <span className="ml-auto px-2 text-xs text-muted-foreground">Select text to format</span>
            </div>
            <label htmlFor="story-body" className="sr-only">Story body</label>
            <textarea ref={bodyRef} id="story-body" name="body" value={fields.body} onChange={(event) => update("body", event.target.value)} maxLength={100_000} placeholder="Tell your story…" spellCheck className="min-h-[420px] w-full resize-none overflow-hidden border-0 bg-transparent font-serif text-xl leading-[1.9] outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring" />
          </fieldset>
        )}

        <fieldset disabled={pending} className="mt-12 space-y-6 border-t border-border pt-8">
          <div>
            <label htmlFor="story-tags" className="mb-2 block text-sm font-medium">Topics</label>
            <input id="story-tags" name="tags" value={fields.tags} onChange={(event) => update("tags", event.target.value)} maxLength={500} placeholder="Web development, AI, Building in public" aria-describedby="topics-help" className="min-h-12 w-full rounded-xl border border-border bg-transparent px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <p id="topics-help" className="mt-2 text-xs leading-5 text-muted-foreground">Up to eight topics, separated by commas.</p>
          </div>
          {!preview && <div><label htmlFor="story-references" className="mb-2 block text-sm font-medium">Sources & further reading <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="story-references" name="references" value={fields.references} onChange={(event) => update("references", event.target.value)} maxLength={10_000} rows={3} placeholder="Add the links, documents, or sources behind your story." className="w-full resize-y rounded-xl border border-border bg-transparent p-4 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>}
          <details className="text-sm text-muted-foreground"><summary className="cursor-pointer py-2">Writing tips</summary><p className="mt-2 leading-7">Lead with what you built or learned. Explain the problem, show your approach, and be honest about the result. The formatting buttons add headings, links, lists, quotes, and code; use Preview to see the finished story. Save your draft before leaving. Publishing makes the story visible to everyone.</p></details>
        </fieldset>
      </div>
    </main>
  );
}
