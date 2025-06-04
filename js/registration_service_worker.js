// https://web.dev/add-manifest/
// https://dev.to/njromano/how-to-scope-your-pwa-service-workers-1n6m

// https://habr.com/ru/post/547436/
// https://developers.google.com/web/tools/workbox/
// https://github.com/mdn/sw-test/blob/gh-pages/sw.js#L1-L17
// https://developer.mozilla.org/ru/docs/Web/API/Service_Worker_API/Using_Service_Workers

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => console.log(registration.scope), (err) => console.log(err));
    });
}

/* if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(
            function (registration) {
                // Registration was successful
                // console.log('Реєстрація Service Worker пройшла успішно: ', registration.scope);
            },
            function (err) {
                // registration failed :(
                console.log("Виникла помилка при реєстрації Service Worker: ", err);
            }
        );
    });
} */