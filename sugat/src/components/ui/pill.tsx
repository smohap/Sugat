import {
  ROLE_LABEL,
  STATUS_LABEL,
  type MemberRole,
  type MemberStatus,
} from "@/lib/auth/roles";

const STATUS_TONE: Record<MemberStatus, string> = {
  active: "bg-moss/12 text-moss border-moss/25",
  pending: "bg-brass/12 text-brass border-brass/30",
  suspended: "bg-clay/10 text-clay border-clay/25",
};

const BASE =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono " +
  "text-[10.5px] uppercase tracking-[0.12em]";

export function StatusPill({ status }: { status: MemberStatus }) {
  return (
    <span className={`${BASE} ${STATUS_TONE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function RolePill({ role }: { role: MemberRole }) {
  return (
    <span className={`${BASE} border-line bg-cream-2 text-ink-2`}>
      {ROLE_LABEL[role]}
    </span>
  );
}
