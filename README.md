# luis-ruiz.com

Luis Giovanni Ruiz’s public portfolio, project case studies, blog, and contact page, with a private daily dashboard and story editor. Built with Next.js App Router, React, TypeScript, and the existing Supabase database and authentication.

**Start with the [daily operations guide](docs/portfolio-operations.md)** for writing, publishing, managing inquiries, maintaining projects, deployment, and recovery.

## Project identity

- Site: [luis-ruiz.com](https://luis-ruiz.com)
- Source: [ruizTechServices/luis_ruiz_3](https://github.com/ruizTechServices/luis_ruiz_3)
- Supabase project: `huyhgdsjpdjzokjwaspb` (`luis-ruiz`)
- Deployment: connected GitHub repository → Vercel

The public site shows published stories and public projects. Gio’s verified owner account controls publishing and administration. Other signed-in accounts retain their own private dashboard records.

## Run locally

Use a supported Node.js release compatible with Next.js 16 and npm.

```bash
git clone https://github.com/ruizTechServices/luis_ruiz_3.git
cd luis_ruiz_3
npm ci
```

Create an uncommitted `.env.local` with values from the existing project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://huyhgdsjpdjzokjwaspb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_existing_publishable_key
NEXT_PUBLIC_SITE_URL=https://www.luis-ruiz.com
```

Never put a secret or service-role key in a `NEXT_PUBLIC_` variable.

```bash
npm run dev
```

Open `http://localhost:3000`. `/dashboard` is the daily workspace; `/dashboard/write` is the owner’s story library and editor entry point. Save drafts explicitly before leaving the editor.

## Check a release

```bash
npm run lint
npx tsc --noEmit
npm run test:auth
npm run build
npm run test:sitemap
npm run start
```

Auth checks inspect source wiring; they do not replace a real signed-in browser test. Read the [operations guide](docs/portfolio-operations.md#verification-still-requiring-the-owner) for remaining owner checks and release limitations.

Contact requests are stored in the private inbox at `/admin/contactlist`. The site does not send email notifications or replies. Optional `OLLAMA_BASE_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL`, and `EMBEDDING_PROFILE_ID` configure the existing authenticated AI routes; they are separate from the core publishing and inquiry flows.

## Maintainer references

Read `AGENTS.md` before code changes for repository rules. Its historical maintenance notes may be stale; verify live state against source, migrations, and deployment evidence.

- [Daily operations and deployment](docs/portfolio-operations.md)
- [Auth routing](docs/auth-routing.md)
- [Sitemap maintenance](docs/sitemap-maintenance.md)

Database migrations and their rollback files live in `supabase/migrations/` and `supabase/migrations_down/`. A Vercel code rollback does not roll back Supabase. Preserve private drafts and access controls when planning recovery.
