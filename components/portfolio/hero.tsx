import Link from "next/link";

import { WorkflowDiagram } from "@/components/portfolio/workflow-diagram";
import { portfolioFocus } from "@/lib/portfolio-content";
import type { SiteSettings } from "@/lib/public-content/data";

function UtilityRail() {
  return (
    <aside className="lrp-utility-rail" aria-hidden="true">
      <span>LR — NYC</span>
      <i />
      <span>Systems journal</span>
      <span>Portfolio</span>
      <i />
      <b>•••</b>
    </aside>
  );
}

export function Hero({ settings }: { settings: SiteSettings | null }) {
  const configuredText = settings?.availability_text?.trim();
  const declaresAvailability = configuredText
    ? /\b(ready|available|open)\b/i.test(configuredText)
    : true;
  const isAvailable = settings?.availability !== false || declaresAvailability;
  const availabilityText = isAvailable
    ? configuredText && !/baby/i.test(configuredText)
      ? configuredText
      : "Available for selected work"
    : "Currently booked";
  const availabilityClass = isAvailable
    ? "lrp-availability--open"
    : "lrp-availability--closed";

  return (
    <section id="top" className="lrp-hero-shell">
      <UtilityRail />
      <div className="lrp-hero-frame">
        <div className="lrp-hero-meta">
          <p>Full-stack systems · AI automation · New York</p>
          <p className={`lrp-availability ${availabilityClass}`}>
            <span aria-hidden="true" />
            {availabilityText}
          </p>
        </div>

        <div className="lrp-hero-grid">
          <div className="lrp-hero-copy">
            <p className="lrp-eyebrow">
              Developer <span>•</span> Founder <span>•</span> Systems builder
            </p>
            <h1>I build software that turns messy business work into dependable systems.</h1>
            <p className="lrp-hero-intro">
              I’m Luis Ruiz, a full-stack developer and the founder of ruizTechServices. I build
              production web applications, AI integrations, and automation for service businesses.
            </p>
            <div className="lrp-hero-actions">
              <Link className="lrp-button lrp-button--primary" href="/contact">
                Start a project <span aria-hidden="true">→</span>
              </Link>
              <Link className="lrp-button lrp-button--text" href="/projects">
                View engineering work <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <WorkflowDiagram />
        </div>

        <nav className="lrp-proof-strip" aria-label="Portfolio focus areas">
          {portfolioFocus.map((item) => (
            <a key={item.index} href={item.href}>
              <small>{item.index}</small>
              <strong>{item.label}</strong>
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </nav>

        <div className="lrp-next-section-preview" aria-hidden="true">
          <span>Selected work</span>
          <i />
          <span>Database-backed case studies</span>
          <b>↓</b>
        </div>
      </div>
    </section>
  );
}
