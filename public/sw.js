const CACHE_NAME = "finna-v1";
const PRECACHE_URLS = ["/dashboard", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match("/offline"))
    )
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "You have a notification from Finna Renewer",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    tag: data.tag || "finna-notification",
    renotify: true,
    data: {
      url: data.url || "/dashboard",
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title || "Finna Renewer", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
