"use client";

import { useActionState } from "react";

import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";

import { redeemInvitation, type JoinState } from "./actions";

export function JoinForm({
  token,
  needsName,
  requiresApproval,
}: {
  token: string;
  needsName: boolean;
  requiresApproval: boolean;
}) {
  const [state, action] = useActionState<JoinState, FormData>(
    redeemInvitation,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {needsName ? (
        <Field label="Your name" htmlFor="full_name">
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            required
            placeholder="Asha Menon"
          />
        </Field>
      ) : null}

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <SubmitButton className="w-full" pendingLabel="Joining…">
        {requiresApproval ? "Request to join" : "Join"}
      </SubmitButton>
    </form>
  );
}
