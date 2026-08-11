import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 " +
  "text-[14.5px] font-medium transition-colors duration-[var(--dur-control)] " +
  "ease-sugat disabled:opacity-50 disabled:pointer-events-none";

const VARIANT: Record<Variant, string> = {
  primary: "bg-ink text-cream hover:bg-ink-2",
  secondary: "bg-white text-ink border border-line hover:bg-cream-2",
  ghost: "text-ink-2 hover:bg-black/5",
  danger: "bg-clay text-white hover:bg-clay/90",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button {...props} className={`${BASE} ${VARIANT[variant]} ${className}`} />
  );
}

/** Same surface, for the cases where the control is a link. */
export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"a"> & { variant?: Variant }) {
  return <a {...props} className={`${BASE} ${VARIANT[variant]} ${className}`} />;
}
