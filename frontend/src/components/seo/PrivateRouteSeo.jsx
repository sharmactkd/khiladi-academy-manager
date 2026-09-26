import { useLocation } from "react-router-dom";
import Seo from "./Seo.jsx";

const PUBLIC_PATHS = [/^\/academies(?:\/[^/]+)?\/?$/, /^\/verify\/(?:id-card|certificate)\/[^/]+\/?$/];

export default function PrivateRouteSeo() {
  const { pathname } = useLocation();
  if (PUBLIC_PATHS.some((pattern) => pattern.test(pathname))) return null;
  return <Seo
    title="KHILADI Academy Manager"
    description="Secure academy management workspace."
    path={pathname}
    robots="noindex,nofollow,noarchive,nosnippet"
  />;
}
