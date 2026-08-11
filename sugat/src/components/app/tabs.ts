/**
 * The five member tabs, in bottom-nav order (§9).
 *
 * `Scan` is conditional: it appears only for members holding a Checker grant,
 * which is a per-event permission rather than a role (rule 4). The layout
 * resolves that and hands the result down, so the nav itself stays dumb.
 */
export const APP_TABS = [
  { href: "/app/feed", label: "Feed", icon: "feed" },
  { href: "/app/events", label: "Events", icon: "events" },
  { href: "/app/vote", label: "Vote", icon: "vote" },
  { href: "/app/card", label: "Card", icon: "card" },
  { href: "/app/scan", label: "Scan", icon: "scan", checkerOnly: true },
] as const;

export type AppTab = (typeof APP_TABS)[number];

export function tabsFor(isChecker: boolean): AppTab[] {
  return APP_TABS.filter((tab) => isChecker || !("checkerOnly" in tab));
}
