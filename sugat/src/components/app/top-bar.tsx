import { Bell } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

/**
 * Brass mark, wordmark, and a notification bell carrying an unread dot (§10.2).
 * Sticky rather than fixed, so it participates in the scroll container instead
 * of needing the page to reserve space for it.
 */
export function TopBar({ unread }: { unread: number }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-[560px] items-center justify-between px-[var(--gutter)] py-3">
        <Link href="/app/feed" className="inline-flex items-center gap-2">
          <BrandMark size={26} />
          <span className="font-display text-[18px] font-semibold tracking-tight text-ink">
            Sugather
          </span>
        </Link>

        <Link
          href="/app/notifications"
          className="relative -mr-1 p-1.5 text-ink-2 transition-colors duration-[var(--dur-control)] ease-sugather hover:text-ink"
          aria-label={
            unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
          }
        >
          <Bell size={21} strokeWidth={1.8} aria-hidden />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clay ring-2 ring-cream"
            />
          ) : null}
        </Link>
      </div>
    </header>
  );
}
