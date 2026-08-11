"use client";

import {
  CalendarDays,
  IdCard,
  Newspaper,
  ScanLine,
  Vote,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { tabsFor, type AppTab } from "./tabs";

const ICON: Record<AppTab["icon"], LucideIcon> = {
  feed: Newspaper,
  events: CalendarDays,
  vote: Vote,
  card: IdCard,
  scan: ScanLine,
};

/**
 * Fixed bottom nav with a 2.5px brass indicator that slides between tabs (§5).
 *
 * The indicator is one element positioned by transform rather than a border on
 * the active item, so the movement between tabs is continuous — a per-item
 * border would blink from one place to another.
 */
export function BottomNav({ isChecker }: { isChecker: boolean }) {
  const pathname = usePathname();
  const tabs = tabsFor(isChecker);

  const active = tabs.findIndex(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
  );

  return (
    <nav
      aria-label="Sections"
      className="sticky bottom-0 z-30 border-t border-line bg-cream/92 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative mx-auto flex max-w-[560px]">
        {/*
          Hidden from assistive tech: `aria-current` on the active link already
          says which tab you are on, and this is the same fact drawn twice.
        */}
        <span
          aria-hidden
          className="absolute top-0 h-[2.5px] rounded-full bg-brass transition-transform duration-[var(--dur-stage)] ease-sugather motion-reduce:transition-none"
          style={{
            width: `${100 / tabs.length}%`,
            transform: `translateX(${Math.max(active, 0) * 100}%)`,
            opacity: active < 0 ? 0 : 1,
          }}
        />

        {tabs.map((tab) => {
          const Icon = ICON[tab.icon];
          const on =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={on ? "page" : undefined}
              className={[
                "flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2",
                "transition-colors duration-[var(--dur-control)] ease-sugather",
                on ? "text-ink" : "text-fog hover:text-ink-2",
              ].join(" ")}
            >
              <Icon size={21} strokeWidth={on ? 2.1 : 1.7} aria-hidden />
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
