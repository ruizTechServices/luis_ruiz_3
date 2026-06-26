"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useActionState } from "react";

import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  type AuthFormState,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  nextPath: string;
}

const initialState: AuthFormState = {};

export function AuthForm({ nextPath }: AuthFormProps) {
  const [signInState, signInAction, isSignInPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [signUpState, signUpAction, isSignUpPending] = useActionState(
    signUpWithPassword,
    initialState,
  );
  const isPending = isSignInPending || isSignUpPending;
  const message = signInState.message ?? signUpState.message;

  return (
    <div className="grid w-full gap-4">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={nextPath} />
        <Button className="w-full" type="submit" variant="outline">
          Continue with Google
        </Button>
      </form>
      <form className="grid gap-4">
        <input type="hidden" name="next" value={nextPath} />
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Password
          <input
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
          />
        </label>
        {message ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Button formAction={signInAction} disabled={isPending} type="submit">
            <LogIn aria-hidden="true" />
            Sign in
          </Button>
          <Button
            formAction={signUpAction}
            disabled={isPending}
            type="submit"
            variant="outline"
          >
            <UserPlus aria-hidden="true" />
            Sign up
          </Button>
        </div>
      </form>
    </div>
  );
}
