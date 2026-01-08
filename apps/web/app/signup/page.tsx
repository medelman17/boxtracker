"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { signupSchema } from "@boxtrack/shared";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Input,
  FormControlHelper,
  FormControlHelperText,
} from "@/components/ui/input";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate with Zod
    const result = signupSchema.safeParse({
      email,
      password,
      fullName: fullName || undefined,
    });

    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(result.data);

    if (signUpError) {
      // Map common Supabase errors to friendly messages
      if (signUpError.includes("User already registered")) {
        setError("An account with this email already exists.");
      } else {
        setError(signUpError);
      }
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  // Show success message after signup
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-background-0 rounded-lg shadow-md text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-success-0">
            <svg
              className="w-8 h-8 text-success-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-typography-900">
            Check your email
          </h2>
          <p className="text-typography-600">
            We sent a confirmation link to <strong>{email}</strong>. Click the
            link to verify your account and complete signup.
          </p>
          <Link href="/login">
            <Button action="secondary" className="w-full">
              <ButtonText>Back to login</ButtonText>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-background-0 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-3xl font-bold text-typography-900">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-typography-600">
            Start tracking your storage boxes today
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-error-0 p-4">
              <p className="text-sm text-error-500">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>
                  Full name <span className="text-typography-400 font-normal">(optional)</span>
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </FormControl>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
              />
              <FormControlHelper>
                <FormControlHelperText>
                  Must be 8+ characters with uppercase, lowercase, and number
                </FormControlHelperText>
              </FormControlHelper>
            </FormControl>
          </div>

          <div className="text-sm">
            <Link
              href="/login"
              className="font-medium text-primary-500 hover:text-primary-600"
            >
              Already have an account? Sign in
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading} isLoading={loading}>
            <ButtonText>{loading ? "Creating account..." : "Create account"}</ButtonText>
          </Button>
        </form>
      </div>
    </div>
  );
}
