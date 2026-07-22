/**
 * =====================================================
 * SIGVTR
 * Inicialização da aplicação
 * =====================================================
 */

document.addEventListener("DOMContentLoaded", () => {

    console.log(`${CONFIG.appName} ${CONFIG.version}`);

    Router.init();

    UI.init();

});