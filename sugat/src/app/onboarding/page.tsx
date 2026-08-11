import { redirect } from "next/navigation";

import { Attribution } from "@/components/attribution";
import { Wordmark } from "@/components/brand-mark";
import { requireViewer } from "@/lib/auth/session";

import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Create your organization — Sugather" };

export default async function OnboardingPage() {
  const viewer = await requireViewer("/onboarding");

  // Multi-org is out of scope for v1 (§14): one relationship per person, so a
  // member who already has one has nothing to do here.
  if (viewer.membership) redirect("/app");

  return (
    <main className="flex flex-1 flex-col items-center px-[var(--gutter)] py-12">
      <div className="w-full max-w-[420px]">
        <Wordmark />

        <h1 className="mt-8 text-[30px] leading-[1.15] tracking-tight">
          Set up your community
        </h1>
        <p className="mt-2 mb-7 text-[14.5px] leading-relaxed text-fog">
          You will be its first admin. Members join by invitation once this
          exists.
        </p>

        <OnboardingForm defaultName={viewer.profile.full_name} />

        <p className="mt-6 text-[13px] leading-relaxed text-fog">
          Meant to join an existing community instead? Ask an admin for an
          invitation link — it will add you directly.
        </p>

        <Attribution className="mt-10" />
      </div>
    </main>
  );
}
