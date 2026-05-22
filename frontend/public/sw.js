// Lelite Service Worker — Cache-Buster v3
// Purpose: Immediately unregisters itself and clears ALL caches to fix
//          stale-JS MIME-type errors in Chrome, Edge, Firefox, and Safari.

self.addEventListener('install', () => {
  // Skip waiting so this SW activates immediately without waiting for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Delete every cache this origin has ever created
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // 2. Claim all open tabs so they use this SW immediately
      await self.clients.claim();

      // 3. Unregister this service worker so it never runs again
      await self.registration.unregister();

      // 4. Force all open tabs to do a full navigation reload
      //    so they pick up the fresh index.html from the server
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        try {
          client.navigate(client.url);
        } catch {
          // navigate() can fail if the client is not a Window — safe to ignore
        }
      }
    })()
  );
});

// Do NOT add a fetch handler — we don't want to intercept any requests.
// All network traffic goes directly to the server.
