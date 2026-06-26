import { AuthForm } from "@/components/auth/auth-form";
import { getSafeRedirectPath } from "@/lib/auth/routes";

interface LoginPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next ?? null);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="grid w-full max-w-sm gap-6">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-normal">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your Supabase account for this app.
          </p>
        </div>
        <AuthForm nextPath={nextPath} />
      </section>
    </main>
  );
}
