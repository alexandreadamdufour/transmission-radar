import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabasePublic } from "@/lib/supabase";
import type { CessionRow } from "@/lib/data";
import { matchesCriteria, normalizeCriteria, buildDigestHtml, sendDigest } from "@/lib/alerts";
import { previousMonthSlug } from "@/lib/reports";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Subscription = { id: string; email: string; criteria: unknown };

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!expected || (authHeader !== `Bearer ${expected}` && querySecret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const publicClient = supabasePublic();

  const { data: subs, error: subsError } = await admin
    .from("alert_subscriptions")
    .select("id, email, criteria")
    .not("confirmed_at", "is", null)
    .is("unsubscribed_at", null);

  if (subsError) {
    return NextResponse.json({ ok: false, error: subsError.message }, { status: 500 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: recentRows, error: rowsError } = await publicClient
    .from("cessions")
    .select(
      "id, date_parution, denomination, ville, departement, departement_nom, region_nom, naf_code, naf_label, effectifs, score, score_details, url_bodacc"
    )
    .gte("date_parution", since)
    .order("score", { ascending: false });

  if (rowsError) {
    return NextResponse.json({ ok: false, error: rowsError.message }, { status: 500 });
  }

  const rows = (recentRows ?? []) as unknown as CessionRow[];
  const reportSlug = previousMonthSlug();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of (subs ?? []) as Subscription[]) {
    const criteria = normalizeCriteria(sub.criteria);
    const matches = rows.filter((r) => matchesCriteria(r, criteria));

    if (matches.length === 0) {
      skipped += 1;
      await admin.from("alert_sends").insert({ subscription_id: sub.id, cession_ids: [], status: "skipped_no_match" });
      continue;
    }

    const html = buildDigestHtml(matches, sub.id, reportSlug);
    const result = await sendDigest(sub.email, html);

    await admin.from("alert_sends").insert({
      subscription_id: sub.id,
      cession_ids: matches.slice(0, 15).map((m) => m.id),
      status: result.ok ? "sent" : "failed",
    });

    if (result.ok) sent += 1;
    else failed += 1;
  }

  return NextResponse.json({ ok: true, subscribers: subs?.length ?? 0, sent, skipped, failed });
}
