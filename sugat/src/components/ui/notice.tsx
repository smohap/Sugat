import type { ReactNode } from "react";

type Tone = "info" | "error" | "success";

const TONE: Record<Tone, string> = {
  info: "bg-cream-2 text-ink-2 border-line",
  error: "bg-clay/8 text-clay border-clay/25",
  success: "bg-moss/10 text-moss border-moss/25",
};

export function Notice({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3.5 py-2.5 text-[13.5px] leading-snug ${TONE[tone]}`}
    >
      {children}
    </p>
  );
}
