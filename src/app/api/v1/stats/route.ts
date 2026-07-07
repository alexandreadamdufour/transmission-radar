import { NextRequest, NextResponse } from "next/server";
import { getCessions } from "@/lib/data";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retry_at: new Date(limit.resetAt).toISOString() },
      { status: 429, headers: CORS_HEADERS }
    );
  }

  const rows = await getCessions();

  const byMonth = new Map<string, { count: number; scoreSum: number; scoreCount: number }>();
  for (const r of rows) {
    const d = new Date(r.date_parution);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, { count: 0, scoreSum: 0, scoreCount: 0 });
    const e = byMonth.get(key)!;
    e.count += 1;
    if (r.score != null) {
      e.scoreSum += r.score;
      e.scoreCount += 1;
    }
  }

  const stats = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, e]) => ({
      month,
      count: e.count,
      avg_score: e.scoreCount ? Math.round(e.scoreSum / e.scoreCount) : null,
    }));

  return NextResponse.json(
    {
      data: stats,
      note: "Agrégats calculés sur la fenêtre de données retenue par Transmission Radar (pas l'historique BODACC complet).",
      source: "BODACC × SIRENE — Transmission Radar (Institut Sapiens)",
    },
    { headers: { ...CORS_HEADERS, "X-RateLimit-Remaining": String(limit.remaining) } }
  );
}
