export const portfolioFocus = [
  { index: "01", label: "Production web apps", href: "#work" },
  { index: "02", label: "AI integrations", href: "#capabilities" },
  { index: "03", label: "Data and auth systems", href: "#capabilities" },
  { index: "04", label: "Founder-led delivery", href: "#about" },
] as const;

export const workflowColumns = {
  inputs: ["Web form", "CSV upload", "Email inquiry", "Manual entry"],
  routing: ["Ingest", "Normalize", "Enrich", "Classify"],
  outputs: ["Database", "Dashboard", "Notification", "Integration"],
} as const;

export const capabilities = [
  {
    index: "01",
    title: "Full-stack products",
    description:
      "Production interfaces, APIs, dashboards, content systems, and the connective logic that turns separate screens into one dependable product.",
    detail: "Next.js · React · TypeScript · API design",
  },
  {
    index: "02",
    title: "AI and automation",
    description:
      "AI-enabled workflows with clear inputs, guarded actions, human review points, and useful outputs—not a chatbot added for decoration.",
    detail: "AI routes · Tool workflows · Private compute",
  },
  {
    index: "03",
    title: "Data, auth, and operations",
    description:
      "Supabase-backed systems with PostgreSQL, role-aware access, server-rendered authentication, admin controls, and maintainable operational paths.",
    detail: "Supabase · PostgreSQL · OAuth · RLS",
  },
  {
    index: "04",
    title: "Founder-led technical execution",
    description:
      "A direct bridge from business constraints to architecture, implementation, deployment, and the next sensible improvement.",
    detail: "Discovery · Architecture · Delivery · Iteration",
  },
] as const;

export const aboutFacts = [
  { label: "Based in", value: "New York" },
  { label: "Company", value: "ruizTechServices" },
  { label: "Founded", value: "September 2024" },
  { label: "Focus", value: "Useful systems" },
] as const;
