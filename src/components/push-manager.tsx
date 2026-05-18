"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export function PushManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-body-sm text-steel">
        <BellOff className="h-4 w-4" />
        <span>Notifications blocked in browser settings</span>
      </div>
    );
  }

  return (
    <Button
      variant={subscribed ? "secondary" : "primary"}
      size="sm"
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
    >
      {subscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          Disable notifications
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          Enable notifications
        </>
      )}
    </Button>
  );
}
