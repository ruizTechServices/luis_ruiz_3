import { Hero } from "@/components/portfolio/hero";
import { PortfolioSections } from "@/components/portfolio/portfolio-sections";
import { getHomeContent } from "@/lib/public-content/data";

import "./editorial.css";

export default async function Home() {
  const { settings, projects, posts } = await getHomeContent();

  return (
    <main className="lr-editorial">
      <Hero settings={settings} />
      <PortfolioSections projects={projects} posts={posts} />
    </main>
  );
}
