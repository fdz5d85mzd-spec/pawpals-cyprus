// Gate for the /admin dashboard. There's no role/permission system in the
// User model — this app has exactly one operator, so a single env var
// (set in Vercel, never committed) is enough. Compared case-insensitively
// since email casing on login isn't normalized anywhere else either.
export function isAdminEmail(email?: string | null): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}
