import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals, static files, and the generated
  // favicon routes (app/icon.tsx, app/apple-icon.tsx serve at /icon and
  // /apple-icon — no dot in the path, so they'd otherwise get swept up by
  // the locale-prefixing logic and 404).
  matcher: ["/((?!api|_next|icon|apple-icon|.*\\..*).*)"],
};
