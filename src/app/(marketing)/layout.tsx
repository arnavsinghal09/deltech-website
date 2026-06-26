import { getContent } from "@/lib/settings";
import { Header } from "./_components/header";
import { Footer } from "./_components/footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer contacts={content.queryContacts} />
    </div>
  );
}
