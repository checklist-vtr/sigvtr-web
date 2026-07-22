/**
 * ==========================================================
 * SIGVTR
 * Sistema Integrado de Gestão de Viaturas
 * ----------------------------------------------------------
 * Etapa 1 - Identificação do Militar
 * ==========================================================
 */

import retiradaController from "../../controllers/retiradaController.js";

class Identificacao {

    constructor() {

        this.inputRG = null;
        this.infoContainer = null;

    }

    /**
     * ======================================================
     * Renderização
     * ======================================================
     */

    render() {

        const militar = retiradaController.getMilitar();

        return `

            <section class="step">

                <h2>Identificação do Militar</h2>

                <p class="step-description">

                    Informe o RG funcional para localizar o militar.

                </p>

                <div class="form-group">

                    <label for="rg">

                        RG PM

                    </label>

                    <input

                        id="rg"
                        class="form-control"
                        type="text"
                        maxlength="10"
                        autocomplete="off"
                        placeholder="Ex.: 1234567"
                        value="${militar.rg}"

                    >

                </div>

                <div id="militar-info">

                    ${this.renderMilitar()}

                </div>

            </section>

        `;

    }

    /**
     * ======================================================
     * Eventos
     * ======================================================
     */

    bindEvents() {

        this.inputRG = document.getElementById("rg");

        this.infoContainer =
            document.getElementById("militar-info");

        this.inputRG.addEventListener(
            "blur",
            () => this.buscarMilitar()
        );

        this.inputRG.addEventListener(
            "keypress",
            (event) => {

                if (event.key === "Enter") {

                    this.buscarMilitar();

                }

            }
        );

    }

    /**
     * ======================================================
     * Busca Militar
     * ======================================================
     */

    async buscarMilitar() {

        const rg = this.inputRG.value.trim();

        if (!rg) {

            this.limparMilitar();

            return;

        }

        /**
         * ==================================================
         * MOCK
         * ==================================================
         * Posteriormente será substituído
         * pelo Google Apps Script.
         */

        const militar = {

            rg: rg,

            nome: "JOÃO DA SILVA",

            nomeGuerra: "JOÃO",

            posto: "CB PM",

            opm: "20º BPM"

        };

        retiradaController.setMilitar(militar);

        this.infoContainer.innerHTML =
            this.renderMilitar();

    }

    /**
     * ======================================================
     * Card do Militar
     * ======================================================
     */

    renderMilitar() {

        const militar =
            retiradaController.getMilitar();

        if (!militar.nome) {

            return `
                <div class="empty-card">

                    Nenhum militar selecionado.

                </div>
            `;

        }

        return `

            <div class="card">

                <h3>

                    ${militar.posto}

                </h3>

                <strong>

                    ${militar.nome}

                </strong>

                <p>

                    Nome de Guerra:
                    ${militar.nomeGuerra}

                </p>

                <p>

                    Unidade:
                    ${militar.opm}

                </p>

            </div>

        `;

    }

    /**
     * ======================================================
     * Limpa Militar
     * ======================================================
     */

    limparMilitar() {

        retiradaController.setMilitar({

            rg: "",

            nome: "",

            nomeGuerra: "",

            posto: "",

            opm: ""

        });

        this.infoContainer.innerHTML =
            this.renderMilitar();

    }

    /**
     * ======================================================
     * Validação
     * ======================================================
     */

    validate() {

        const militar =
            retiradaController.getMilitar();

        if (!militar.rg) {

            alert("Informe o RG do militar.");

            this.inputRG.focus();

            return false;

        }

        if (!militar.nome) {

            alert("Militar não localizado.");

            this.inputRG.focus();

            return false;

        }

        return true;

    }

    /**
     * ======================================================
     * Destruição
     * ======================================================
     */

    destroy() {

        this.inputRG = null;

        this.infoContainer = null;

    }

}

const identificacao = new Identificacao();

export default identificacao;