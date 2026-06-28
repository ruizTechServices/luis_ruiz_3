import { ContactForm } from "@/app/contact/contact-form";

export default function ContactPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-2xl content-start gap-6 px-6 py-16">
      <section className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-normal">Contact</h1>
        <p className="text-sm text-muted-foreground">
          Send a project note. Submissions are private and only visible to Gio.
        </p>
      </section>
      <ContactForm />
    </main>
  );
}
