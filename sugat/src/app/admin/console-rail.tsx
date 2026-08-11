"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { ROLE_LABEL, type MemberRole } from "@/lib/auth/roles";

/**
 * Desktop-primary, but it collapses to a scrolling strip rather than
 * disappearing: volunteer admins approve members from their pockets (§10.8).
 */
export function ConsoleRail({
  orgName,
  adminName,
  role,
  sections,
  pendingCount,
}: {
  orgName: string;
  adminName: string;
  role: MemberRole;
  sections: { href: string; label: string }[];
  pendingCount: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="bg-ink text-cream md:w-[260px] md:shrink-0">
      <div className="flex items-center gap-3 px-5 py-5">
        <BrandMark size={30} />
        <div className="min-w-0">
          <p className="truncate font-display text-[16.5px] font-semibold text-cream">
            {orgName}
          </p>
          <p className="mono-label mt-0.5 truncate text-white/45">
            {adminName} · {ROLE_LABEL[role]}
          </p>
        </div>
      </div>

      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-0 md:px-0 md:pb-6">
        {sections.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px]",
                  "transition-colors duration-[var(--dur-control)] ease-sugat",
                  "md:rounded-none md:border-l-2 md:px-5 md:py-2.5",
                  active
                    ? "bg-brass/15 text-cream md:border-brass"
                    : "text-white/60 hover:text-cream md:border-transparent",
                ].join(" ")}
              >
                {label}
                {href === "/admin/members" && pendingCount > 0 ? (
                  <span className="rounded-full bg-brass px-1.5 py-0.5 font-mono text-[10px] leading-none text-ink">
                    {pendingCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
