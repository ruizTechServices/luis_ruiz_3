export interface NavLink {
  label: string;
  href: string;
  ariaLabel: string;
  visibility: "always" | "anonymous" | "authenticated" | "admin";
}

export const navLinks = [
  {
    label: "Home",
    href: "/",
    ariaLabel: "Go to home page",
    visibility: "always",
  },
  {
    label: "Blog",
    href: "/blog",
    ariaLabel: "Go to blog page",
    visibility: "always",
  },
  {
    label: "Projects",
    href: "/projects",
    ariaLabel: "Go to projects page",
    visibility: "always",
  },
  {
    label: "Contact",
    href: "/contact",
    ariaLabel: "Go to contact page",
    visibility: "always",
  },
  {
    label: "Account",
    href: "/account",
    ariaLabel: "Go to protected account page",
    visibility: "authenticated",
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    ariaLabel: "Go to protected dashboard page",
    visibility: "authenticated",
  },
  {
    label: "Admin",
    href: "/admin",
    ariaLabel: "Go to admin page",
    visibility: "admin",
  },
  {
    label: "Sign in",
    href: "/login?next=%2Faccount",
    ariaLabel: "Go to sign in page",
    visibility: "anonymous",
  },
] as const satisfies readonly NavLink[];
