"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { tabsFor } from "./tabs";

/**
 * Slides tab content in from the direction of travel.
 *
 * The animation restarts because `key` changes with the path, which remounts
 * the wrapper. Direction needs the previous tab index, which is the documented
 * "adjust state during render" pattern rather than a ref — reading a ref during
 * render is exactly the bug that pattern exists to avoid. React discards this
 * pass and immediately re-runs with the new values, so no effect and no paint
 * happens in between.
 *
 * Under `prefers-reduced-motion` the keyframes in globals.css are not defined
 * at all, so the class resolves to nothing and the content simply appears.
 */
export function TabView({
  isChecker,
  children,
}: {
  isChecker: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const tabs = tabsFor(isChecker);
  const index = tabs.findIndex(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
  );

  const [seen, setSeen] = useState(index);
  const [forward, setForward] = useState(true);

  if (seen !== index) {
    setForward(index >= seen);
    setSeen(index);
  }

  return (
    <div key={pathname} className={forward ? "tab-in-right" : "tab-in-left"}>
      {children}
    </div>
  );
}
