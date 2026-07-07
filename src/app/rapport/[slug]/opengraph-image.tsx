import { ImageResponse } from "next/og";
import { getCessions } from "@/lib/data";
import { buildMonthlyReport } from "@/lib/reports";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await getCessions();
  const report = buildMonthlyReport(rows, slug);

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
        <div style={{ fontSize: 24, color: "#777b86", display: "flex" }}>Transmission Radar · Rapport mensuel</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, color: "#17191c", textTransform: "capitalize", display: "flex" }}>
            {report?.label ?? slug}
          </div>
          <div style={{ fontSize: 28, color: "#1f4d3f", display: "flex" }}>
            {report ? `${report.count} cessions suivies · score moyen ${report.avgScore ?? "N/A"}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 20, color: "#979799" }}>transmission-radar.vercel.app</div>
      </div>
    ),
    { ...size }
  );
}
