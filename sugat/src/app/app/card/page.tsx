import { Screen, StagePlaceholder } from "@/components/app/screen";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata = { title: "Membership card — Sugather" };

export default async function CardPage() {
  const { membership } = await requireActiveMember("/app/card");

  return (
    <Screen eyebrow={membership.org.name} title="Your card">
      <StagePlaceholder stage={7}>
        The ink gradient card with its diagonal brass weave, QR proof of
        membership, animated counters and badge chips arrives with payments and
        dues.
      </StagePlaceholder>
    </Screen>
  );
}
