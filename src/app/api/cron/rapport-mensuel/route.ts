import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { previousMonthSlug } from "@/lib/reports";

export const dynamic = "force-dynamic";

// Runs the 1st of each month: the report for the month that just ended becomes
// available, so we force-revalidate its page and the index right away instead
// of waiting for the next organic request + ISR window.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.CRON_SECRET;

  if (!expected || (authHeader !== `Bearer ${expected}` && querySecret !== expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = previousMonthSlug();
  revalidatePath(`/rapport/${slug}`);
  revalidatePath("/rapports");

  return NextResponse.json({ ok: true, revalidated: slug });
}
