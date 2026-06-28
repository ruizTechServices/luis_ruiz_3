export type AdminFieldType = "text" | "textarea" | "checkbox";

export interface AdminField {
  name: string;
  label: string;
  type?: AdminFieldType;
  required?: boolean;
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
    description: "Public blog content. Reads are public; writes are Gio-only.",
    select: "id, created_at, title, summary, tags, references, body",
    orderBy: "created_at",
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
      "id, created_at, updated_at, title, slug, url, description, summary, status, category, featured, visibility, role, repo_url, live_url, cover_image_url",
    orderBy: "updated_at",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "slug", label: "Slug", required: true },
      { name: "url", label: "URL", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", required: true },
      { name: "category", label: "Category", required: true },
      { name: "visibility", label: "Visibility", required: true },
      { name: "role", label: "Role" },
      { name: "repo_url", label: "Repo URL" },
      { name: "live_url", label: "Live URL" },
      { name: "cover_image_url", label: "Cover image URL" },
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
    description: "Private contact intake. Public users can insert only.",
    select:
      "id, created_at, full_name, email, phone, company, subject, budget, timeline, preferred_contact, newsletter, message",
    orderBy: "created_at",
    createDisabled: true,
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
    select: "id, created_at, post_id, user_email, content",
    orderBy: "created_at",
    createDisabled: true,
    fields: [
      { name: "user_email", label: "User email", required: true },
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
    description: "Admin document vectors. Read-only until ingestion is designed.",
    select: "id, created_at, updated_at, title, source, url, content",
    orderBy: "created_at",
    fields: [],
    readOnly: true,
  },
  {
    slug: "gios-context",
    table: "gios_context",
    title: "Gio context",
    description: "Gio-specific context vectors. Read-only until ingestion is designed.",
    select: "id, created_at, session_id, message_id, role, model, source, content, user_id",
    orderBy: "created_at",
    fields: [],
    readOnly: true,
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
