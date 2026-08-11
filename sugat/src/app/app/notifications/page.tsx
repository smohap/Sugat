import { Screen, StagePlaceholder } from "@/components/app/screen";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata = { title: "Notifications — Sugather" };

export default async function NotificationsPage() {
  const { membership } = await requireActiveMember("/app/notifications");

  return (
    <Screen eyebrow={membership.org.name} title="Notifications">
      <StagePlaceholder stage={4}>
        Mentions, replies and announcements land here, with Web Push where the
        browser permits.
      </StagePlaceholder>
    </Screen>
  );
}
