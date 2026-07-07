import { NextRequest, NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_PER_PAGE = 100;
const DEFAULT_PER_PAGE = 25;

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

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(sp.get("per_page") ?? DEFAULT_PER_PAGE) || DEFAULT_PER_PAGE));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabase = supabasePublic();
  let query = supabase
    .from("cessions")
    .select(
      "id, date_parution, denomination, ville, departement, departement_nom, region_nom, naf_code, naf_label, effectifs, score, url_bodacc",
      { count: "exact" }
    )
    .order("date_parution", { ascending: false });

  const region = sp.get("region");
  if (region) query = query.eq("region_nom", region);

  const dept = sp.get("dept");
  if (dept) query = query.eq("departement", dept);

  const famille = sp.get("famille");
  if (famille) query = query.eq("naf_label", famille);

  const scoreMin = sp.get("score_min");
  if (scoreMin) query = query.gte("score", Number(scoreMin));

  const dateFrom = sp.get("date_from");
  if (dateFrom) query = query.gte("date_parution", dateFrom);

  const dateTo = sp.get("date_to");
  if (dateTo) query = query.lte("date_parution", dateTo);

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return NextResponse.json(
    {
      data,
      page,
      per_page: perPage,
      total: count ?? 0,
      source: "BODACC × SIRENE — Transmission Radar (Institut Sapiens)",
    },
    { headers: { ...CORS_HEADERS, "X-RateLimit-Remaining": String(limit.remaining) } }
  );
}
