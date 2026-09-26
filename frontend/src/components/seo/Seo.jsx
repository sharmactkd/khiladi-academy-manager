import { useEffect } from "react";

const DEFAULT_ORIGIN = "https://academy.khiladi-khoj.com";
const SITE_NAME = "KHILADI Academy";

const brandedTitle = (value) => {
  const title = String(value || "Academy Manager").trim();
  if (/^KHILADI\s*-/i.test(title)) return title;
  const cleanTitle = title.replace(/\s*\|\s*KHILADI(?:\s+Academy)?\s*$/i, "").trim();
  return `KHILADI - ${cleanTitle || "Academy Manager"}`;
};

const absoluteUrl = (value, origin) => {
  if (!value) return "";
  try { return new URL(value, origin).toString(); } catch { return ""; }
};

const setMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector);
  if (!value) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    const [key, rawValue] = attribute;
    element.setAttribute(key, rawValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
};

const setCanonical = (url) => {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
};

export default function Seo({
  title,
  description,
  path,
  image = "",
  robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  type = "website",
  structuredData = [],
}) {
  useEffect(() => {
    const origin = String(import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin || DEFAULT_ORIGIN).replace(/\/$/, "");
    const canonical = absoluteUrl(path || window.location.pathname, origin);
    const socialImage = absoluteUrl(image, origin);
    const pageTitle = brandedTitle(title);
    document.title = pageTitle;
    setCanonical(canonical);
    setMeta('meta[name="description"]', ["name", "description"], description);
    setMeta('meta[name="robots"]', ["name", "robots"], robots);
    setMeta('meta[name="googlebot"]', ["name", "googlebot"], robots);
    setMeta('meta[property="og:type"]', ["property", "og:type"], type);
    setMeta('meta[property="og:site_name"]', ["property", "og:site_name"], SITE_NAME);
    setMeta('meta[property="og:title"]', ["property", "og:title"], pageTitle);
    setMeta('meta[property="og:description"]', ["property", "og:description"], description);
    setMeta('meta[property="og:url"]', ["property", "og:url"], canonical);
    setMeta('meta[property="og:image"]', ["property", "og:image"], socialImage);
    setMeta('meta[name="twitter:card"]', ["name", "twitter:card"], socialImage ? "summary_large_image" : "summary");
    setMeta('meta[name="twitter:title"]', ["name", "twitter:title"], pageTitle);
    setMeta('meta[name="twitter:description"]', ["name", "twitter:description"], description);
    setMeta('meta[name="twitter:image"]', ["name", "twitter:image"], socialImage);

    document.head.querySelectorAll('script[data-khiladi-seo="true"]').forEach((node) => node.remove());
    const records = Array.isArray(structuredData) ? structuredData : [structuredData];
    records.filter(Boolean).forEach((record) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.khiladiSeo = "true";
      script.textContent = JSON.stringify(record).replace(/</g, "\\u003c");
      document.head.appendChild(script);
    });
  }, [title, description, path, image, robots, type, structuredData]);

  return null;
}
