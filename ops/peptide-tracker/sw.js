const C = "peptide-v1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(["./", "./index.html", "./manifest.json", "./icon.svg"])));
  self.skipWaiting();
});
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return; // let Supabase (cross-origin) pass straight through
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const cc = resp.clone(); caches.open(C).then(c => c.put(e.request, cc)); return resp;
    }).catch(() => caches.match("./index.html")))
  );
});
