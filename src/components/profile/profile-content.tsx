"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateProfile, deleteAccount } from "@/server/actions/profile";
import type { UserProfile } from "@/server/actions/profile";
import { signOut } from "next-auth/react";
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  KeyRound,
} from "lucide-react";

const PROVIDER_LABELS: Record<string, { name: string; icon: string }> = {
  google: { name: "Google", icon: "G" },
  github: { name: "GitHub", icon: "GH" },
  credentials: { name: "Email & Password", icon: "EP" },
};

export function ProfileContent({ profile }: { profile: UserProfile }) {
  return (
    <div>
      <h1 className="font-display text-display font-medium text-ink mb-2">
        Profile
      </h1>
      <p className="text-body text-slate mb-8">
        Your account information and security settings.
      </p>

      <div className="space-y-6">
        <ProfileCard profile={profile} />
        <EditNameSection profile={profile} />
        <ConnectedAccountsSection profile={profile} />
        <DangerZone />
      </div>
    </div>
  );
}

function ProfileCard({ profile }: { profile: UserProfile }) {
  const memberSince = profile.createdAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card variant="base" padding="md">
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {profile.image ? (
              <img
                src={profile.image}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-hairline-soft"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft ring-2 ring-hairline-soft">
                <span className="font-display text-heading-2 font-medium text-primary">
                  {(profile.name ?? profile.email)[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-heading-3 font-medium text-ink truncate">
              {profile.name ?? "No name set"}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-body-sm text-slate">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Member since {memberSince}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="purple">
                <CreditCard className="h-3 w-3 mr-1" />
                {profile.cardCount} library card{profile.cardCount !== 1 ? "s" : ""}
              </Badge>
              {profile.hasPassword && (
                <Badge variant="default">
                  <KeyRound className="h-3 w-3 mr-1" />
                  Password set
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditNameSection({ profile }: { profile: UserProfile }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleSave(formData: FormData) {
    startTransition(async () => {
      setSaved(false);
      setError("");
      const result = await updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <Card variant="base" padding="md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint-sky">
            <User className="h-5 w-5 text-info" />
          </div>
          <div>
            <CardTitle className="text-heading-3">Display Name</CardTitle>
            <CardDescription>
              How you appear across the app
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSave}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Name"
                name="name"
                defaultValue={profile.name ?? ""}
                placeholder="Your display name"
                required
              />
            </div>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isPending}
            >
              {saved ? (
                <CheckCircle2 className="h-4 w-4 text-on-primary" />
              ) : isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? "Saved!" : "Save"}
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-body-sm text-error">{error}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function ConnectedAccountsSection({ profile }: { profile: UserProfile }) {
  const providers = profile.connectedProviders;

  return (
    <Card variant="base" padding="md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint-mint">
            <Shield className="h-5 w-5 text-success" />
          </div>
          <div>
            <CardTitle className="text-heading-3">Connected Accounts</CardTitle>
            <CardDescription>
              Sign-in methods linked to your account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Always show password status */}
        <div className="flex items-center justify-between rounded-md bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-canvas text-body-sm font-medium text-charcoal">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-charcoal">
                Email &amp; Password
              </p>
              <p className="text-micro text-steel">{profile.email}</p>
            </div>
          </div>
          <Badge variant={profile.hasPassword ? "success" : "default"}>
            {profile.hasPassword ? "Active" : "Not set"}
          </Badge>
        </div>

        {/* OAuth providers */}
        {providers.map((p) => {
          const label = PROVIDER_LABELS[p.provider] ?? {
            name: p.provider,
            icon: p.provider[0].toUpperCase(),
          };
          return (
            <div
              key={p.provider}
              className="flex items-center justify-between rounded-md bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-canvas text-body-sm font-bold text-charcoal">
                  {label.icon}
                </div>
                <div>
                  <p className="text-body-sm font-medium text-charcoal">
                    {label.name}
                  </p>
                  <p className="text-micro text-steel font-mono">
                    {p.providerAccountId}
                  </p>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
          );
        })}

        {providers.length === 0 && !profile.hasPassword && (
          <p className="text-body-sm text-steel text-center py-4">
            No sign-in methods configured.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DangerZone() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  function handleDelete() {
    if (confirmText !== "DELETE") return;
    startTransition(async () => {
      const result = await deleteAccount();
      if (!result.error) {
        signOut({ callbackUrl: "/" });
      }
    });
  }

  return (
    <Card variant="base" padding="md" className="border-error/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint-rose">
            <AlertTriangle className="h-5 w-5 text-error" />
          </div>
          <div>
            <CardTitle className="text-heading-3 text-error">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible account actions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!showConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm font-medium text-charcoal">
                Delete account
              </p>
              <p className="text-micro text-steel">
                Permanently delete your account, library cards, and all data.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="text-error hover:text-error shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="border border-error/20 rounded-lg p-4 bg-tint-rose/30">
            <p className="text-body-sm font-medium text-error mb-2">
              Are you sure? This cannot be undone.
            </p>
            <p className="text-micro text-charcoal mb-3">
              All your data will be permanently deleted: library cards,
              renewal history, notification settings, and push subscriptions.
              Type <strong>DELETE</strong> to confirm.
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full h-11 rounded-md border border-error/30 bg-canvas px-3 text-body-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-error/30 focus:border-error"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDelete}
                disabled={isPending || confirmText !== "DELETE"}
                className="text-error hover:text-error"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Confirm delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
