import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../index.html");
const vercel = JSON.parse(read("../vercel.json"));
const routes = read("../../backend/src/routes/publicAcademyRoutes.js");
const app = read("../src/App.jsx");
const directory = read("../src/pages/publicAcademies/AcademyDirectory.jsx");
const details = read("../src/pages/publicAcademies/PublicAcademyDetails.jsx");
const robots = read("../api/robots.js");
const sitemap = read("../api/sitemap.js");

assert.match(html, /rel="canonical"/);
assert.match(html, /max-image-preview:large/);
assert.match(html, /property="og:title"/);
assert.ok(vercel.rewrites.some((item) => item.source === "/sitemap.xml"));
assert.ok(vercel.rewrites.some((item) => item.source === "/robots.txt"));
assert.match(routes, /"\/seo-index", getPublicAcademySeoIndex/);
assert.match(app, /PrivateRouteSeo/);
assert.match(directory, /"@type": "ItemList"/);
assert.match(details, /"SportsActivityLocation"/);
assert.match(details, /"BreadcrumbList"/);
assert.match(robots, /"\/students\/"/);
assert.match(robots, /privatePaths\.map\(\(path\) => `Disallow:/);
assert.match(sitemap, /public\/academies\/seo-index/);

console.log("SEO crawl, metadata and structured-data checks passed");
