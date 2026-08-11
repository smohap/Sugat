import type { ReactNode } from "react";

/**
 * The scaffold every member screen sits in: 18px gutters, a single column
 * capped so the layout widens rather than stretches on desktop, and the same
 * header shape throughout (§4).
 */
export function Screen({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-[var(--gutter)] py-5">
      {title ? (
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            {eyebrow ? <p className="mono-label">{eyebrow}</p> : null}
            <h1 className="mt-1 text-[25px] leading-tight tracking-tight">
              {title}
            </h1>
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </div>
  );
}

/**
 * What a tab shows before its stage lands. Says which stage rather than
 * pretending to be empty, so a half-built app reads as unfinished rather than
 * broken.
 */
export function StagePlaceholder({
  stage,
  children,
}: {
  stage: number;
  children: ReactNode;
}) {
  return (
    <div className="card p-5">
      <p className="mono-label text-brass">Stage {stage}</p>
      <p className="mt-2 text-[14.5px] leading-relaxed">{children}</p>
    </div>
  );
}
