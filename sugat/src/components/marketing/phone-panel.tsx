import {
  CalendarDays,
  Heart,
  IdCard,
  MessageCircle,
  Newspaper,
  QrCode,
  Vote,
} from "lucide-react";

export type PanelId = "feed" | "events" | "ticket" | "card";

/**
 * The carousel panels are phone frames rendering real app surfaces rather than
 * the source spec's external figurines (D4): on-brand, dependency-free, and the
 * product shot comes for free.
 *
 * These are deliberately static compositions, not the live screens. The live
 * ones arrive in stages 4 to 7 and carry data, state and RLS with them; a
 * marketing hero should not be the thing that decides how a feed card looks.
 */
export function PhonePanel({ id }: { id: PanelId }) {
  return (
    <div className="h-[420px] w-[206px] rounded-[30px] border border-white/15 bg-cream p-2 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)]">
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[24px] bg-cream">
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
          <span className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-brass font-display text-[10px] font-semibold leading-none text-ink">
              S
            </span>
            <span className="font-display text-[10.5px] font-semibold text-ink">
              Sugather
            </span>
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-clay" />
        </div>

        <div className="flex-1 overflow-hidden px-3 py-3">
          <Body id={id} />
        </div>

        <div className="flex items-center justify-around border-t border-line px-2 pb-2.5 pt-2">
          {[Newspaper, CalendarDays, Vote, IdCard].map((Icon, index) => (
            <Icon
              key={index}
              size={13}
              strokeWidth={1.8}
              className={index === TAB_FOR[id] ? "text-ink" : "text-fog"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const TAB_FOR: Record<PanelId, number> = {
  feed: 0,
  events: 1,
  ticket: 1,
  card: 3,
};

function Body({ id }: { id: PanelId }) {
  if (id === "feed") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-1.5">
          {["bg-brass", "bg-clay", "bg-moss", "bg-fog"].map((tone) => (
            <span
              key={tone}
              className={`h-7 w-7 rounded-full ${tone} opacity-80 ring-2 ring-cream`}
            />
          ))}
        </div>
        {[0, 1].map((card) => (
          <div key={card} className="card p-2.5">
            <p className="font-mono text-[7px] uppercase tracking-[0.12em] text-fog">
              {card === 0 ? "Announcement · 2h" : "Priya Raman · 5h"}
            </p>
            <p className="mt-1 text-[9.5px] leading-snug text-ink-2">
              {card === 0
                ? "Gala tickets are live. Doors at seven, dinner at eight."
                : "Twelve of us for the river clean-up on Saturday."}
            </p>
            <div className="mt-2 flex items-center gap-2.5 text-fog">
              <Heart size={9} />
              <MessageCircle size={9} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "events") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="relative h-24 overflow-hidden rounded-[10px] bg-ink p-2.5">
          <span className="rounded-full bg-brass px-1.5 py-0.5 font-mono text-[6.5px] uppercase tracking-[0.12em] text-ink">
            Featured
          </span>
          <p className="absolute bottom-2.5 left-2.5 font-display text-[13px] font-semibold leading-tight text-cream">
            Founders&apos; Day Gala
          </p>
        </div>
        {["14 JUN", "02 JUL"].map((date, index) => (
          <div key={date} className="card flex items-center gap-2 p-2">
            <span className="rounded-[6px] bg-cream-2 px-1.5 py-1 text-center font-mono text-[7px] leading-tight text-ink-2">
              {date.split(" ")[0]}
              <br />
              {date.split(" ")[1]}
            </span>
            <span className="flex-1 text-[9px] text-ink-2">
              {index === 0 ? "Chapter mixer" : "Careers panel"}
            </span>
            <span className="rounded-full bg-moss px-2 py-0.5 font-mono text-[6.5px] uppercase tracking-[0.1em] text-white">
              Going
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (id === "ticket") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[12px] bg-ink px-3 py-4">
        <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-brass">
          Admit one
        </p>
        <div className="rounded-[8px] bg-cream p-2">
          <QrCode size={62} strokeWidth={1.4} className="text-ink" />
        </div>
        <p className="text-center font-display text-[11px] font-semibold leading-tight text-cream">
          Founders&apos; Day Gala
        </p>
        <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-white/50">
          Amara Osei · No. 0142
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-[12px] bg-ink p-3">
      <div className="flex items-center justify-between">
        <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-brass font-display text-[11px] font-semibold leading-none text-ink">
          S
        </span>
        <span className="rounded-full bg-moss/25 px-1.5 py-0.5 font-mono text-[6.5px] uppercase tracking-[0.1em] text-moss">
          Active
        </span>
      </div>
      <div>
        <p className="font-display text-[14px] font-semibold leading-tight text-cream">
          Amara Osei
        </p>
        <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-white/45">
          Member since 2019 · No. 0142
        </p>
      </div>
      <div className="flex gap-3">
        {[
          ["12", "Events"],
          ["4", "Badges"],
          ["86", "Links"],
        ].map(([value, label]) => (
          <span key={label}>
            <span className="block font-display text-[13px] font-semibold text-brass">
              {value}
            </span>
            <span className="font-mono text-[6.5px] uppercase tracking-[0.1em] text-white/45">
              {label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
