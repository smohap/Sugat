import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { LoginForm } from "@/app/login/login-form";
import { Attribution } from "@/components/attribution";
import { BrandMark, Wordmark } from "@/components/brand-mark";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ROLE_LABEL, isMemberRole } from "@/lib/auth/roles";
import { getViewer } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import { JoinForm } from "./join-form";

export const metadata = { title: "Join — Sugather" };

type Preview =
  | { valid: false; reason: "not_found" | "revoked" | "expired" }
  | {
      valid: true;
      org_name: string;
      org_logo: string | null;
      category: string | null;
      role: string;
      policy: "open_link" | "approval_required";
    };

const INVALID_COPY: Record<string, string> = {
  not_found: "This invitation link is not valid. Ask an admin for a new one.",
  revoked: "This invitation has been revoked. Ask an admin for a new one.",
  expired: "This invitation has expired. Ask an admin for a new one.",
};

export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;

  // preview_invitation() is granted to anon: this screen renders before the
  // visitor has signed in, and it returns only what the screen needs — never
  // the invitation row itself (0004_onboarding.sql).
  const supabase = await createClient();
  const { data } = await supabase.rpc("preview_invitation", { p_token: token });
  const preview = data as Preview | null;

  if (!preview?.valid) {
    return (
      <Shell>
        <h1 className="text-[26px] leading-tight tracking-tight">
          Invitation unavailable
        </h1>
        <div className="mt-5">
          <Notice tone="error">
            {INVALID_COPY[preview?.reason ?? "not_found"]}
          </Notice>
        </div>
      </Shell>
    );
  }

  const viewer = await getViewer();
  const role = isMemberRole(preview.role) ? ROLE_LABEL[preview.role] : "Member";
  const requiresApproval = preview.policy === "approval_required";

  return (
    <Shell>
      <div className="card flex items-center gap-3.5 p-4">
        {preview.org_logo ? (
          <Image
            src={preview.org_logo}
            alt=""
            width={44}
            height={44}
            unoptimized
            className="h-11 w-11 rounded-[12px] border border-line object-cover"
          />
        ) : (
          <BrandMark size={44} />
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-[18px] font-semibold text-ink">
            {preview.org_name}
          </p>
          <p className="mono-label mt-0.5">
            {preview.category ? `${preview.category} · ` : ""}
            {role}
          </p>
        </div>
      </div>

      {viewer?.membership ? (
        <div className="mt-7 flex flex-col gap-4">
          <Notice>
            You already belong to{" "}
            <strong>{viewer.membership.org.name}</strong>. Being part of several
            communities at once is coming in a later release.
          </Notice>
          <ButtonLink href="/app" variant="secondary">
            Back to {viewer.membership.org.name}
          </ButtonLink>
        </div>
      ) : (
        <>
          <h1 className="mt-7 text-[26px] leading-tight tracking-tight">
            You have been invited
          </h1>
          <p className="mt-2 mb-6 text-[14.5px] leading-relaxed text-fog">
            {requiresApproval
              ? "An admin reviews new members before they get access. You will be let in as soon as they clear the queue."
              : "Accept and you are in straight away."}
          </p>

          {viewer ? (
            <JoinForm
              token={token}
              needsName={!viewer.profile.full_name}
              requiresApproval={requiresApproval}
            />
          ) : (
            <>
              <p className="mono-label mb-3">First, confirm your email</p>
              <LoginForm next={`/join/${token}`} />
            </>
          )}
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center px-[var(--gutter)] py-12">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="inline-flex">
          <Wordmark />
        </Link>
        <div className="mt-8">{children}</div>
        <Attribution className="mt-12" />
      </div>
    </main>
  );
}
