// Gate for the /admin dashboard and admin-only actions (ad banners, etc).
// There's no role/permission system in the User model — a comma-separated
// env var (set in Vercel, never committed) is enough for a small, fixed
// set of operators. Compared case-insensitively since email casing on
// login isn't normalized anywhere else either.
export function isAdminEmail(email?: string | null): boolean {
  const adminEmails = process.env.ADMIN_EMAIL;
  if (!adminEmails || !email) return false;
  const normalized = email.trim().toLowerCase();
  return adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
