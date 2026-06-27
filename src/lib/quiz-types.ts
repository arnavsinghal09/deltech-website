// ── Slide config types ───────────────────────────────────────────────────────

export type MCQLayout = "BARS" | "DONUT" | "PIE" | "DOTS"
export type OpenTextLayout = "SPEECH_BUBBLES" | "FLOWING_GRID"
export type SlideType = "MCQ" | "WORDCLOUD" | "SCALE" | "OPEN_TEXT" | "CONTENT"
export type SlideMode = "POLL" | "QUIZ"

export type MCQConfig = {
  options: string[]        // 2–10 items
  correct: number[]        // option indices (quiz mode)
  layout: MCQLayout        // default BARS
  allowMultiple: boolean   // multiple correct answers
  timerSeconds: number | null
}

export type WordCloudConfig = {
  allowMultiple: boolean   // allow multiple submissions per person
  profanityFilter: boolean // default true
  timerSeconds: number | null
}

export type ScaleConfig = {
  min: number              // 1
  max: number              // 2–8
  minLabel: string         // e.g. "Strongly disagree"
  maxLabel: string         // e.g. "Strongly agree"
  statements: string[]     // 1–8 items
  timerSeconds: number | null
}

export type OpenTextConfig = {
  maxLength: number        // 1–200 (hard cap 200)
  layout: OpenTextLayout
  timerSeconds: number | null
}

export type ContentConfig = {
  body: string
}

export type SlideConfig =
  | MCQConfig
  | WordCloudConfig
  | ScaleConfig
  | OpenTextConfig
  | ContentConfig

export interface SlideData {
  id: string
  order: number
  type: SlideType
  prompt: string
  config: SlideConfig
}

// ── Presentation theme ────────────────────────────────────────────────────────

export interface PresentationTheme {
  background: string
  textColor: string
  accentColor: string
  font: string
}

export interface PresentationData {
  id: string
  title: string
  mode: SlideMode
  theme: PresentationTheme | null
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_MCQ_CONFIG: MCQConfig = {
  options: ["Option 1", "Option 2"],
  correct: [],
  layout: "BARS",
  allowMultiple: false,
  timerSeconds: null,
}

export const DEFAULT_WORDCLOUD_CONFIG: WordCloudConfig = {
  allowMultiple: false,
  profanityFilter: true,
  timerSeconds: null,
}

export const DEFAULT_SCALE_CONFIG: ScaleConfig = {
  min: 1,
  max: 5,
  minLabel: "Strongly disagree",
  maxLabel: "Strongly agree",
  statements: ["How much do you agree with this statement?"],
  timerSeconds: null,
}

export const DEFAULT_OPEN_TEXT_CONFIG: OpenTextConfig = {
  maxLength: 200,
  layout: "SPEECH_BUBBLES",
  timerSeconds: null,
}

export const DEFAULT_CONTENT_CONFIG: ContentConfig = {
  body: "",
}

export const DEFAULT_CONFIGS: Record<SlideType, SlideConfig> = {
  MCQ:       DEFAULT_MCQ_CONFIG,
  WORDCLOUD: DEFAULT_WORDCLOUD_CONFIG,
  SCALE:     DEFAULT_SCALE_CONFIG,
  OPEN_TEXT: DEFAULT_OPEN_TEXT_CONFIG,
  CONTENT:   DEFAULT_CONTENT_CONFIG,
}

// ── Preset themes ─────────────────────────────────────────────────────────────

export const PRESET_THEMES: Record<string, PresentationTheme> = {
  classic: { background: "#ffffff", textColor: "#111827", accentColor: "#0f766e", font: "Inter" },
  dark:    { background: "#111827", textColor: "#f9fafb", accentColor: "#5eead4", font: "Inter" },
  ocean:   { background: "#0c4a6e", textColor: "#e0f2fe", accentColor: "#38bdf8", font: "Inter" },
  warm:    { background: "#fffbeb", textColor: "#78350f", accentColor: "#f59e0b", font: "Georgia" },
  forest:  { background: "#14532d", textColor: "#f0fdf4", accentColor: "#86efac", font: "Inter" },
}

export const DEFAULT_THEME = PRESET_THEMES.classic

// ── Cast helpers ──────────────────────────────────────────────────────────────

export const asMCQ       = (c: SlideConfig) => c as MCQConfig
export const asWordCloud = (c: SlideConfig) => c as WordCloudConfig
export const asScale     = (c: SlideConfig) => c as ScaleConfig
export const asOpenText  = (c: SlideConfig) => c as OpenTextConfig
export const asContent   = (c: SlideConfig) => c as ContentConfig

export function parseConfig(raw: unknown, type: SlideType): SlideConfig {
  const defaults = DEFAULT_CONFIGS[type]
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults
  return { ...defaults, ...(raw as object) } as SlideConfig
}

// ── Avatars ───────────────────────────────────────────────────────────────────

export const AVATARS = [
  "🦁","🐯","🐻","🦊","🐸","🐧","🦅","🦋","🦄","🐊","🦖","🐙","🦑","🐳","🦈",
  "🐝","🦉","🐺","🦝","🐲",
] as const

// ── Realtime broadcast events ─────────────────────────────────────────────────

export type LBEntry = {
  nickname: string
  avatar: string
  totalPoints: number
  rank: number
  delta?: number   // rank change from last leaderboard
}

export type PresenceEntry = {
  nickname: string
  avatar: string
  userId: string
}

export type QuizBroadcast =
  | { event: "START" }
  | { event: "GOTO"; slideId: string; slideIndex: number; slideCount: number; slide: SlideData }
  | { event: "LOCK" }
  | { event: "UNLOCK" }
  | { event: "REVEAL"; correctIndices: number[] }
  | { event: "LEADERBOARD"; entries: LBEntry[]; final: boolean }
  | { event: "END" }

// ── Tally types ───────────────────────────────────────────────────────────────

export type MCQTally = {
  type: "MCQ"
  totalVotes: number
  counts: number[]
  percentages: number[]
}
export type WordCloudTally = {
  type: "WORDCLOUD"
  totalVotes: number
  words: { text: string; count: number }[]
}
export type ScaleTally = {
  type: "SCALE"
  totalVotes: number
  averages: number[]
  distributions: number[][]
}
export type OpenTextTally = {
  type: "OPEN_TEXT"
  totalVotes: number
  responses: { text: string; nickname: string }[]
}
export type ContentTally = { type: "CONTENT"; totalVotes: 0 }

export type Tally = MCQTally | WordCloudTally | ScaleTally | OpenTextTally | ContentTally

export function parseTheme(raw: unknown): PresentationTheme {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_THEME
  return { ...DEFAULT_THEME, ...(raw as object) }
}
