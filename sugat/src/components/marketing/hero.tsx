"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PhonePanel, type PanelId } from "./phone-panel";

/**
 * Structural port of `moton.txt` (D3), recoloured to the Sugather palette and
 * rendering real app surfaces instead of the source's external figurines (D4).
 *
 * The mechanics carry over exactly: four panels, an animation lock, roles
 * derived from the active index, and a simultaneous crossfade of background,
 * position, scale, blur and opacity over one duration and one easing.
 */
const PANELS: { id: PanelId; word: string; caption: string; bg: string }[] = [
  {
    id: "feed",
    word: "TALK",
    caption: "One feed instead of five group chats",
    bg: "var(--color-ink)",
  },
  {
    id: "events",
    word: "MEET",
    caption: "Events people actually turn up to",
    bg: "var(--color-brass)",
  },
  {
    id: "ticket",
    word: "ENTER",
    caption: "Tickets that scan once, at the door",
    bg: "var(--color-clay)",
  },
  {
    id: "card",
    word: "BELONG",
    caption: "Membership you can hold in your hand",
    bg: "var(--color-moss)",
  },
];

const STAGE_MS = 650;

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const navigate = useCallback(
    (direction: "next" | "prev") => {
      // The lock is the whole reason the crossfade never tears: a second press
      // mid-transition would restart it from a position nothing has reached.
      if (isAnimating) return;
      setIsAnimating(true);
      setActiveIndex((i) =>
        direction === "next" ? (i + 1) % 4 : (i + 3) % 4,
      );
      setTimeout(() => setIsAnimating(false), STAGE_MS);
    },
    [isAnimating],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") navigate("next");
      if (event.key === "ArrowLeft") navigate("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const active = PANELS[activeIndex];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What Sugather does"
      className={[
        "relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-6",
        "transition-colors duration-[var(--dur-stage)] ease-sugather motion-reduce:transition-none",
        /*
         * The viewport breakpoint is CSS, not JavaScript. Measuring
         * `innerWidth` in an effect means the server renders the desktop scale,
         * so a phone paints the large centre panel — over the caption — and
         * then animates down to the small one 650ms later, on every load. A
         * media query is correct on the first paint and needs no state.
         */
        "[--centre-scale:1.1] [--flank-l:20%] [--flank-r:80%]",
        "sm:[--centre-scale:1.35] sm:[--flank-l:30%] sm:[--flank-r:70%]",
      ].join(" ")}
      style={{ backgroundColor: active.bg }}
    >
      <GhostWord word={active.word} />

      {/*
        Tall enough to contain the centre panel at full scale. The panels are
        absolutely positioned and centred, so a stage shorter than the scaled
        panel does not clip it — it lets it spill over whatever sits below.
      */}
      <div className="relative h-[470px] w-full shrink-0 sm:h-[590px]">
        {PANELS.map((panel, index) => (
          <Panel
            key={panel.id}
            panel={panel}
            role={roleOf(index, activeIndex)}
          />
        ))}
      </div>

      {/*
        White on brass is about 2.5:1 — legible on the ink slide and washed out
        on the other three. The scrim gives every slide the same floor without
        giving up the four-colour rotation.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[300px] bg-gradient-to-t from-black/65 via-black/45 to-transparent"
      />

      <div className="relative z-30 mt-7 flex flex-col items-center gap-5 px-[var(--gutter)]">
        <p
          key={active.caption}
          className="max-w-[440px] text-center font-display text-[22px] leading-snug text-white sm:text-[28px]"
        >
          {active.caption}
        </p>

        <div className="flex items-center gap-4">
          <NavButton label="Previous" onClick={() => navigate("prev")}>
            <ArrowLeft size={26} strokeWidth={2.25} aria-hidden />
          </NavButton>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/85">
            {activeIndex + 1} / 4
          </span>
          <NavButton label="Next" onClick={() => navigate("next")}>
            <ArrowRight size={26} strokeWidth={2.25} aria-hidden />
          </NavButton>
        </div>
      </div>

      <Grain />
    </section>
  );
}

type Role = "center" | "left" | "right" | "back";

function roleOf(index: number, active: number): Role {
  if (index === active) return "center";
  if (index === (active + 3) % 4) return "left";
  if (index === (active + 1) % 4) return "right";
  return "back";
}

function Panel({
  panel,
  role,
}: {
  panel: (typeof PANELS)[number];
  role: Role;
}) {
  // Background colour, horizontal position, scale, blur and opacity all move
  // together over one duration — the crossfade is simultaneous, not staged.
  //
  // The source spec's centre scale is 1.68 desktop / 1.25 mobile. Against a
  // 420px panel that is a 706px centre, taller than any stage that still leaves
  // room for the caption beneath it — which is exactly how the caption ended up
  // printed across a phone screen. The values below are the largest that fit
  // the stage; the proportion between centre and flanks is what the port is
  // for. Both come from CSS variables the section sets per breakpoint.
  const geometry: Record<Role, { left: string; scale: string; blur: number; opacity: number; z: number }> = {
    center: {
      left: "50%",
      scale: "var(--centre-scale)",
      blur: 0,
      opacity: 1,
      z: 20,
    },
    left: {
      left: "var(--flank-l)",
      scale: "1",
      blur: 2,
      opacity: 0.85,
      z: 10,
    },
    right: {
      left: "var(--flank-r)",
      scale: "1",
      blur: 2,
      opacity: 0.85,
      z: 10,
    },
    back: { left: "50%", scale: "1", blur: 4, opacity: 0.85, z: 5 },
  };

  const { left, scale, blur, opacity, z } = geometry[role];

  return (
    <div
      aria-hidden={role !== "center"}
      className="absolute top-1/2 transition-all duration-[var(--dur-stage)] ease-sugather motion-reduce:transition-none"
      style={{
        left,
        zIndex: z,
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <PhonePanel id={panel.id} />
    </div>
  );
}

/** Giant word behind the panels, in Fraunces rather than the source's Anton. */
function GhostWord({ word }: { word: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none font-display font-semibold leading-none text-white/10"
      style={{ fontSize: "clamp(90px, 28vw, 380px)" }}
    >
      {word}
    </span>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/90 text-white transition-all duration-[var(--dur-control)] ease-sugather hover:scale-[1.08] hover:bg-white/12 motion-reduce:hover:scale-100"
    >
      {children}
    </button>
  );
}

/**
 * Film grain over everything. `fractalNoise` at baseFrequency 0.9 across four
 * octaves, tiled at 200px — carried straight from the source spec, because it
 * is what stops four flat colour fields from looking like flat colour fields.
 */
function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-40 opacity-40"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
        backgroundRepeat: "repeat",
      }}
    />
  );
}
