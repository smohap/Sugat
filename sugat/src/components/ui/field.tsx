import type { ComponentProps, ReactNode } from "react";

const CONTROL =
  "w-full h-11 rounded-xl bg-white border border-line px-3.5 text-[15px] " +
  "text-ink placeholder:text-fog outline-none transition-colors " +
  "duration-[var(--dur-control)] ease-sugat focus:border-brass";

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mono-label mb-1.5 block">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[12.5px] text-fog">{hint}</span> : null}
    </label>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input {...props} className={`${CONTROL} ${className}`} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select {...props} className={`${CONTROL} ${className}`} />;
}

export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={`${CONTROL} h-auto min-h-24 py-2.5 ${className}`}
    />
  );
}
