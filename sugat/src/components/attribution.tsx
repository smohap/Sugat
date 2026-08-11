/**
 * The venture byline. Sugather is a product of AIDO Technologies Ltd, and the
 * screens a visitor sees before they are a member of anything — landing, sign
 * in, invitation, onboarding — are where that has to be legible.
 */
export const COMPANY = "AIDO Technologies Ltd";

export function Attribution({ className = "" }: { className?: string }) {
  return (
    <p className={`mono-label ${className}`}>A venture of {COMPANY}</p>
  );
}
