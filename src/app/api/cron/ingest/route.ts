import { NextRequest, NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily incremental ingestion. Vercel Cron sends the CRON_SECRET as a Bearer token;
// a `?secret=` query param is also accepted for manual triggering.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!expected || (authHeader !== `Bearer ${expected}` && querySecret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look back 4 days to absorb BODACC publication delays without re-scanning all history.
  const since = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const result = await runIngestion(since);
    return NextResponse.json({ ok: true, since, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
