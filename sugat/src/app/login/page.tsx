import Link from "next/link";

import { Attribution } from "@/components/attribution";
import { Wordmark } from "@/components/brand-mark";
import { Notice } from "@/components/ui/notice";
import { safeNextPath } from "@/lib/auth/next-path";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Sugather" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  // Set by /auth/callback when a link is expired, reused, or malformed.
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-[var(--gutter)] py-12">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="mb-8 inline-flex">
          <Wordmark />
        </Link>

        <h1 className="text-[30px] leading-[1.15] tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 mb-7 text-[14.5px] leading-relaxed text-fog">
          Sign in to your community. If you were sent an invitation, open that
          link first — it will bring you back here.
        </p>

        {error ? (
          <div className="mb-4">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : null}

        <LoginForm next={next} />

        <Attribution className="mt-12" />
      </div>
    </main>
  );
}
