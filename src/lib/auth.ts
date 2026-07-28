import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { verifyPassword } from "@/lib/password";
import { MAGIC_LINK_MAX_AGE_S } from "@/lib/magic-link";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "MAINTAINER" | "AUTHOR" | "REGISTERER";
    } & DefaultSession["user"];
  }

  interface JWT {
    role?: "ADMIN" | "MAINTAINER" | "AUTHOR" | "REGISTERER";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Resend({
      from: process.env.EMAIL_FROM!,
      maxAge: MAGIC_LINK_MAX_AGE_S,
      // Without this Auth.js sends its own stock template on a raw fetch that
      // never reaches EmailLog. Imported lazily so the email templates stay
      // out of every bundle that merely needs auth().
      async sendVerificationRequest({ identifier, url }) {
        const { sendMagicLink } = await import("@/lib/resend");
        await sendMagicLink(identifier, url);
      },
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    // Override the callbacks from authConfig, keeping session+authorized
    // and adding a robust jwt callback that runs only in the Node.js context.
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // On sign-in: user is the full object returned by authorize or the adapter.
      if (user && "role" in user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).role = (user as any).role;
      }
      // Fallback: if role is still missing (e.g. NextAuth v5 beta adapter quirk),
      // fetch it from the DB so the session is always correct.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(token as any).role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (dbUser) (token as any).role = dbUser.role;
      }
      return token;
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
