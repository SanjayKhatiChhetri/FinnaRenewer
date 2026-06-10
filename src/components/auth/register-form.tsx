"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/server/actions/auth";
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const password = formData.get("password") as string;
    const confirm = formData.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("Passwords don't match.");
      setLoading(false);
      return;
    }

    try {
      const result = await registerUser(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      window.location.href = "/dashboard";
    }
  }

  return (
    <Card variant="elevated" padding="lg" className="animate-fade-up">
      <CardContent>
        <h2 className="font-display text-heading-1 font-medium text-ink text-center mb-1">
          Create your account
        </h2>
        <p className="text-body-sm text-slate text-center mb-8">
          Start managing your library renewals
        </p>

        {/* OAuth */}
        <div className="space-y-2.5 mb-6">
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            type="button"
          >
            Continue with Google
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            type="button"
          >
            Continue with GitHub
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hairline" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-canvas px-3 text-micro text-steel uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            name="name"
            placeholder="Your name"
            autoComplete="name"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {error && (
            <p className="text-body-sm text-error-deep bg-error-soft rounded-md px-3 py-2 animate-scale-in">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="md"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-body-sm text-slate">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-deep hover:text-primary font-medium"
          >
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
