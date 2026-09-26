const siteOrigin = () => String(process.env.SITE_URL || "https://academy.khiladi-khoj.com").replace(/\/$/, "");

export default function handler(_request, response) {
  const privatePaths = [
    "/account/", "/admin/", "/analytics/", "/attendance/", "/billing/",
    "/branches/", "/batches/", "/certificates/", "/championships/",
    "/communication/", "/dashboard", "/expenses/", "/fees/", "/imports/",
    "/notifications/", "/parent/", "/reports/", "/skills/", "/students/",
  ];
  const body = [
    "User-agent: *",
    "Allow: /academies",
    "Allow: /verify/",
    "Disallow: /api/",
    ...privatePaths.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${siteOrigin()}/sitemap.xml`,
    "",
  ].join("\n");
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  response.status(200).send(body);
}
