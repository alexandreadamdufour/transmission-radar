import { Resend } from "resend";
import type { CessionRow } from "./data";
import { createAlertToken } from "./alerts-token";
import { effectifsLabel, formatDate } from "./format";

export type AlertCriteria = {
  regions: string[];
  secteurs: string[];
  scoreMin: number;
  effectifMin: string | null;
};

export function normalizeCriteria(input: unknown): AlertCriteria {
  const c = (input ?? {}) as Partial<AlertCriteria>;
  return {
    regions: Array.isArray(c.regions) ? c.regions.filter((v): v is string => typeof v === "string") : [],
    secteurs: Array.isArray(c.secteurs) ? c.secteurs.filter((v): v is string => typeof v === "string") : [],
    scoreMin: typeof c.scoreMin === "number" && c.scoreMin >= 0 && c.scoreMin <= 100 ? c.scoreMin : 40,
    effectifMin: typeof c.effectifMin === "string" ? c.effectifMin : null,
  };
}

export function matchesCriteria(row: CessionRow, criteria: AlertCriteria): boolean {
  if (criteria.regions.length && !(row.region_nom && criteria.regions.includes(row.region_nom))) return false;
  if (criteria.secteurs.length && !(row.naf_label && criteria.secteurs.includes(row.naf_label))) return false;
  if ((row.score ?? -1) < criteria.scoreMin) return false;
  if (criteria.effectifMin) {
    const min = Number(criteria.effectifMin);
    const val = row.effectifs ? Number(row.effectifs) : NaN;
    if (Number.isNaN(val) || val < min) return false;
  }
  return true;
}

const MAX_ITEMS_PER_DIGEST = 15;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://transmission-radar.vercel.app";
}

export function buildDigestHtml(matches: CessionRow[], subscriptionId: string, latestReportSlug: string | null): string {
  const unsubToken = createAlertToken(subscriptionId, "unsubscribe");
  const items = matches
    .slice(0, MAX_ITEMS_PER_DIGEST)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .map(
      (r) => `
      <tr>
        <td style="padding:12px 0;border-top:1px solid #e4e4e6;">
          <div style="font-family:Georgia,serif;font-size:17px;color:#17191c;">
            <a href="${siteUrl()}/annonce/${r.id}" style="color:#17191c;text-decoration:none;">${r.denomination ?? "Entreprise non nommée"}</a>
          </div>
          <div style="font-size:13px;color:#777b86;margin-top:4px;">
            ${r.ville ?? "—"} · ${r.naf_label ?? "—"} · ${effectifsLabel(r.effectifs)} ·
            <span style="font-variant-numeric:tabular-nums;">score ${r.score ?? "—"}</span>
          </div>
        </td>
      </tr>`
    )
    .join("");

  const reportLine = latestReportSlug
    ? `<p style="font-size:13px;color:#777b86;">Le <a href="${siteUrl()}/rapport/${latestReportSlug}" style="color:#1f4d3f;">rapport mensuel</a> le plus récent est disponible.</p>`
    : "";

  return `
  <div style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#17191c;">
    <p style="font-size:13px;color:#777b86;text-transform:uppercase;letter-spacing:0.04em;">Transmission Radar</p>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:8px 0 20px;">Vos cessions de la semaine</h1>
    <table width="100%" cellpadding="0" cellspacing="0">${items}</table>
    ${reportLine}
    <p style="font-size:12px;color:#979799;margin-top:32px;">
      Vous recevez cet email car vous êtes abonné aux alertes Transmission Radar.
      <a href="${siteUrl()}/alertes/desinscription?token=${unsubToken}" style="color:#777b86;">Se désinscrire en un clic</a>.
    </p>
  </div>`;
}

export async function sendDigest(to: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured — digest generated but not sent" };

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "Transmission Radar <onboarding@resend.dev>";
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Vos cessions de la semaine — Transmission Radar",
    html,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendConfirmationEmail(to: string, subscriptionId: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const confirmToken = createAlertToken(subscriptionId, "confirm");
  const confirmUrl = `${siteUrl()}/alertes/confirmer?token=${confirmToken}`;

  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured — confirmation not sent" };

  const html = `
  <div style="max-width:480px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#17191c;">
    <p style="font-size:13px;color:#777b86;text-transform:uppercase;letter-spacing:0.04em;">Transmission Radar</p>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:8px 0 16px;">Confirmez votre inscription</h1>
    <p style="font-size:14px;color:#17191c;line-height:1.6;">
      Cliquez ci-dessous pour confirmer votre abonnement aux alertes de cessions de PME correspondant à vos critères.
    </p>
    <a href="${confirmUrl}" style="display:inline-block;margin-top:16px;padding:10px 24px;border-radius:9999px;background:#17191c;color:#fff;text-decoration:none;font-size:14px;">Confirmer mon inscription</a>
    <p style="font-size:12px;color:#979799;margin-top:24px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  </div>`;

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "Transmission Radar <onboarding@resend.dev>";
  const { error } = await resend.emails.send({ from, to, subject: "Confirmez votre inscription aux alertes", html });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Kept here (not in scoring.ts / ingest.ts) so it's obvious this only formats
// existing scored rows for email — no scoring logic is duplicated or re-derived.
export function formatSentAt(iso: string): string {
  return formatDate(iso);
}
