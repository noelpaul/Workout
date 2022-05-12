const version = 987;
const staticCacheName = `site-shell-assets-v-${version}`;
const dynamicCacheName = `site-dynamic-assets-v-${version}`;
const dynamicCacheLimit = 15;
const shellAssets = [
  "/Others/Notes/",
  "/Others/Notes/react-ui.js",
  "/Others/Notes/app.js",
  "/Others/Notes/index.css",
  "https://unpkg.com/@babel/standalone/babel.min.js",
  "https://unpkg.com/react@17/umd/react.production.min.js",
  "https://unpkg.com/react-dom@17/umd/react-dom.production.min.js",
];

// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

self.addEventListener("message", async (event) => {
  const myClients = await self.clients.matchAll();
  if (event.data.action === "update-available") {
    myClients.forEach((client) => {
      client.postMessage(event.data);
    });
  } else if (event.data.action === "update") {
    self.skipWaiting();
  } else if (event.data.action === "reload-data") {
    myClients.forEach((client) => {
      if (event.source.id === client.id) return;
      client.postMessage(event.data);
    });
  }
});

//install event
self.addEventListener("install", (event) => {
  console.log("install");
});

// activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }),
      caches.open(staticCacheName).then((cache) => {
        cache.addAll(shellAssets);
      }),
      self.clients.claim(),
    ])
  );
});

// fetch events
self.addEventListener("fetch", (event) => {
  if (event.request.method != "GET") return;

  event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(event.request).then((fetchRes) => {
          return caches.open(dynamicCacheName).then((cache) => {
            cache.put(event.request.url, fetchRes.clone());

            // check cached items size
            limitCacheSize(dynamicCacheName, dynamicCacheLimit);
            return fetchRes;
          });
        })
      );
    })
  );
});
