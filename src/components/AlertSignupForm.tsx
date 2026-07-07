"use client";

import { useState } from "react";
import { EFFECTIFS_LABELS } from "@/lib/format";

type Status = "idle" | "loading" | "done" | "error";

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function AlertSignupForm({ regions, secteurs }: { regions: string[]; secteurs: string[] }) {
  const [email, setEmail] = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSecteurs, setSelectedSecteurs] = useState<string[]>([]);
  const [scoreMin, setScoreMin] = useState(40);
  const [effectifMin, setEffectifMin] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/alertes/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          criteria: { regions: selectedRegions, secteurs: selectedSecteurs, scoreMin, effectifMin: effectifMin || null },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus("error");
        setMessage(json.error ?? "Une erreur est survenue.");
        return;
      }
      setStatus("done");
      setMessage(
        json.emailSent
          ? "Vérifiez votre boîte mail pour confirmer votre inscription."
          : "Inscription enregistrée, mais l'email de confirmation n'a pas pu être envoyé pour le moment."
      );
    } catch {
      setStatus("error");
      setMessage("Une erreur réseau est survenue.");
    }
  }

  const pillClasses = (active: boolean) =>
    `transition-filters rounded-full border px-3 py-1 text-xs font-medium ${
      active ? "border-ink bg-ink text-white" : "border-ink/15 text-muted hover:border-ink hover:text-ink"
    }`;

  if (status === "done") {
    return (
      <div className="rounded-[24px] bg-nested p-6 text-center">
        <p className="text-sm text-ink">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[24px] bg-nested p-6">
      <h3 className="font-serif-display text-2xl text-ink">Recevoir les alertes</h3>
      <p className="mt-2 text-sm text-muted">
        Un email chaque lundi avec les cessions qui correspondent à vos critères. Désinscription en un clic.
      </p>

      <input
        type="email"
        required
        placeholder="vous@exemple.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="transition-filters mt-4 w-full rounded-full border border-ink/15 bg-canvas px-4 py-2 text-sm text-ink placeholder:text-tertiary focus:border-ink/40 focus:outline-none"
      />

      <div className="mt-4">
        <p className="text-xs font-medium text-tertiary">Régions (optionnel, toutes par défaut)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRegions((s) => toggle(s, r))}
              className={pillClasses(selectedRegions.includes(r))}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-tertiary">Secteurs (optionnel, tous par défaut)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {secteurs.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSecteurs((sel) => toggle(sel, s))}
              className={pillClasses(selectedSecteurs.includes(s))}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="text-xs text-muted">
          Score minimum
          <select
            value={scoreMin}
            onChange={(e) => setScoreMin(Number(e.target.value))}
            className="transition-filters ml-2 rounded-full border border-ink/15 bg-canvas px-3 py-1 text-xs text-ink"
          >
            <option value={0}>Tous</option>
            <option value={40}>≥ 40</option>
            <option value={70}>≥ 70</option>
          </select>
        </label>
        <label className="text-xs text-muted">
          Effectif minimum
          <select
            value={effectifMin}
            onChange={(e) => setEffectifMin(e.target.value)}
            className="transition-filters ml-2 rounded-full border border-ink/15 bg-canvas px-3 py-1 text-xs text-ink"
          >
            <option value="">Tous</option>
            {Object.entries(EFFECTIFS_LABELS)
              .filter(([code]) => Number(code) >= 11)
              .map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
          </select>
        </label>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-tertiary">
        En vous inscrivant, vous acceptez de recevoir un email hebdomadaire de Transmission Radar. Voir notre{" "}
        <a href="/confidentialite" className="underline hover:text-ink">
          politique de confidentialité
        </a>
        .
      </p>

      {message && status === "error" && <p className="mt-3 text-xs text-ink">{message}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="transition-filters mt-5 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white hover:opacity-85 disabled:opacity-50"
      >
        {status === "loading" ? "Inscription…" : "S'inscrire aux alertes"}
      </button>
    </form>
  );
}
