"use client";

import { useActionState, useState, type ReactNode } from "react";

import { ProviderButtons } from "@/components/auth/provider-buttons";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  sendMagicLink,
  signInWithPassword,
  signUpWithPassword,
  type AuthState,
} from "./actions";

const EMPTY: AuthState = {};

type Mode = "link" | "password" | "signup";

const SUBMIT_LABEL: Record<Mode, string> = {
  link: "Email me a sign-in link",
  password: "Sign in",
  signup: "Create account",
};

const PENDING_LABEL: Record<Mode, string> = {
  link: "Sending…",
  password: "Signing in…",
  signup: "Creating…",
};

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("link");

  // One useActionState per action rather than one shared: each keeps its own
  // error, so switching modes does not carry a stale message across.
  const [linkState, linkAction] = useActionState(sendMagicLink, EMPTY);
  const [passwordState, passwordAction] = useActionState(
    signInWithPassword,
    EMPTY,
  );
  const [signupState, signupAction] = useActionState(
    signUpWithPassword,
    EMPTY,
  );

  const state =
    mode === "link" ? linkState : mode === "password" ? passwordState : signupState;
  const action =
    mode === "link"
      ? linkAction
      : mode === "password"
        ? passwordAction
        : signupAction;

  if (linkState.sentTo) {
    return (
      <Sent title={`A sign-in link is on its way to ${linkState.sentTo}.`}>
        Open it on this device to continue. Nothing after a minute? Check spam —
        links expire an hour after they are sent.
      </Sent>
    );
  }

  if (signupState.confirmSent) {
    return (
      <Sent title={`Confirm ${signupState.confirmSent} to finish.`}>
        We have sent a link to that address. Open it and you will be signed in.
        If you already had an account there, the link signs you into it instead.
      </Sent>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ProviderButtons next={next} />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="mono-label">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />

        {mode === "signup" ? (
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

        {mode === "link" ? null : (
          <Field
            label="Password"
            htmlFor="password"
            hint={mode === "signup" ? "At least 8 characters." : undefined}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              minLength={mode === "signup" ? 8 : undefined}
              required
            />
          </Field>
        )}

        {state.error ? <Notice tone="error">{state.error}</Notice> : null}

        <SubmitButton className="w-full" pendingLabel={PENDING_LABEL[mode]}>
          {SUBMIT_LABEL[mode]}
        </SubmitButton>
      </form>

      <div className="flex flex-col items-center gap-1.5">
        {mode === "link" ? (
          <ModeLink onClick={() => setMode("password")}>
            Use a password instead
          </ModeLink>
        ) : (
          <ModeLink onClick={() => setMode("link")}>
            Email me a link instead
          </ModeLink>
        )}

        {mode === "signup" ? (
          <ModeLink onClick={() => setMode("password")}>
            Already have an account? Sign in
          </ModeLink>
        ) : (
          <ModeLink onClick={() => setMode("signup")}>
            New here? Create an account
          </ModeLink>
        )}
      </div>
    </div>
  );
}

function ModeLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono-label py-1 transition-colors duration-[var(--dur-control)] ease-sugather hover:text-ink-2"
    >
      {children}
    </button>
  );
}

function Sent({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Notice tone="success">{title}</Notice>
      <p className="text-[13px] leading-relaxed text-fog">{children}</p>
    </div>
  );
}
