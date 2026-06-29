import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "app");
const sitemapSource = path.join(root, "lib", "seo", "sitemap.ts");
const builtSitemap = path.join(root, ".next", "server", "app", "sitemap.xml.body");

const privatePrefixes = ["/account", "/admin", "/api", "/auth", "/dashboard", "/login"];

function main() {
  const publicStaticRoutes = findPublicStaticPageRoutes();
  const configuredStaticRoutes = readConfiguredStaticRoutes();
  const missingRoutes = publicStaticRoutes.filter((route) => !configuredStaticRoutes.has(route));

  if (missingRoutes.length > 0) {
    fail(`Missing static sitemap routes: ${missingRoutes.join(", ")}`);
  }

  validateBuiltSitemapIfPresent();
  console.log("Sitemap verification passed.");
}

function findPublicStaticPageRoutes() {
  return walk(appDir)
    .filter((file) => file.endsWith(`${path.sep}page.tsx`))
    .map((file) => routeFromPageFile(file))
    .filter((route) => route !== null)
    .sort();
}

function routeFromPageFile(file) {
  const relativeDir = path.relative(appDir, path.dirname(file));
  const segments = relativeDir === "" ? [] : relativeDir.split(path.sep);

  if (segments.some((segment) => segment === "(authenticated)" || segment.startsWith("[") || segment.includes("[...]"))) {
    return null;
  }

  const urlSegments = segments.filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")));
  const route = urlSegments.length === 0 ? "/" : `/${urlSegments.join("/")}`;

  if (privatePrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`))) {
    return null;
  }

  return route;
}

function readConfiguredStaticRoutes() {
  const source = readFileSync(sitemapSource, "utf8");
  const matches = source.matchAll(/path:\s*"([^"]+)"/g);

  return new Set([...matches].map((match) => match[1]));
}

function validateBuiltSitemapIfPresent() {
  if (!existsSync(builtSitemap)) {
    console.warn("Built sitemap not found. Run `npm run build` before XML validation.");
    return;
  }

  const xml = readFileSync(builtSitemap, "utf8");
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
  const privateUrls = urls.filter((url) => privatePrefixes.some((prefix) => new URL(url).pathname.startsWith(prefix)));
  const localhostUrls = urls.filter((url) => url.includes("localhost") || url.includes("127.0.0.1"));

  if (urls.length === 0) {
    fail("Built sitemap contains no <loc> entries.");
  }

  if (duplicates.length > 0) {
    fail(`Duplicate sitemap URLs: ${[...new Set(duplicates)].join(", ")}`);
  }

  if (privateUrls.length > 0) {
    fail(`Private URLs leaked into sitemap: ${privateUrls.join(", ")}`);
  }

  if (localhostUrls.length > 0) {
    fail(`Non-production URLs leaked into sitemap: ${localhostUrls.join(", ")}`);
  }
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);

    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

main();
