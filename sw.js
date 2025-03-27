const CACHE_NAME = "dicoding-story-v1";
const CACHE_IMAGE_NAME = "dicoding-story-images-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/scripts/index.js",
  "/manifest.json",
  "/manifest.webmanifest",
  "/scripts/routes.js",
  "/scripts/utils/url-parser.js",
  "/scripts/utils/drawer-initiator.js",
  "/scripts/utils/auth-manager.js",
  "/scripts/utils/accessibility-helper.js",
  "/scripts/utils/notification-helper.js",
  "/scripts/utils/idb-utils.js",
  "/scripts/utils/camera-initiator.js",
  "/scripts/utils/map-initiator.js",
  "/scripts/views/pages/home-page.js",
  "/scripts/views/pages/detail-page.js",
  "/offline-placeholder.jpg",
  "/scripts/views/pages/add-story-page.js",
  "/scripts/views/pages/login-page.js",
  "/scripts/views/pages/register-page.js",
  "/scripts/views/pages/saved-stories-page.js",
  "/scripts/views/pages/not-found-page.js",
  "/scripts/views/templates/story-item-template.js",
  "/scripts/data/api/story-api.js",
  "/scripts/data/repository/story-repository.js",
  "/scripts/presenter/home-presenter.js",
  "/scripts/presenter/detail-presenter.js",
  "/scripts/presenter/add-story-presenter.js",
  "/images/icons/icon-72x72.png",
  "/images/icons/icon-96x96.png",
  "/images/icons/icon-128x128.png",
  "/images/icons/icon-144x144.png",
  "/images/icons/icon-152x152.png",
  "/images/icons/icon-192x192.png",
  "/images/icons/icon-384x384.png",
  "/images/icons/icon-512x512.png",
  "/images/icons/dicoding.jpg",
  "/images/offline-placeholder.jpg",
];

self.addEventListener("install", (event) => {
  console.log("Installing Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell and content");
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("Activating Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== CACHE_IMAGE_NAME) {
            console.log(`Service Worker: Clearing old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.hostname === "story-api.dicoding.dev") {
    if (requestUrl.pathname.includes("/stories")) {
      event.respondWith(
        fetch(event.request).catch(() => {
          return clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: "OFFLINE_REDIRECT",
                url: "/#/saved",
              });
            });

            return new Response(
              JSON.stringify({
                error: true,
                message: "You are offline. Redirecting to saved stories.",
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          });
        }),
      );
    }
    return;
  }

  if (
    event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/) ||
    event.request.url.includes("photoUrl") ||
    event.request.destination === "image"
  ) {
    event.respondWith(
      caches.open(CACHE_IMAGE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              console.log(
                "Fallback to placeholder image for:",
                event.request.url,
              );
              return caches.match("/public/offline-placeholder.jpg");
            });
        });
      }),
    );
    return;
  }

  if (event.request.headers.get("Accept").includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          console.log("Fallback to cached HTML for:", event.request.url);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match("/index.html");
          });
        }),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        console.log("Fallback to cache for:", event.request.url);
        return caches.match(event.request);
      }),
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Received push notification");

  let notificationData = {
    title: "New Update",
    options: {
      body: "New content is available",
      icon: "/images/icons/icon-128x128.png",
      badge: "/images/icons/icon-72x72.png",
    },
  };

  if (event.data) {
    try {
      notificationData = JSON.parse(event.data.text());
    } catch (e) {
      console.error("Error parsing push data:", e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow("/");
      }),
  );
});

// Handle message from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWait();
  }
});
