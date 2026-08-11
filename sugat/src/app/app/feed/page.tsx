import { Screen, StagePlaceholder } from "@/components/app/screen";
import { requireActiveMember } from "@/lib/auth/session";

export const metadata = { title: "Feed — Sugather" };

export default async function FeedPage() {
  const { membership } = await requireActiveMember("/app/feed");

  return (
    <Screen eyebrow={membership.org.name} title="Feed">
      <StagePlaceholder stage={4}>
        The story rail, feed cards with threaded comments and single-tap
        reactions, and the clay compose FAB arrive with the social stage. The
        shell around them — top bar, tabs, transitions — is what stage 3 built.
      </StagePlaceholder>
    </Screen>
  );
}
