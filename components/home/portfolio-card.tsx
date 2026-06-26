import * as React from "react";

import { cn } from "@/lib/utils";

function PortfolioCard({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function PortfolioCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

function PortfolioCardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xl font-semibold tracking-normal", className)}
      {...props}
    />
  );
}

function PortfolioCardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />;
}

function PortfolioCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-5 text-sm leading-6", className)} {...props} />;
}

export {
  PortfolioCard,
  PortfolioCardHeader,
  PortfolioCardTitle,
  PortfolioCardDescription,
  PortfolioCardContent,
};
