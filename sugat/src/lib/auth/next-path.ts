/**
 * `?next=` comes from the URL, so it is attacker-controlled. Only same-origin
 * absolute paths are honoured — anything else, including protocol-relative
 * `//evil.example`, falls back to the app root.
 */
export function safeNextPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
