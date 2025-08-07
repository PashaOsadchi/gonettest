// https://web.dev/add-manifest/
// https://dev.to/njromano/how-to-scope-your-pwa-service-workers-1n6m

// https://habr.com/ru/post/547436/
// https://developers.google.com/web/tools/workbox/
// https://github.com/mdn/sw-test/blob/gh-pages/sw.js#L1-L17
// https://developer.mozilla.org/ru/docs/Web/API/Service_Worker_API/Using_Service_Workers

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js", { scope: "/" })
            .then((registration) => console.log(registration.scope))
            .catch((err) => {
                console.error("Service worker registration failed:", err);
                if (typeof showNotification === "function") {
                    const baseMessage = t(
                        "serviceWorkerError",
                        "Помилка Service Worker"
                    );
                    const details = err?.message || err;
                    showNotification(`${baseMessage}: ${details}`);
                }
            });
    });
}
