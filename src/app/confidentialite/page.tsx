import Link from "next/link";

export const metadata = { title: "Confidentialité" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif-display text-2xl text-ink">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-canvas">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-6 py-8">
          <h1 className="font-serif-display text-[32px] tracking-[-0.4px] text-ink">Confidentialité</h1>
          <Link
            href="/"
            className="transition-filters shrink-0 rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] space-y-10 px-6 pb-24">
        <Section title="Ce que nous collectons">
          <p>
            Transmission Radar collecte uniquement les données publiques BODACC et SIRENE présentées sur le
            dashboard — voir la page <Link href="/methodologie" className="underline hover:text-ink">méthodologie</Link>.
          </p>
          <p>
            Si vous vous inscrivez aux alertes, nous collectons votre <strong className="text-ink">adresse email</strong> et
            les <strong className="text-ink">critères de filtrage</strong> que vous choisissez (régions, secteurs,
            score minimum, effectif minimum). Aucune autre donnée personnelle n&apos;est demandée.
          </p>
        </Section>

        <Section title="Finalité">
          <p>
            Votre email sert exclusivement à vous envoyer, au maximum une fois par semaine, un résumé des
            cessions correspondant à vos critères. Il n&apos;est ni revendu, ni partagé, ni utilisé à des fins
            publicitaires.
          </p>
        </Section>

        <Section title="Durée de conservation">
          <p>
            Votre inscription est conservée tant qu&apos;elle est active. En cas de désinscription, l&apos;email
            et les critères sont conservés 30 jours à des fins de preuve de consentement puis supprimés
            définitivement, sauf obligation légale contraire.
          </p>
        </Section>

        <Section title="Vos droits">
          <p>
            Vous pouvez vous désinscrire à tout moment via le lien présent dans chaque email. Pour toute demande
            de suppression immédiate ou d&apos;accès à vos données, contactez-nous à l&apos;adresse indiquée sur
            le dépôt GitHub du projet.
          </p>
        </Section>

        <Section title="Hébergement">
          <p>
            Les données sont hébergées par Supabase (base de données) et Vercel (application), conformément à
            leurs politiques de confidentialité respectives.
          </p>
        </Section>
      </main>
    </div>
  );
}
