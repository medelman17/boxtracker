"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema } from "@boxtrack/shared";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
} from "@/components/ui/input";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate with Zod
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(result.data);

    if (signInError) {
      // Map common Supabase errors to friendly messages
      if (signInError.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (signInError.includes("Email not confirmed")) {
        setError("Please verify your email before signing in.");
      } else {
        setError(signInError);
      }
      setLoading(false);
    } else {
      router.push(redirectTo);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-background-0 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-3xl font-bold text-typography-900">
            Sign in to BoxTrack
          </h1>
          <p className="mt-2 text-center text-sm text-typography-600">
            Track your storage boxes with ease
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-error-0 p-4">
              <p className="text-sm text-error-500">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <FormControl isRequired>
              <FormControlLabel>
                <FormControlLabelText>Email address</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormControl>

            <FormControl isRequired>
              <FormControlLabel>
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </FormControl>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/signup"
              className="font-medium text-primary-500 hover:text-primary-600"
            >
              Need an account? Sign up
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading} isLoading={loading}>
            <ButtonText>{loading ? "Signing in..." : "Sign in"}</ButtonText>
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
