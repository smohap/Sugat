"use client";

import { useState } from "react";

/** The link is the product here, so copying it is the primary row action. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard blocked (insecure origin, denied permission). The link is
          // rendered in full beside this control, so it stays selectable.
        }
      }}
      className="rounded-full border border-line bg-white px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-2 transition-colors duration-[var(--dur-control)] ease-sugat hover:border-brass hover:text-brass"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
