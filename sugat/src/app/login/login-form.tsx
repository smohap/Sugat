"use client";

import { useActionState, useState } from "react";

import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  sendMagicLink,
  signInWithPassword,
  type AuthState,
} from "./actions";

const EMPTY: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"link" | "password">("link");

  const [linkState, linkAction] = useActionState(sendMagicLink, EMPTY);
  const [passwordState, passwordAction] = useActionState(
    signInWithPassword,
    EMPTY,
  );

  const state = mode === "link" ? linkState : passwordState;

  if (linkState.sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success">
          A sign-in link is on its way to <strong>{linkState.sentTo}</strong>.
          Open it on this device to continue.
        </Notice>
        <p className="text-[13px] text-fog">
          Nothing after a minute? Check spam, then try again — links expire an
          hour after they are sent.
        </p>
      </div>
    );
  }

  return (
    <form
      action={mode === "link" ? linkAction : passwordAction}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="next" value={next} />

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>

      {mode === "password" ? (
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
      ) : null}

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <SubmitButton
        className="w-full"
        pendingLabel={mode === "link" ? "Sending…" : "Signing in…"}
      >
        {mode === "link" ? "Email me a sign-in link" : "Sign in"}
      </SubmitButton>

      <button
        type="button"
        onClick={() => setMode(mode === "link" ? "password" : "link")}
        className="mono-label self-center py-1 transition-colors duration-[var(--dur-control)] ease-sugat hover:text-ink-2"
      >
        {mode === "link" ? "Use a password instead" : "Email me a link instead"}
      </button>
    </form>
  );
}
