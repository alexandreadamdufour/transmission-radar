import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAlertToken } from "@/lib/alerts-token";

export const metadata = { title: "Désinscription" };

async function unsubscribe(token: string | undefined): Promise<"ok" | "invalid" | "missing"> {
  if (!token) return "missing";
  const id = verifyAlertToken(token, "unsubscribe");
  if (!id) return "invalid";

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("alert_subscriptions")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id);

  return error ? "invalid" : "ok";
}

export default async function Desinscription({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const status = await unsubscribe(token);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      {status === "ok" ? (
        <>
          <h1 className="font-serif-display mt-4 text-3xl text-ink">Vous êtes désinscrit</h1>
          <p className="mt-3 max-w-sm text-muted">Vous ne recevrez plus d&apos;alertes de Transmission Radar.</p>
        </>
      ) : (
        <>
          <h1 className="font-serif-display mt-4 text-3xl text-ink">Lien invalide</h1>
          <p className="mt-3 max-w-sm text-muted">Ce lien de désinscription n&apos;est plus valide.</p>
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
