"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <Card variant="elevated" padding="lg" className="animate-fade-up">
      <CardContent>
        <h2 className="font-display text-heading-1 font-medium text-ink text-center mb-1">
          Welcome back
        </h2>
        <p className="text-body-sm text-slate text-center mb-8">
          Log in to manage your library renewals
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
            <GoogleIcon />
            Continue with Google
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            type="button"
          >
            <GitHubIcon />
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

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="••••••••"
            autoComplete="current-password"
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
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-body-sm text-slate">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary-deep hover:text-primary font-medium"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
