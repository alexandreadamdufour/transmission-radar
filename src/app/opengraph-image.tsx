import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "9999px",
              border: "3px solid #1f4d3f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "9999px", background: "#1f4d3f" }} />
          </div>
          <div style={{ fontSize: 24, color: "#777b86", display: "flex" }}>Transmission Radar</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, color: "#17191c", lineHeight: 1.05, letterSpacing: -1, display: "flex" }}>
            La vague de transmission des PME françaises
          </div>
          <div style={{ fontSize: 26, color: "#777b86", maxWidth: 900, display: "flex" }}>
            Suivi public des cessions d&apos;entreprises — BODACC × SIRENE, scoré et à jour chaque jour.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 20, color: "#979799" }}>transmission-radar.vercel.app</div>
      </div>
    ),
    { ...size }
  );
}
