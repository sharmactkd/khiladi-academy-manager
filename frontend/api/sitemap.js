const escapeXml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const siteOrigin = () => String(process.env.SITE_URL || "https://academy.khiladi-khoj.com").replace(/\/$/, "");
const apiOrigin = () => String(process.env.API_BASE_URL || process.env.VITE_API_URL || "").replace(/\/$/, "");

export default async function handler(_request, response) {
  const origin = siteOrigin();
  const urls = [
    { loc: `${origin}/academies`, changefreq: "daily", priority: "1.0" },
  ];

  try {
    const base = apiOrigin();
    if (base) {
      const result = await fetch(`${base}/public/academies/seo-index`, {
        headers: { Accept: "application/json" },
      });
      if (result.ok) {
        const payload = await result.json();
        for (const item of payload?.data?.items || []) {
          if (!item?.slug) continue;
          urls.push({
            loc: `${origin}/academies/${encodeURIComponent(item.slug)}`,
            lastmod: item.updatedAt ? new Date(item.updatedAt).toISOString() : "",
            changefreq: "weekly",
            priority: "0.8",
          });
        }
      }
    }
  } catch {
    // The directory URL remains discoverable if the API is temporarily unavailable.
  }

  const entries = urls.map((item) => [
    "  <url>",
    `    <loc>${escapeXml(item.loc)}</loc>`,
    item.lastmod ? `    <lastmod>${escapeXml(item.lastmod)}</lastmod>` : "",
    `    <changefreq>${item.changefreq}</changefreq>`,
    `    <priority>${item.priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n")).join("\n");

  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
  response.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
}
