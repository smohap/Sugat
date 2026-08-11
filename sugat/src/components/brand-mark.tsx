/** A brass rounded square carrying a Fraunces "S" in ink (§4). */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center bg-brass text-ink font-display font-semibold leading-none"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.27),
        fontSize: Math.round(size * 0.62),
        paddingBottom: Math.round(size * 0.04),
      }}
    >
      S
    </span>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <BrandMark size={size} />
      <span className="font-display text-ink text-[19px] font-semibold tracking-tight">
        Sugather
      </span>
    </span>
  );
}
