import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals, static files, and the generated
  // favicon/PWA-icon routes (app/icon.tsx, app/apple-icon.tsx, app/icon-192
  // and app/icon-512 route handlers all serve at dot-less paths, so they'd
  // otherwise get swept up by the locale-prefixing logic and 404).
  matcher: ["/((?!api|_next|icon-192|icon-512|icon|apple-icon|.*\\..*).*)"],
};
