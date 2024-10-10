import "./globals.css";
import type { Metadata } from "next";
import { Inter as FontSans, Manrope } from "next/font/google";
import { Providers } from "./provider";
import { cn } from "@/lib/utils";
import FooterSection from "@/components/FooterSection";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "DelTech MUN and Debsoc",
  description: "Where Diplomacy meets ...",
};

const fontHeading = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

const fontBody = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={cn(
          "flex flex-col antialiased",
          fontHeading.variable,
          fontBody.variable
        )}
      >
        <div className="flex-grow">
          <Providers>
            <header>
              <SiteHeader />
            </header>
            {children}
          </Providers>
        </div>
        <footer>
          <FooterSection />
        </footer>
      </body>
    </html>
  );
}
