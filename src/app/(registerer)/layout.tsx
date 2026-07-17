import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Proxy guards /dashboard/* by role. This layout adds a server-side double-check
// and redirects admins who land here back to their panel.
export default async function RegistererLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session) redirect("/signin");
  if (role === "ADMIN" || role === "MAINTAINER") redirect("/admin");
  if (role !== "REGISTERER") redirect("/signin");

  return <>{children}</>;
}
