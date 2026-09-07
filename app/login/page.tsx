import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { getSafeRedirectPath } from "@/lib/auth/routes";
import { getOAuthFailureMessage } from "@/lib/auth/oauth-errors";

interface LoginPageProps {
  searchParams: Promise<{
    next?: string | string[];
    auth_error?: string | string[];
  }>;
}

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(typeof params.next === "string" ? params.next : null);
  const authFailureMessage = getOAuthFailureMessage(params.auth_error);

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="grid w-full max-w-sm gap-6">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your Supabase account for this app.
          </p>
        </div>
        {authFailureMessage ? (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm leading-6">
            {authFailureMessage}
          </p>
        ) : null}
        <AuthForm nextPath={nextPath} />
      </section>
    </main>
  );
}
