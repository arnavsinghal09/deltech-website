import { ImageResponse } from "next/og"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07100d",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", width: 48, height: 48, border: "2px solid #2dd4bf", borderRadius: 999, opacity: 0.5 }} />
        <div style={{ position: "absolute", width: 36, height: 36, border: "1px solid #f4c86a", borderRadius: 999, opacity: 0.65 }} />
        <div style={{ display: "flex", color: "#ffffff", fontSize: 34, fontWeight: 900, letterSpacing: "-4px", transform: "translateX(-2px)" }}>D</div>
        <div style={{ position: "absolute", right: 9, top: 9, width: 8, height: 8, background: "#f4c86a" }} />
        <div style={{ position: "absolute", left: 5, bottom: 7, width: 22, height: 4, background: "#2dd4bf" }} />
      </div>
    ),
    size,
  )
}
