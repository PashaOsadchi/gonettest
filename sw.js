// Кешує всі ресурси тому викликає помилку переповнення кешу
// self.addEventListener("install", (event) => event.waitUntil(caches.open("v1").then((cache) => cache.addAll(["/"]))));

// Кешує тільки визначені ресурси
self.addEventListener("install", (event) => event.waitUntil(caches.open("v1").then((cache) => cache.addAll(["/index.html"]))));

addEventListener("fetch", function (event) {
    if (event.request.headers.get("Accept").includes("text/html")) {
        event.respondWith(
            fetch(event.request)
                .then((response) => response)
                .catch((error) => caches.match("index.html"))
        );
    }
});
