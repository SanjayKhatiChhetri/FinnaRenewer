"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { PushManager } from "@/components/push-manager";
import { linkLibraryCredentials, unlinkLibraryCredentials } from "@/server/actions/library";
import { updateSettings } from "@/server/actions/settings";
import {
  BookOpen,
  Link2,
  Unlink,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface Settings {
  discordWebhookUrl?: string | null;
  renewDaysBefore: number;
  autoRenewEnabled: boolean;
  notificationsEnabled: boolean;
}

const FINNA_LIBRARIES = [
  { id: "outi", name: "Oulu City - OUTI" },
  { id: "oula", name: "Oulu Uni - OULA" },
];

export function SettingsContent({
  linked,
  finnaUsername,
  finnaInstance,
  settings,
}: {
  linked: boolean;
  finnaUsername?: string;
  finnaInstance?: string;
  settings: Settings | null;
}) {
  return (
    <div>
      <h1 className="font-display text-display font-medium text-ink mb-2">
        Settings
      </h1>
      <p className="text-body text-slate mb-8">
        Manage your library connection, notifications, and preferences.
      </p>

      <div className="space-y-6">
        <LibraryCredentialsSection linked={linked} username={finnaUsername} instance={finnaInstance} />
        <NotificationSection settings={settings} />
        <PreferencesSection settings={settings} />
      </div>
    </div>
  );
}

function LibraryCredentialsSection({
  linked,
  username,
  instance,
}: {
  linked: boolean;
  username?: string;
  instance?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const libraryName = FINNA_LIBRARIES.find((l) => l.id === instance)?.name;

  function handleLink(formData: FormData) {
    startTransition(async () => {
      setMessage(null);
      const result = await linkLibraryCredentials(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Library card linked successfully!" });
      }
    });
  }

  function handleUnlink() {
    startTransition(async () => {
      setMessage(null);
      await unlinkLibraryCredentials();
      setMessage({ type: "success", text: "Library card unlinked." });
    });
  }

  return (
    <Card variant="base" padding="md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint-lavender">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-heading-3">Library Card</CardTitle>
              <CardDescription>Your Finna library credentials</CardDescription>
            </div>
          </div>
          {linked && <Badge variant="success">Connected</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {linked ? (
          <div className="space-y-4">
            {libraryName && (
              <div className="flex items-center justify-between rounded-md bg-surface px-4 py-3">
                <div>
                  <p className="text-micro text-steel uppercase tracking-wider">Library</p>
                  <p className="text-body-sm font-medium text-charcoal">{libraryName}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between rounded-md bg-surface px-4 py-3">
              <div>
                <p className="text-micro text-steel uppercase tracking-wider">Username</p>
                <p className="text-body-sm font-medium font-mono text-charcoal">
                  {username}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleUnlink}
              disabled={isPending}
            >
              <Unlink className="h-4 w-4" />
              Unlink card
            </Button>
          </div>
        ) : (
          <form action={handleLink} className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-charcoal mb-1.5">
                Library
              </label>
              <select
                name="instance"
                required
                defaultValue="outi"
                className="w-full h-11 rounded-md border border-hairline-soft bg-canvas px-3 text-body-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {FINNA_LIBRARIES.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Library Card ID"
              name="username"
              placeholder="e.g. OUTI0005542"
              required
            />
            <Input
              label="PIN Code"
              name="password"
              type="password"
              placeholder="4-digit PIN"
              required
            />
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Link card
            </Button>
          </form>
        )}

        {message && (
          <p
            className={`mt-4 text-body-sm rounded-md px-3 py-2 ${
              message.type === "success"
                ? "bg-tint-mint text-success"
                : "bg-tint-rose text-error"
            }`}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationSection({ settings }: { settings: Settings | null }) {
  return (
    <Card variant="base" padding="md">
      <CardHeader>
        <CardTitle className="text-heading-3">Notifications</CardTitle>
        <CardDescription>
          Get notified about renewals and due dates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-body-sm font-medium text-charcoal mb-2">
            Push Notifications
          </p>
          <PushManager />
        </div>
        <div className="border-t border-hairline-soft pt-5">
          <DiscordWebhookInput
            defaultValue={settings?.discordWebhookUrl ?? ""}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DiscordWebhookInput({ defaultValue }: { defaultValue: string }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave(formData: FormData) {
    startTransition(async () => {
      setSaved(false);
      await updateSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form action={handleSave}>
      <input type="hidden" name="renewDaysBefore" value="7" />
      <input type="hidden" name="autoRenewEnabled" value="on" />
      <input type="hidden" name="notificationsEnabled" value="on" />
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Discord Webhook URL"
            name="discordWebhookUrl"
            type="url"
            placeholder="https://discord.com/api/webhooks/..."
            defaultValue={defaultValue}
          />
        </div>
        <Button variant="secondary" size="md" type="submit" disabled={isPending}>
          {saved ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}

function PreferencesSection({ settings }: { settings: Settings | null }) {
  const [autoRenew, setAutoRenew] = useState(settings?.autoRenewEnabled ?? true);
  const [notifications, setNotifications] = useState(settings?.notificationsEnabled ?? true);
  const [days, setDays] = useState(settings?.renewDaysBefore ?? 7);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      setSaved(false);
      const formData = new FormData();
      formData.set("discordWebhookUrl", settings?.discordWebhookUrl ?? "");
      formData.set("renewDaysBefore", String(days));
      formData.set("autoRenewEnabled", autoRenew ? "on" : "off");
      formData.set("notificationsEnabled", notifications ? "on" : "off");
      await updateSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card variant="base" padding="md">
      <CardHeader>
        <CardTitle className="text-heading-3">Preferences</CardTitle>
        <CardDescription>Configure renewal behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Toggle
          checked={autoRenew}
          onChange={setAutoRenew}
          label="Auto-renew"
          description="Automatically renew loans due soon via weekly cron job"
          name="autoRenewEnabled"
        />
        <Toggle
          checked={notifications}
          onChange={setNotifications}
          label="Notifications"
          description="Send push notifications after renewal attempts"
          name="notificationsEnabled"
        />
        <div>
          <label className="block text-body-sm font-medium text-charcoal mb-1.5">
            Renew days before due
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="14"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-body-sm font-mono text-charcoal bg-surface rounded px-2 py-1 min-w-[3rem] text-center">
              {days}d
            </span>
          </div>
          <p className="text-micro text-steel mt-1">
            Loans due within this many days will be renewed
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
