import { Screen, StagePlaceholder } from "@/components/app/screen";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata = { title: "Vote — Sugather" };

export default async function VotePage() {
  const { membership } = await requireActiveMember("/app/vote");

  return (
    <Screen eyebrow={membership.org.name} title="Vote">
      <StagePlaceholder stage={5}>
        The open poll card — tappable options filling with a moss bar, one vote
        per verified member enforced by a unique constraint — and the read-only
        board election preview beneath it.
      </StagePlaceholder>
    </Screen>
  );
}
