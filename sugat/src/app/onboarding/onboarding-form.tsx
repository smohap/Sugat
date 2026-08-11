"use client";

import { useActionState } from "react";

import { Field, Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { ORG_CATEGORIES } from "@/lib/org-categories";

import { createOrganization, type OnboardingState } from "./actions";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState<OnboardingState, FormData>(
    createOrganization,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Your name" htmlFor="full_name">
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaultName}
          autoComplete="name"
          required
          placeholder="Asha Menon"
        />
      </Field>

      <Field
        label="Organization name"
        htmlFor="name"
        hint="Members will see this everywhere. You can change it later."
      >
        <Input
          id="name"
          name="name"
          required
          placeholder="Riverdale Alumni"
        />
      </Field>

      <Field label="Category" htmlFor="category">
        <Select id="category" name="category" defaultValue="">
          <option value="">Choose one</option>
          {ORG_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Logo" htmlFor="logo" hint="Optional. PNG, JPEG, WebP or SVG, up to 2 MB.">
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="w-full text-[13.5px] text-fog file:mr-3 file:h-9 file:rounded-full file:border file:border-line file:bg-white file:px-4 file:text-[13px] file:text-ink"
        />
      </Field>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <SubmitButton className="mt-1 w-full" pendingLabel="Creating…">
        Create organization
      </SubmitButton>
    </form>
  );
}
