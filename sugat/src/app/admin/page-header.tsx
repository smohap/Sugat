import type { ReactNode } from "react";

/**
 * Every console page opens the same way: mono uppercase eyebrow, Fraunces page
 * title, right-aligned primary action (§10.8).
 */
export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mono-label">{eyebrow}</p>
        <h1 className="mt-1.5 text-[27px] leading-tight tracking-tight">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}
