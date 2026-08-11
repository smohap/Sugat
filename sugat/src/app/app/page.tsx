import Link from "next/link";

import { Wordmark } from "@/components/brand-mark";
import { ButtonLink } from "@/components/ui/button";
import { RolePill } from "@/components/ui/pill";
import { consoleHomeFor } from "@/lib/auth/roles";
import { requireActiveMember } from "@/lib/auth/session";

/**
 * Stage 2 waypoint.
 *
 * Everything signing-in converges here, and `requireActiveMember` does the real
 * work — sending members with no organization to onboarding, and members the
 * admin has not cleared yet to the waiting screen. The member app itself (feed,
 * events, vote, card, scan) is built on top of the shell in stage 3, which
 * replaces this page.
 */
export default async function AppHome() {
  const { profile, membership } = await requireActiveMember("/app");
  const consoleHome = consoleHomeFor(membership.role);

  return (
    <main className="flex flex-1 flex-col items-center px-[var(--gutter)] py-12">
      <div className="w-full max-w-[420px]">
        <Wordmark />

        <h1 className="mt-8 text-[28px] leading-tight tracking-tight">
          {membership.org.name}
        </h1>
        <p className="mt-2 text-[14.5px] text-fog">
          Signed in as {profile.full_name || profile.email}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <RolePill role={membership.role} />
          {membership.member_no ? (
            <span className="mono-label">No. {membership.member_no}</span>
          ) : null}
        </div>

        <div className="card mt-8 p-4">
          <p className="mono-label">Next</p>
          <p className="mt-2 text-[14.5px] leading-relaxed">
            The member app — feed, events, vote, card and checker — arrives with
            the app shell in stage 3.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {consoleHome ? (
            <ButtonLink href={consoleHome}>Open the admin console</ButtonLink>
          ) : null}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="mono-label py-2 transition-colors duration-[var(--dur-control)] ease-sugat hover:text-clay"
            >
              Sign out
            </button>
          </form>
        </div>

        <p className="mt-8 text-[13px] text-fog">
          <Link href="/" className="underline underline-offset-2">
            Back to the landing page
          </Link>
        </p>
      </div>
    </main>
  );
}
