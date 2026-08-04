import { defineRouting } from "next-intl/routing";

// Greek stays unprefixed at "/" (matches every existing URL/bookmark/SEO
// link so far) — English lives under "/en". More languages (Bulgarian,
// Russian) get added to this list once EL/EN is verified solid, since each
// one needs a full messages/<locale>.json translation pass.
export const routing = defineRouting({
  locales: ["el", "en"],
  defaultLocale: "el",
  localePrefix: "as-needed",
  // Skorama is a Greek-market product first — "/" should always be Greek
  // regardless of the visitor's browser language, with English only shown
  // when explicitly chosen via the switcher (which then sticks via cookie).
  localeDetection: false,
});
