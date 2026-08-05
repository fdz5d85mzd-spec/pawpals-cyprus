import { defineRouting } from "next-intl/routing";

// Greek stays unprefixed at "/" (matches every existing URL/bookmark/SEO
// link so far) — every other language lives under its own prefix
// ("/en", "/bg", "/ru").
export const routing = defineRouting({
  locales: ["el", "en", "bg", "ru"],
  defaultLocale: "el",
  localePrefix: "as-needed",
  // Skorama is a Greek-market product first — "/" should always be Greek
  // regardless of the visitor's browser language, with English only shown
  // when explicitly chosen via the switcher (which then sticks via cookie).
  localeDetection: false,
});
