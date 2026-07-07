import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { normalizeCriteria, sendConfirmationEmail } from "@/lib/alerts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; criteria?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Corps de requête invalide" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Adresse email invalide" }, { status: 400 });
  }

  const criteria = normalizeCriteria(body.criteria);
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("alert_subscriptions")
    .insert({ email, criteria, confirmed_at: null, unsubscribed_at: null })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: "Impossible d'enregistrer l'inscription" }, { status: 500 });
  }

  const result = await sendConfirmationEmail(email, data.id);
  if (!result.ok) {
    // Row is saved either way; surface the send failure so the UI can say "check later".
    return NextResponse.json({ ok: true, emailSent: false, warning: result.error });
  }

  return NextResponse.json({ ok: true, emailSent: true });
}
