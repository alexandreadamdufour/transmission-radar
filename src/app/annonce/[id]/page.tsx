import Link from "next/link";
import { notFound } from "next/navigation";
import { getCessionById } from "@/lib/data";
import { effectifsLabel, effectifsTooltip, formatDate } from "@/lib/format";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";

export const revalidate = 3600;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-tertiary">{label}</p>
      <p className="mt-1 text-sm text-ink">{children}</p>
    </div>
  );
}

export default async function AnnonceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cession = await getCessionById(id);
  if (!cession) notFound();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-8">
          <Link
            href="/"
            className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] space-y-10 px-6 pb-24">
        <div>
          <p className="text-sm font-medium text-tertiary">{cession.naf_label ?? "Secteur non enrichi"}</p>
          <h1 className="font-serif-display mt-1 text-[40px] leading-[1.05] tracking-[-0.6px] text-ink">
            {cession.denomination ?? "Entreprise non nommée"}
          </h1>
          <p className="mt-3 text-muted">
            {cession.ville ?? "Ville inconnue"}
            {cession.code_postal ? ` (${cession.code_postal})` : ""} — {cession.departement_nom ?? "—"},{" "}
            {cession.region_nom ?? "—"}
          </p>
        </div>

        <div className="rounded-[24px] bg-nested p-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Field label="SIREN">
              {cession.siren ? (
                <a
                  href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${cession.siren}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tabular text-accent hover:underline"
                >
                  {cession.siren}
                </a>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Effectifs">
              <span title={effectifsTooltip(cession.effectifs)}>{effectifsLabel(cession.effectifs)}</span>
            </Field>
            <Field label="Code NAF">{cession.naf_code ?? "—"}</Field>
            <Field label="Création entreprise">
              {cession.date_creation_entreprise ? formatDate(cession.date_creation_entreprise) : "—"}
            </Field>
            <Field label="Date de l'annonce">{formatDate(cession.date_parution)}</Field>
            <Field label="Tribunal">{cession.tribunal ?? "—"}</Field>
          </div>
          {cession.activite && (
            <div className="mt-6 border-t border-ink/10 pt-6">
              <Field label="Activité déclarée">{cession.activite}</Field>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-serif-display text-2xl text-ink">Score d&apos;opportunité</h2>
          {cession.score != null && cession.score_details ? (
            <div className="mt-6 rounded-[24px] bg-nested p-8">
              <p className="tabular font-serif-display text-5xl text-ink">{cession.score}</p>
              <p className="mt-1 text-sm text-muted">sur 100 — détail du calcul ci-dessous</p>
              <div className="mt-8">
                <ScoreBreakdown details={cession.score_details as never} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Cette annonce n&apos;a pas pu être enrichie ({cession.enrichment_error ?? "raison inconnue"}), elle
              n&apos;a donc pas de score.
            </p>
          )}
        </div>

        {cession.url_bodacc && (
          <a
            href={cession.url_bodacc}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-filters inline-block rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:opacity-85"
          >
            Voir l&apos;annonce source sur BODACC →
          </a>
        )}
      </main>
    </div>
  );
}
