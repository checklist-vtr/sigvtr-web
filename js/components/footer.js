/**
 * =====================================================
 * SIGVTR
 * Componente: Rodapé
 * =====================================================
 */

class AppFooter extends HTMLElement {

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

footer{

padding:16px;

text-align:center;

background:#F5F5F5;

border-top:1px solid #DDD;

font-size:13px;

color:#666;

}

strong{

color:#1565C0;

}

</style>

<footer>

<strong>SIGVTR</strong>

<br>

Sistema Integrado de Gestão de Viaturas

<br><br>

Versão 0.1.0

</footer>

`;

    }

}

customElements.define("app-footer", AppFooter);