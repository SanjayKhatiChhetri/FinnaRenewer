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
import { Toggle } from "@/components/ui/toggle";
import { PushManager } from "@/components/push-manager";
import {
  linkLibraryCredentials,
  unlinkLibraryCredentials,
} from "@/server/actions/library";
import { updateSettings } from "@/server/actions/settings";
import {
  BookOpen,
  Link2,
  Unlink,
  Save,
  Loader2,
  CheckCircle2,
  Plus,
  CreditCard,
} from "lucide-react";
import type { LinkedCard } from "@/server/finna/types";

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
  cards,
  settings,
}: {
  cards: LinkedCard[];
  settings: Settings | null;
}) {
  return (
    <div>
      <h1 className="font-display text-display font-medium text-ink mb-2">
        Settings
      </h1>
      <p className="text-body text-slate mb-8">
        Manage your library cards, notifications, and preferences.
      </p>

      <div className="space-y-6">
        <LibraryCardsSection cards={cards} />
        <NotificationSection settings={settings} />
        <PreferencesSection settings={settings} />
      </div>
    </div>
  );
}

function LibraryCardsSection({ cards }: { cards: LinkedCard[] }) {
  const [showForm, setShowForm] = useState(cards.length === 0);

  return (
    <Card variant="base" padding="md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint-lavender">
              <CreditCard className="h-5 w-5 text-primary-deep" />
            </div>
            <div>
              <CardTitle className="text-heading-3">Library Cards</CardTitle>
              <CardDescription>
                {cards.length === 0
                  ? "Link your Finna library credentials"
                  : `${cards.length} card${cards.length > 1 ? "s" : ""} linked`}
              </CardDescription>
            </div>
          </div>
          {cards.length > 0 && (
            <Badge variant="success">
              {cards.length} connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing cards */}
        {cards.map((card) => (
          <LinkedCardRow key={card.id} card={card} />
        ))}

        {/* Add card form */}
        {showForm ? (
          <LinkCardForm
            onDone={() => setShowForm(false)}
            isFirstCard={cards.length === 0}
          />
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" />
            Add another card
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LinkedCardRow({ card }: { card: LinkedCard }) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  function handleUnlink() {
    startTransition(async () => {
      await unlinkLibraryCredentials(card.id);
      setRemoved(true);
    });
  }

  if (removed) return null;

  return (
    <div className="flex items-center justify-between rounded-md bg-surface px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <BookOpen className="h-4 w-4 text-primary-deep shrink-0" />
        <div className="min-w-0">
          <p className="text-body-sm font-medium text-charcoal truncate">
            {card.label || card.instanceName}
          </p>
          <p className="text-micro text-steel font-mono">{card.finnaUsername}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnlink}
          disabled={isPending}
          className="text-error hover:text-error"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Unlink className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function LinkCardForm({
  onDone,
  isFirstCard,
}: {
  onDone: () => void;
  isFirstCard: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleLink(formData: FormData) {
    startTransition(async () => {
      setMessage(null);
      const result = await linkLibraryCredentials(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({
          type: "success",
          text: "Library card linked successfully!",
        });
        if (!isFirstCard) {
          setTimeout(onDone, 1500);
        }
      }
    });
  }

  return (
    <div className="border border-hairline-soft rounded-lg p-4">
      <p className="text-body-sm font-medium text-charcoal mb-3">
        {isFirstCard ? "Link your library card" : "Add a library card"}
      </p>
      <form action={handleLink} className="space-y-3">
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
          label="Nickname (optional)"
          name="label"
          placeholder="e.g. City Library, Uni Library"
        />
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
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            Link card
          </Button>
          {!isFirstCard && (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onDone}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {message && (
        <p
          className={`mt-3 text-body-sm rounded-md px-3 py-2 ${
            message.type === "success"
              ? "bg-tint-mint text-success-deep"
              : "bg-tint-rose text-error-deep"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
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
        <Button
          variant="secondary"
          size="md"
          type="submit"
          disabled={isPending}
        >
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
  const [autoRenew, setAutoRenew] = useState(
    settings?.autoRenewEnabled ?? true,
  );
  const [notifications, setNotifications] = useState(
    settings?.notificationsEnabled ?? true,
  );
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
