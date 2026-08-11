import { Screen, StagePlaceholder } from "@/components/app/screen";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata = { title: "Checker — Sugather" };

/**
 * Reachable only by members holding a Checker grant — the tab is hidden
 * otherwise. The route itself is not a secret: `check_in_ticket` re-checks the
 * grant in the database, which is where rule 4 is actually enforced.
 */
export default async function ScanPage() {
  const { membership } = await requireActiveMember("/app/scan");

  return (
    <Screen eyebrow={membership.org.name} title="Checker">
      <StagePlaceholder stage={5}>
        The event picker, the dark scan frame with its sweeping brass laser, and
        the result card resolving valid in moss or duplicate in clay arrive with
        ticketing.
      </StagePlaceholder>
    </Screen>
  );
}
