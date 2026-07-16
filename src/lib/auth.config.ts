import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no providers, no Prisma. Imported by both auth.ts and proxy.ts.
// Providers and the JWT callback (which needs Prisma) live in auth.ts only.
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/sent",
    error: "/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Reads role from the already-decoded JWT and puts it on session.user.
    // Works in both the proxy and the full server config.
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
      const role = (auth?.user as { role?: string } | undefined)?.role;

      if (pathname.startsWith("/admin")) {
        return role === "ADMIN";
      }

      if (pathname.startsWith("/write")) {
        return !!auth;
      }

      if (pathname.startsWith("/dashboard")) {
        if (role === "ADMIN") {
          return Response.redirect(new URL("/admin", request.nextUrl));
        }
        return role === "REGISTERER";
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
