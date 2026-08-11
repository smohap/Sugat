"use client";

import type { ReactNode } from "react";

import { MEMBER_ROLES, ROLE_LABEL, type MemberRole } from "@/lib/auth/roles";

/**
 * Suspension and role demotion ask for confirmation; approval does not (§10.8).
 * The confirm lives on the form rather than in the action so the round trip
 * never starts.
 */
export function ConfirmForm({
  action,
  message,
  children,
}: {
  action: (formData: FormData) => void;
  message: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}

/** Changing the select submits — no separate save button per row. */
export function RoleSelect({
  action,
  membershipId,
  role,
  disabled,
}: {
  action: (formData: FormData) => void;
  membershipId: string;
  role: MemberRole;
  disabled?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="membership_id" value={membershipId} />
      <select
        name="role"
        defaultValue={role}
        disabled={disabled}
        aria-label="Role"
        onChange={(event) => {
          const next = event.target.value as MemberRole;
          const demotion = next !== "admin" && role === "admin";
          if (
            demotion &&
            !window.confirm(
              "Remove admin access from this member? They will lose the console.",
            )
          ) {
            event.target.value = role;
            return;
          }
          event.target.form?.requestSubmit();
        }}
        className="h-8 rounded-full border border-line bg-white px-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2 disabled:opacity-60"
      >
        {MEMBER_ROLES.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABEL[value]}
          </option>
        ))}
      </select>
    </form>
  );
}
