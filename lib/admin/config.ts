export type AdminFieldType = "text" | "textarea" | "checkbox" | "select" | "list" | "url" | "timestamp";

export interface AdminField {
  name: string;
  label: string;
  type?: AdminFieldType;
  required?: boolean;
  options?: readonly string[];
  defaultValue?: string;
  hint?: string;
}

export interface AdminTableConfig {
  slug: string;
  table: string;
  title: string;
  description: string;
  select: string;
  orderBy?: string;
  fields: AdminField[];
  readOnly?: boolean;
  deleteOnly?: boolean;
  createDisabled?: boolean;
}

export const ADMIN_TABLES = [
  {
    slug: "blog-posts",
    table: "blog_posts",
    title: "Blog posts",
    description: "Manage private drafts and published stories at your writing desk.",
    select: "id, created_at, updated_at, published_at, status, title, summary, tags, references, body",
    orderBy: "updated_at",
    readOnly: true,
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "tags", label: "Tags" },
      { name: "references", label: "References", type: "textarea" },
      { name: "body", label: "Body", type: "textarea" },
    ],
  },
  {
    slug: "projects",
    table: "projects",
    title: "Projects",
    description: "Public portfolio records. Keep private work marked non-public.",
    select:
      "id, created_at, updated_at, title, slug, url, description, summary, status, category, featured, visibility, stack, role, context, problem, constraints, approach, architecture, decisions, outcomes, current_status, repo_url, live_url, cover_image_url, started_at, completed_at",
    orderBy: "updated_at",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "slug", label: "Page URL slug", required: true, hint: "Keep an existing slug unchanged to preserve shared links." },
      { name: "url", label: "Project URL", type: "url", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", required: true, options: ["draft", "active", "complete", "archived"], defaultValue: "draft" },
      { name: "category", label: "Category", type: "select", required: true, options: ["project", "product", "client", "experiment"], defaultValue: "project" },
      { name: "visibility", label: "Visibility", type: "select", required: true, options: ["private", "public", "unlisted"], defaultValue: "private", hint: "Only public projects appear on the website. Private and unlisted projects remain visible to you." },
      { name: "stack", label: "Built with", type: "list", hint: "Separate technologies with commas, for example: Next.js, TypeScript, Supabase." },
      { name: "role", label: "Role" },
      { name: "context", label: "The context", type: "textarea" },
      { name: "problem", label: "The problem", type: "textarea" },
      { name: "constraints", label: "Constraints", type: "textarea" },
      { name: "approach", label: "The approach", type: "textarea" },
      { name: "architecture", label: "Architecture", type: "textarea" },
      { name: "decisions", label: "Key decisions", type: "textarea" },
      { name: "outcomes", label: "What it delivers", type: "textarea", hint: "Describe observable results. Include numbers only when you can support them." },
      { name: "current_status", label: "Where it stands", type: "textarea" },
      { name: "repo_url", label: "Source repository URL", type: "url" },
      { name: "live_url", label: "Live website URL", type: "url" },
      { name: "cover_image_url", label: "Cover image URL", type: "url" },
      { name: "started_at", label: "Started at", type: "timestamp" },
      { name: "completed_at", label: "Completed at", type: "timestamp", hint: "Leave empty for ongoing work." },
      { name: "featured", label: "Featured", type: "checkbox" },
    ],
  },
  {
    slug: "site-settings",
    table: "site_settings",
    title: "Site settings",
    description: "Small public configuration surface for the site.",
    select: "id, availability, availability_text, updated_at",
    orderBy: "updated_at",
    fields: [
      { name: "availability_text", label: "Availability text", required: true },
      { name: "availability", label: "Available", type: "checkbox" },
    ],
  },
  {
    slug: "contactlist",
    table: "contactlist",
    title: "Contact submissions",
    description: "Private inquiry archive. Use the inquiry inbox to track status, notes, and follow-ups.",
    select:
      "id, created_at, full_name, email, phone, company, subject, budget, timeline, preferred_contact, newsletter, message",
    orderBy: "created_at",
    createDisabled: true,
    readOnly: true,
    fields: [
      { name: "full_name", label: "Full name" },
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "company", label: "Company" },
      { name: "subject", label: "Subject" },
      { name: "budget", label: "Budget" },
      { name: "timeline", label: "Timeline" },
      { name: "preferred_contact", label: "Preferred contact" },
      { name: "message", label: "Message", type: "textarea" },
      { name: "newsletter", label: "Newsletter", type: "checkbox" },
    ],
  },
  {
    slug: "journal",
    table: "journal",
    title: "Journal",
    description: "Gio-only personal journal.",
    select: "id, created_at, updated_at, title, tags, content",
    orderBy: "created_at",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "tags", label: "Tags" },
      { name: "content", label: "Content", type: "textarea", required: true },
    ],
  },
  {
    slug: "todos",
    table: "todos",
    title: "Todos",
    description: "Gio-only task list.",
    select: "id, created_at, updated_at, position, description, is_completed",
    orderBy: "position",
    fields: [
      { name: "description", label: "Description", required: true },
      { name: "is_completed", label: "Completed", type: "checkbox" },
    ],
  },
  {
    slug: "comments",
    table: "comments",
    title: "Comments",
    description: "Public comments with Gio-only moderation.",
    select: "id, created_at, post_id, content",
    orderBy: "created_at",
    createDisabled: true,
    fields: [
      { name: "content", label: "Content", type: "textarea", required: true },
    ],
  },
  {
    slug: "votes",
    table: "votes",
    title: "Votes",
    description: "Public votes with Gio-only moderation.",
    select: "id, created_at, post_id, user_email, vote_type",
    orderBy: "created_at",
    createDisabled: true,
    fields: [
      { name: "user_email", label: "User email", required: true },
      { name: "vote_type", label: "Vote type", required: true },
    ],
  },
  {
    slug: "documents",
    table: "documents",
    title: "Documents",
    description: "Admin document knowledge entries.",
    select: "id, created_at, updated_at, title, source, url, content",
    orderBy: "created_at",
    fields: [
      { name: "title", label: "Title" },
      { name: "source", label: "Source" },
      { name: "url", label: "URL" },
      { name: "content", label: "Content", type: "textarea" },
    ],
  },
  {
    slug: "gios-context",
    table: "gios_context",
    title: "Gio context",
    description: "Gio-specific context entries.",
    select: "id, created_at, session_id, message_id, role, model, source, content, user_id",
    orderBy: "created_at",
    fields: [
      { name: "role", label: "Role", required: true },
      { name: "content", label: "Content", type: "textarea", required: true },
      { name: "session_id", label: "Session ID" },
      { name: "message_id", label: "Message ID" },
      { name: "model", label: "Model" },
      { name: "source", label: "Source" },
    ],
  },
] as const satisfies readonly AdminTableConfig[];

export function getAdminTableConfig(slug: string): AdminTableConfig {
  const config = ADMIN_TABLES.find((tableConfig) => tableConfig.slug === slug);

  if (!config) {
    throw new Error(`Unknown admin table: ${slug}`);
  }

  return config;
}

export function getMutableAdminTableConfig(slug: string): AdminTableConfig {
  const config = getAdminTableConfig(slug);

  if (config.readOnly || config.deleteOnly || config.fields.length === 0) {
    throw new Error(`Admin table is not editable: ${slug}`);
  }

  return config;
}

export function getDeletableAdminTableConfig(slug: string): AdminTableConfig {
  const config = getAdminTableConfig(slug);

  if (config.readOnly) {
    throw new Error(`Admin table is read-only: ${slug}`);
  }

  return config;
}
