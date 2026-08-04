import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Credentials provider requires JWT sessions in NextAuth v4 — the adapter
  // still owns User/Account/Subscription rows, only the session itself is
  // a signed cookie rather than a DB-backed row.
  //
  // maxAge + updateAge together give an idle timeout rather than a fixed
  // absolute expiry: every active request within `maxAge` re-signs the
  // cookie with a fresh `maxAge` window (sliding expiration), so a user who
  // keeps using the site never gets logged out, but 2h of no requests at
  // all lets the cookie expire on its own.
  session: { strategy: "jwt", maxAge: 2 * 60 * 60, updateAge: 15 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = user.id;
      if (token.userId) {
        const sub = await prisma.subscription.findUnique({ where: { userId: token.userId as string } });
        token.plan = sub?.status === "active" ? sub.plan : "FREE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
        (session.user as { plan?: string }).plan = (token.plan as string) ?? "FREE";
      }
      return session;
    },
  },
};
