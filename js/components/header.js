/**
 * =====================================================
 * SIGVTR
 * Componente: Cabeçalho
 * =====================================================
 */

class AppHeader extends HTMLElement {

    constructor() {
        super();

        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
    }

    render() {

        this.shadowRoot.innerHTML = `

<style>

:host{

display:block;

}

.app-header{

display:flex;

justify-content:space-between;

align-items:center;

padding:16px;

background:#1565C0;

color:#FFF;

box-shadow:0 2px 8px rgba(0,0,0,.15);

}

.brand{

display:flex;

align-items:center;

gap:12px;

}

.logo{

width:42px;

height:42px;

}

.title{

font-size:20px;

font-weight:700;

}

.subtitle{

font-size:12px;

opacity:.85;

}

</style>

<header class="app-header">

<div class="brand">

<img
src="assets/icons/logo.svg"
class="logo"
alt="SIGVTR">

<div>

<div class="title">

SIGVTR

</div>

<div class="subtitle">

Sistema Integrado de Gestão de Viaturas

</div>

</div>

</div>

</header>

`;

    }

}

customElements.define("app-header", AppHeader);