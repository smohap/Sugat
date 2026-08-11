import { signInWithProvider } from "@/app/login/actions";
import {
  OAUTH_LABEL,
  OAUTH_PROVIDERS,
  type OAuthProvider,
} from "@/lib/auth/providers";

/**
 * Third-party sign-in.
 *
 * Plain forms posting to a Server Action, with no client component in sight —
 * the redirect to the provider happens on the server, so these work before
 * hydration and without JavaScript. Brand marks are inlined as SVG: the strict
 * no-external-dependency rule applies to logos as much as to fonts.
 */
export function ProviderButtons({ next }: { next: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {OAUTH_PROVIDERS.map((provider) => (
        <form key={provider} action={signInWithProvider}>
          <input type="hidden" name="provider" value={provider} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-line bg-white px-5 text-[14.5px] font-medium text-ink transition-colors duration-[var(--dur-control)] ease-sugather hover:bg-cream-2"
          >
            <ProviderMark provider={provider} />
            Continue with {OAUTH_LABEL[provider]}
          </button>
        </form>
      ))}
    </div>
  );
}

function ProviderMark({ provider }: { provider: OAuthProvider }) {
  if (provider === "google") {
    return (
      <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden focusable="false">
        <path
          fill="#4285F4"
          d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
        />
        <path
          fill="#34A853"
          d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
        />
        <path
          fill="#FBBC05"
          d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
        />
        <path
          fill="#EA4335"
          d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
        />
      </svg>
    );
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z"
      />
    </svg>
  );
}
