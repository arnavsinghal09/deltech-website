import type { NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";

// Edge-safe config (no Prisma). Imported by both auth.ts and proxy.ts.
export const authConfig = {
  providers: [Resend({ from: process.env.EMAIL_FROM! })],
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/sent",
    error: "/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user && "role" in user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((token as any).role) (session.user as any).role = (token as any).role;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin")) {
        return (auth?.user as { role?: string } | undefined)?.role === "ADMIN";
      }

      if (pathname.startsWith("/write")) {
        return !!auth;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
