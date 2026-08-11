import Link from "next/link";

import { Attribution } from "@/components/attribution";
import { Wordmark } from "@/components/brand-mark";
import { ButtonLink } from "@/components/ui/button";

/**
 * Placeholder landing.
 *
 * The real hero is a structural port of `moton.txt` whose four rotating panels
 * are phone frames rendering the Feed, Events, Ticket and Card screens (D4) —
 * so it is built alongside stage 3, once those screens exist to render.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-[var(--gutter)] py-16">
      <div className="w-full max-w-[440px] text-center">
        <div className="flex justify-center">
          <Wordmark size={34} />
        </div>

        <h1 className="mt-8 text-[34px] leading-[1.12] tracking-tight">
          One app for your whole community
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-fog">
          Membership, feed, events, ticketing and dues — for the associations,
          chapters and clubs currently held together by group chats and
          spreadsheets.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <ButtonLink href="/login" className="w-full max-w-[260px]">
            Sign in
          </ButtonLink>
          <Link href="/onboarding" className="mono-label py-1 hover:text-ink">
            Start a community
          </Link>
        </div>

        <Attribution className="mt-12" />
      </div>
    </main>
  );
}
