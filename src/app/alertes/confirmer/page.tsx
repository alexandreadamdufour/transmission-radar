import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAlertToken } from "@/lib/alerts-token";

export const metadata = { title: "Confirmation d'alerte" };

async function confirm(token: string | undefined): Promise<"ok" | "invalid" | "missing"> {
  if (!token) return "missing";
  const id = verifyAlertToken(token, "confirm");
  if (!id) return "invalid";

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("alert_subscriptions")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", id)
    .is("unsubscribed_at", null);

  return error ? "invalid" : "ok";
}

export default async function ConfirmerAlerte({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const status = await confirm(token);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      {status === "ok" ? (
        <>
          <p className="font-serif-display text-6xl text-accent">✓</p>
          <h1 className="font-serif-display mt-4 text-3xl text-ink">Inscription confirmée</h1>
          <p className="mt-3 max-w-sm text-muted">
            Vous recevrez un email chaque lundi si des cessions correspondent à vos critères.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-serif-display mt-4 text-3xl text-ink">Lien invalide ou expiré</h1>
          <p className="mt-3 max-w-sm text-muted">Réessayez de vous inscrire depuis la page d&apos;accueil.</p>
        </>
      )}
      <Link
        href="/"
        className="transition-filters mt-8 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white hover:opacity-85"
      >
        ← Retour au dashboard
      </Link>
    </div>
  );
}
