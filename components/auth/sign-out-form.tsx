import { LogOut } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutForm() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline">
        <LogOut aria-hidden="true" />
        Sign out
      </Button>
    </form>
  );
}
