import { getCessions } from "@/lib/data";

export const revalidate = 3600;

const SITE_URL = "https://transmission-radar.vercel.app";
const THRESHOLD = 70;
const MAX_ITEMS = 50;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const rows = await getCessions();
  const items = rows
    .filter((r) => (r.score ?? 0) >= THRESHOLD)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, MAX_ITEMS);

  const xmlItems = items
    .map((r) => {
      const title = escapeXml(`${r.denomination ?? "Entreprise non nommée"} — score ${r.score} (${r.ville ?? "?"})`);
      const link = `${SITE_URL}/annonce/${r.id}`;
      const pubDate = new Date(r.date_parution).toUTCString();
      const description = escapeXml(
        `${r.naf_label ?? "Secteur non enrichi"} · ${r.region_nom ?? "—"} · score d'opportunité ${r.score}/100`
      );
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Transmission Radar — Opportunités fortes</title>
    <link>${SITE_URL}/opportunites</link>
    <description>Cessions de PME françaises scorées ≥ ${THRESHOLD}/100, mises à jour quotidiennement.</description>
    <language>fr</language>
${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
