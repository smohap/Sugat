import { BottomNav } from "@/components/app/bottom-nav";
import { TabView } from "@/components/app/tab-view";
import { TopBar } from "@/components/app/top-bar";
import { requireActiveMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * The member app shell (§10.2, §9).
 *
 * Guarded once, here, rather than in each tab: `requireActiveMember` sends a
 * member with no organization to onboarding and one still in the approval queue
 * to the waiting screen, so no tab below ever renders for someone who should
 * not be in the app at all.
 */
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { userId } = await requireActiveMember("/app");
  const supabase = await createClient();

  const [{ count: unread }, { count: checkerGrants }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    // Rule 4: the Scan tab is a per-event grant, never a role. Stage 5 narrows
    // this to events that are actually live; any grant reveals the tab for now.
    supabase
      .from("event_checkers")
      .select("event_id", { count: "exact", head: true })
      .eq("profile_id", userId),
  ]);

  const isChecker = (checkerGrants ?? 0) > 0;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopBar unread={unread ?? 0} />

      <main className="flex-1">
        <TabView isChecker={isChecker}>{children}</TabView>
      </main>

      <BottomNav isChecker={isChecker} />
    </div>
  );
}
