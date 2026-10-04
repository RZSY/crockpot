const VERSION = "1.3.1";
const CACHE_NAME = "crockpot-1.3.1" + VERSION;
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./dictionary.js",
  "./lexicon.js",
  "./spelling-engine.js",
  "./tokenizer.js",
  "./confusables.js",
  "./grammar-rules.js",
  "./punctuation.js",
  "./document-analysis.js",
  "./ui.js",
  "./dmode.js",
  "./icons/favicon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png"
];

function precache(cache) {
  return Promise.all(
    APP_SHELL.map((url) =>
      cache.add(new Request(url, { cache: "reload" })).catch((err) => {
        console.warn("Crockpot SW: could not precache", url, err);
      })
    )
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(precache)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match("./index.html"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const refresh = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached || caches.match("./index.html"));

      if (cached) {
        event.waitUntil(refresh.catch(() => {}));
        return cached;
      }
      return refresh;
    })
  );
});
