import {
  CalendarCheck,
  MessagesSquare,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Hero } from "@/components/marketing/hero";
import { Attribution } from "@/components/attribution";
import { Wordmark } from "@/components/brand-mark";
import { ButtonLink } from "@/components/ui/button";

const PILLARS = [
  {
    icon: MessagesSquare,
    title: "One place to talk",
    body: "Announcements, threaded replies and reactions in a feed the whole membership can read — not five group chats and a mailing list nobody has updated since 2019.",
  },
  {
    icon: CalendarCheck,
    title: "Events that fill",
    body: "Create with a date, venue and capacity. Members RSVP or pay in the same tap. Reminders carry the ticket, so nobody arrives without one.",
  },
  {
    icon: QrCode,
    title: "A door that works",
    body: "Every ticket scans exactly once. A second scan is refused as a duplicate, and the headcount on the admin dashboard moves while you watch.",
  },
  {
    icon: ShieldCheck,
    title: "Volunteers, not admins",
    body: "Approve a member, hand someone the door for one event and nothing else, hide a comment, see the last ninety days of growth. From a phone, at the venue.",
  },
];

export default function Home() {
  return (
    <>
      <Hero />

      <section className="mx-auto w-full max-w-[900px] px-[var(--gutter)] py-16">
        <p className="mono-label">What it replaces</p>
        <h2 className="mt-2 max-w-[560px] text-[28px] leading-tight tracking-tight sm:text-[34px]">
          Everything a volunteer-run community stitches together, in one
          application
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5">
              <Icon size={22} strokeWidth={1.7} className="text-brass" aria-hidden />
              <h3 className="mt-3 text-[18px] leading-snug">{title}</h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-cream-2">
        <div className="mx-auto w-full max-w-[900px] px-[var(--gutter)] py-16 text-center">
          <h2 className="text-[26px] leading-tight tracking-tight sm:text-[32px]">
            Start your community
          </h2>
          <p className="mx-auto mt-2.5 max-w-[440px] text-[15px] leading-relaxed text-fog">
            Create an organization and you are its first admin. Invite members
            by link; they land in a queue you clear.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3">
            <ButtonLink href="/onboarding" className="w-full max-w-[260px]">
              Start a community
            </ButtonLink>
            <Link href="/login" className="mono-label py-1 hover:text-ink">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[900px] flex-col items-center gap-3 px-[var(--gutter)] py-10 sm:flex-row sm:justify-between">
          <Wordmark size={24} />
          <Attribution />
        </div>
      </footer>
    </>
  );
}
