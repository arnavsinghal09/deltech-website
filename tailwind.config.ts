import type { Config } from "tailwindcss"
import { designTokens as t } from "./src/styles/tokens"

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      spacing: t.spacing as unknown as Record<string, string>,
      borderRadius: {
        sm: t.radius.sm,
        md: t.radius.md,
        lg: t.radius.lg,
        full: t.radius.full,
      },
      colors: {
        primary: t.colors.primary,
        slate: t.colors.slate,
        success: t.colors.semantic.success,
        warning: t.colors.semantic.warning,
        error: t.colors.semantic.error,
        info: t.colors.semantic.info,
      },
      fontSize: Object.fromEntries(
        Object.entries(t.typography).map(([key, val]) => [
          key,
          [val.fontSize, { lineHeight: val.lineHeight, fontWeight: String(val.fontWeight) }],
        ])
      ) as Record<string, [string, { lineHeight: string; fontWeight: string }]>,
      fontFamily: {
        ui: t.fonts.ui.split(",").map((s) => s.trim()),
        serif: t.fonts.serif.split(",").map((s) => s.trim()),
        sans: t.fonts.ui.split(",").map((s) => s.trim()),
      },
      boxShadow: {
        sm: t.shadows.sm,
        md: t.shadows.md,
      },
      transitionDuration: {
        fast: t.motion.fast,
        normal: t.motion.normal,
        slow: t.motion.slow,
      },
      transitionTimingFunction: {
        DEFAULT: t.motion.easing,
      },
    },
  },
  plugins: [],
}

export default config
