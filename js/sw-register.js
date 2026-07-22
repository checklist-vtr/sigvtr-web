/**
 * =====================================================
 * SIGVTR
 * Registro do Service Worker
 * =====================================================
 */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./sw.js")
            .then(() => {

                console.log("Service Worker registrado.");

            })
            .catch(console.error);

    });

}