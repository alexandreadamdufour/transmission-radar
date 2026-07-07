"use client";

import { useState } from "react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="transition-filters rounded-full border border-ink px-5 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-white"
    >
      {copied ? "Lien copié ✓" : "Copier le lien"}
    </button>
  );
}
