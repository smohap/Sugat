import { redirect } from "next/navigation";

import { Wordmark } from "@/components/brand-mark";
import { StatusPill } from "@/components/ui/pill";
import { requireViewer } from "@/lib/auth/session";

export const metadata = { title: "Awaiting approval — Sugat" };

/**
 * The other side of the approval queue. A pending member can read their own
 * membership row and — via `has_org_membership` in 0005 — the organization they
 * are waiting on, and nothing else in it.
 */
export default async function PendingPage() {
  const viewer = await requireViewer("/pending");
  const membership = viewer.membership;

  if (!membership) redirect("/onboarding");
  if (membership.status === "active") redirect("/app");
  if (membership.status === "suspended") redirect("/suspended");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-[var(--gutter)] py-12">
      <div className="w-full max-w-[400px]">
        <Wordmark />

        <div className="mt-8 flex items-center gap-2">
          <StatusPill status="pending" />
          <span className="mono-label">{membership.org.name}</span>
        </div>

        <h1 className="mt-4 text-[28px] leading-tight tracking-tight">
          Waiting on an admin
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-fog">
          {membership.org.name} reviews new members before letting them in. You
          will get an email the moment someone clears the queue — nothing else to
          do here.
        </p>

        <form action="/auth/signout" method="post" className="mt-8">
          <button
            type="submit"
            className="mono-label py-2 transition-colors duration-[var(--dur-control)] ease-sugat hover:text-clay"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
