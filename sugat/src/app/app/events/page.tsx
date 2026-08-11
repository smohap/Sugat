import { Screen, StagePlaceholder } from "@/components/app/screen";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata = { title: "Events — Sugather" };

export default async function EventsPage() {
  const { membership } = await requireActiveMember("/app/events");

  return (
    <Screen eyebrow={membership.org.name} title="Events">
      <StagePlaceholder stage={5}>
        The featured event hero, the date-chip event rows and the RSVP pill land
        with events and ticketing — along with the QR ticket in your wallet and
        the door scanner behind it.
      </StagePlaceholder>
    </Screen>
  );
}
