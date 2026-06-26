export interface NavLink {
  label: string;
  href: string;
  ariaLabel: string;
  visibility: "always" | "anonymous" | "authenticated";
}

export const navLinks = [
  {
    label: "Home",
    href: "/",
    ariaLabel: "Go to home page",
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
    label: "Sign in",
    href: "/login?next=%2Faccount",
    ariaLabel: "Go to sign in page",
    visibility: "anonymous",
  },
] as const satisfies readonly NavLink[];
