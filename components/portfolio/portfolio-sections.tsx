import Link from "next/link";

import { firstParagraph, formatDate } from "@/lib/data/format";
import { aboutFacts, capabilities } from "@/lib/portfolio-content";
import type { BlogPostWithStats, Project } from "@/lib/public-content/data";

interface SectionIntroProps {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}

function SectionIntro({ index, eyebrow, title, description }: SectionIntroProps) {
  return (
    <div className="lrp-section-intro">
      <span className="lrp-section-index">{index}</span>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <div className="lrp-section-intro__line" />
      <p className="lrp-section-intro__description">{description}</p>
    </div>
  );
}

function compactText(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const title = project.title?.trim() || project.slug;
  const label = project.category?.trim() || project.role?.trim() || "Case study";
  const status = project.current_status?.trim() || project.status?.trim();
  const summary = firstParagraph(
    project.summary ?? project.description,
    "Open the case study for the implementation details.",
  );
  const proof = compactText([
    project.role ? `Role · ${project.role}` : null,
    project.problem ? firstParagraph(project.problem, "") : null,
    project.outcomes ? firstParagraph(project.outcomes, "") : null,
  ]);
  const stack = (project.stack ?? []).filter((item) => item.trim().length > 0);
  const projectHref = project.slug.trim()
    ? `/projects/${encodeURIComponent(project.slug)}`
    : "/projects";
  const isFeatured = index === 0;

  return (
    <article className={`lrp-project-card ${isFeatured ? "lrp-project-card--featured" : ""}`}>
      <div className="lrp-project-card__header">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span>{label}</span>
        {status ? (
          <span className="lrp-project-status">
            <i aria-hidden="true" /> {status}
          </span>
        ) : null}
      </div>
      <div
        className={`lrp-project-card__body ${proof.length === 0 ? "lrp-project-card__body--single" : ""}`}
      >
        <div>
          <h3>{title}</h3>
          <p>{summary}</p>
        </div>
        {proof.length > 0 ? (
          <ol className="lrp-project-proof">
            {proof.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        ) : null}
      </div>
      <div className="lrp-project-card__footer">
        {stack.length > 0 ? (
          <ul aria-label={`${title} technologies`}>
            {stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <span className="lrp-project-card__stack-empty">Technical case study</span>
        )}
        <Link href={projectHref}>
          Open project <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function WorkSection({ projects }: { projects: readonly Project[] }) {
  return (
    <section className="lrp-portfolio-section lrp-work-section" id="work">
      <SectionIntro
        index="02"
        eyebrow="Selected systems"
        title="Proof lives in the build."
        description="These records come from the production portfolio database. Each one connects a real need to an implemented technical path."
      />
      {projects.length > 0 ? (
        <div className="lrp-project-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      ) : (
        <div className="lrp-empty-state">
          <p>Case studies are being prepared for publication.</p>
          <Link href="/contact">Discuss a relevant build →</Link>
        </div>
      )}
      <div className="lrp-section-link-row">
        <Link href="/projects">View every public project →</Link>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className="lrp-portfolio-section lrp-capabilities-section" id="capabilities">
      <SectionIntro
        index="03"
        eyebrow="Capabilities"
        title="From business friction to production system."
        description="The work is structured around outcomes: understand the operational problem, choose the smallest sound architecture, ship it, and make the next iteration easier."
      />
      <div className="lrp-capability-list">
        {capabilities.map((capability) => (
          <article key={capability.index} className="lrp-capability-row">
            <span>{capability.index}</span>
            <h3>{capability.title}</h3>
            <p>{capability.description}</p>
            <small>{capability.detail}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="lrp-portfolio-section lrp-about-section" id="about">
      <div className="lrp-about-label">
        <span>04</span>
        <p>Operator profile</p>
      </div>
      <div className="lrp-about-copy">
        <p className="lrp-about-kicker">New York · Developer · Founder</p>
        <h2>I work where software, operations, and real people collide.</h2>
        <div className="lrp-about-columns">
          <p>
            I’m Luis Ruiz, a New York developer and the founder of ruizTechServices. I build
            full-stack applications, AI-enabled systems, and practical automation for small
            businesses.
          </p>
          <p>
            My approach is direct: understand the work people are already doing, remove avoidable
            friction, protect the important paths, and leave behind a system that can be understood
            and improved.
          </p>
        </div>
        <div className="lrp-about-facts" aria-label="About Luis Ruiz">
          {aboutFacts.map((fact) => (
            <div key={fact.label}>
              <small>{fact.label}</small>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WritingCard({ post, index }: { post: BlogPostWithStats; index: number }) {
  const title = post.title?.trim() || `Post ${post.id}`;
  const description = firstParagraph(post.summary, "Open the article to read the full field note.");
  const commentLabel = post.comment_count === 1 ? "comment" : "comments";

  return (
    <Link className="lrp-writing-card" href={`/blog/${post.id}`}>
      <span className="lrp-writing-card__number">No. {String(index + 1).padStart(2, "0")}</span>
      {post.tags ? <span className="lrp-writing-card__tag">{post.tags}</span> : null}
      <p className="lrp-writing-card__date">{formatDate(post.created_at)}</p>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="lrp-writing-card__meta">
        {post.comment_count} {commentLabel} · {post.up_votes} up · {post.down_votes} down
      </span>
      <span className="lrp-writing-card__link">
        Read the field note <b aria-hidden="true">→</b>
      </span>
    </Link>
  );
}

function WritingSection({ posts }: { posts: readonly BlogPostWithStats[] }) {
  return (
    <section className="lrp-portfolio-section lrp-writing-section" id="writing">
      <SectionIntro
        index="05"
        eyebrow="Systems journal"
        title="I document the engineering behind the work."
        description="Build logs, architecture decisions, and field notes make the work inspectable—and force clearer thinking while it is being built."
      />
      {posts.length > 0 ? (
        <div className="lrp-writing-grid">
          {posts.map((post, index) => (
            <WritingCard key={post.id} post={post} index={index} />
          ))}
        </div>
      ) : (
        <div className="lrp-empty-state">
          <p>No public field notes are available yet.</p>
          <Link href="/blog">Open the writing archive →</Link>
        </div>
      )}
      <div className="lrp-section-link-row">
        <Link href="/blog">View every public article →</Link>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="lrp-contact-section" id="contact">
      <div className="lrp-contact-section__meta">
        <span>06</span>
        <p>Start here</p>
      </div>
      <div className="lrp-contact-section__body">
        <p className="lrp-eyebrow">For businesses and technical teams</p>
        <h2>Bring me the messy part.</h2>
        <p>
          If you have a process held together by repetitive work, disconnected tools, or a product
          idea that needs a credible technical path, send the context. I’ll help identify the next
          sensible move.
        </p>
        <div className="lrp-contact-actions">
          <Link className="lrp-button lrp-button--contact" href="/contact">
            Describe the project <span aria-hidden="true">→</span>
          </Link>
          <Link className="lrp-contact-link" href="/projects">
            Review the engineering work <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PortfolioSections({
  projects,
  posts,
}: {
  projects: readonly Project[];
  posts: readonly BlogPostWithStats[];
}) {
  return (
    <>
      <WorkSection projects={projects} />
      <CapabilitiesSection />
      <AboutSection />
      <WritingSection posts={posts} />
      <ContactSection />
    </>
  );
}
