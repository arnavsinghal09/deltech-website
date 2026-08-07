"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

// next-themes governs the MARKETING/PUBLIC site only. Its storageKey is scoped to
// `theme-site` so it can no longer decide what /admin and /recruitment look like,
// those shells render their own class from their own cookie on the server (see
// src/lib/theme.ts). The scope-aware dark variant in globals.css means a `.dark`
// left on <html> by this provider cannot leak into those areas.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      storageKey="theme-site"
      disableTransitionOnChange
    >
      {children}
      <Toaster richColors closeButton position="bottom-right" />
    </ThemeProvider>
  );
}
