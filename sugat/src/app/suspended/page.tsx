import { redirect } from "next/navigation";

import { Wordmark } from "@/components/brand-mark";
import { StatusPill } from "@/components/ui/pill";
import { requireViewer } from "@/lib/auth/session";

export const metadata = { title: "Membership suspended — Sugat" };

export default async function SuspendedPage() {
  const viewer = await requireViewer("/suspended");
  const membership = viewer.membership;

  if (!membership) redirect("/onboarding");
  if (membership.status === "active") redirect("/app");
  if (membership.status === "pending") redirect("/pending");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-[var(--gutter)] py-12">
      <div className="w-full max-w-[400px]">
        <Wordmark />

        <div className="mt-8 flex items-center gap-2">
          <StatusPill status="suspended" />
          <span className="mono-label">{membership.org.name}</span>
        </div>

        <h1 className="mt-4 text-[28px] leading-tight tracking-tight">
          Your membership is suspended
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-fog">
          An admin at {membership.org.name} has paused your access. They can
          restore it — get in touch with them directly.
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
