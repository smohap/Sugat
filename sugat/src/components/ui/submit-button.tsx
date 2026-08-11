"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

import { Button } from "./button";

/**
 * A submit control that reads the enclosing form's pending state. Kept separate
 * from `Button` so the plain button stays usable from Server Components.
 */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" disabled={pending || props.disabled}>
      {pending ? (pendingLabel ?? "Working…") : children}
    </Button>
  );
}
