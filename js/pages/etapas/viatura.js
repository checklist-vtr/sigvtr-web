/**
 * ==========================================================
 * SIGVTR
 * Sistema Integrado de Gestão de Viaturas
 * ----------------------------------------------------------
 * Etapa 2 - Seleção da Viatura
 * ==========================================================
 */

import retiradaController from "../../controllers/retiradaController.js";

class Viatura {

    constructor() {

        this.select = null;
        this.info = null;

        /**
         * Mock temporário.
         * Futuramente será carregado pelo Google Apps Script.
         */
        this.viaturas = [

            {
                prefixo: "VTR-01",
                placa: "QXX0A11",
                modelo: "Toyota Hilux"
            },

            {
                prefixo: "VTR-02",
                placa: "QYY2B22",
                modelo: "Chevrolet S10"
            },

            {
                prefixo: "VTR-03",
                placa: "QZZ3C33",
                modelo: "Mitsubishi L200"
            }

        ];

    }

    /**
     * ======================================================
     * Render
     * ======================================================
     */

    render() {

        const atual = retiradaController.getViatura();

        let options = `

            <option value="">

                Selecione uma viatura

            </option>

        `;

        this.viaturas.forEach((v, index) => {

            const selected =
                atual.prefixo === v.prefixo
                    ? "selected"
                    : "";

            options += `

                <option
                    value="${index}"
                    ${selected}>

                    ${v.prefixo} • ${v.placa}

                </option>

            `;

        });

        return `

            <section class="step">

                <h2>

                    Seleção da Viatura

                </h2>

                <p class="step-description">

                    Escolha a viatura que será retirada.

                </p>

                <div class="form-group">

                    <label for="viatura">

                        Viatura

                    </label>

                    <select
                        id="viatura"
                        class="form-control">

                        ${options}

                    </select>

                </div>

                <div id="viatura-info">

                    ${this.renderViatura()}

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

        this.select =
            document.getElementById("viatura");

        this.info =
            document.getElementById("viatura-info");

        this.select.addEventListener(

            "change",

            () => this.selecionar()

        );

    }

    /**
     * ======================================================
     * Seleciona Viatura
     * ======================================================
     */

    selecionar() {

        const indice =
            this.select.value;

        if (indice === "") {

            this.limpar();

            return;

        }

        const viatura =
            this.viaturas[indice];

        retiradaController.setViatura({

            prefixo: viatura.prefixo,

            placa: viatura.placa,

            modelo: viatura.modelo

        });

        this.info.innerHTML =
            this.renderViatura();

    }

    /**
     * ======================================================
     * Card da Viatura
     * ======================================================
     */

    renderViatura() {

        const viatura =
            retiradaController.getViatura();

        if (!viatura.prefixo) {

            return `

                <div class="empty-card">

                    Nenhuma viatura selecionada.

                </div>

            `;

        }

        return `

            <div class="card">

                <h3>

                    ${viatura.prefixo}

                </h3>

                <p>

                    <strong>Modelo:</strong>

                    ${viatura.modelo}

                </p>

                <p>

                    <strong>Placa:</strong>

                    ${viatura.placa}

                </p>

            </div>

        `;

    }

    /**
     * ======================================================
     * Limpa seleção
     * ======================================================
     */

    limpar() {

        retiradaController.setViatura({

            prefixo: "",

            placa: "",

            modelo: ""

        });

        this.info.innerHTML =
            this.renderViatura();

    }

    /**
     * ======================================================
     * Validação
     * ======================================================
     */

    validate() {

        const viatura =
            retiradaController.getViatura();

        if (!viatura.prefixo) {

            alert("Selecione uma viatura.");

            this.select.focus();

            return false;

        }

        return true;

    }

    /**
     * ======================================================
     * Destroy
     * ======================================================
     */

    destroy() {

        this.select = null;

        this.info = null;

    }

}

const viatura = new Viatura();

export default viatura;