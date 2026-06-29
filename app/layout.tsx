import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { SiteNavbar } from "@/components/navigation/site-navbar";
import { SiteFooter } from "@/components/navigation/site-footer";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Luis Ruiz | Developer, AI Builder & Founder",
    template: "%s | Luis Ruiz",
  },
  description:
    "Portfolio of Luis Ruiz, a New York-based developer and founder of ruizTechServices LLC, focused on full-stack web development, AI systems, automation, and practical software for small businesses.",
  keywords: [
    "Luis Ruiz",
    "Luis Giovanni Ruiz",
    "developer portfolio",
    "full-stack web developer",
    "AI builder",
    "AI architect",
    "ruizTechServices LLC",
    "Next.js",
    "Supabase",
    "automation",
    "New York software developer",
  ],
  authors: [{ name: "Luis Ruiz" }],
  creator: "Luis Ruiz",
  publisher: "ruizTechServices LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", dmSans.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SiteNavbar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
