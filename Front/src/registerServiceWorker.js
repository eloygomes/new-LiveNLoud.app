const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

async function unregisterServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

async function clearServiceWorkerCaches() {
  if (typeof caches === "undefined") return;

  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((key) => caches.delete(key)));
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isLocalEnvironment =
    import.meta.env.DEV || LOCAL_HOSTNAMES.has(window.location.hostname);

  window.addEventListener("load", () => {
    if (isLocalEnvironment) {
      unregisterServiceWorkers()
        .then(() => clearServiceWorkerCaches())
        .catch((error) => {
          console.error("Service worker cleanup failed:", error);
        });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
