import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "AUTHOR";
    } & DefaultSession["user"];
  }

  interface JWT {
    role?: "ADMIN" | "AUTHOR";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
});

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
