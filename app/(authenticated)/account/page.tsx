import { SignOutForm } from "@/components/auth/sign-out-form";
import { requireUser } from "@/lib/auth/session";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-2xl gap-6 px-6 py-16">
      <section className="grid content-start gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">Account</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email ?? user.id}.
          </p>
        </div>
        <SignOutForm />
      </section>
    </main>
  );
}
