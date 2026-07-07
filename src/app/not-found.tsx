import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-serif-display text-8xl text-ink/15">404</p>
      <h1 className="font-serif-display mt-4 text-3xl text-ink">Cette page a été cédée.</h1>
      <p className="mt-3 max-w-sm text-muted">
        Elle n&apos;existe pas, ou plus, sur Transmission Radar.
      </p>
      <Link
        href="/"
        className="transition-filters mt-8 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white hover:opacity-85"
      >
        ← Retour au dashboard
      </Link>
    </div>
  );
}
