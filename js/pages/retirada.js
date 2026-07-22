/**
 * ==========================================================
 * SIGVTR
 * Sistema Integrado de Gestão de Viaturas
 * ----------------------------------------------------------
 * Página principal da Cautela
 * Responsável por controlar todo o fluxo.
 * ==========================================================
 */

import workflowController from "../controllers/workflowController.js";
import retiradaController from "../controllers/retiradaController.js";

import stepper from "../components/stepper.js";

import identificacao from "./etapas/identificacao.js";
import viatura from "./etapas/viatura.js";
import fotos from "./etapas/fotos.js";
import checklist from "./etapas/checklist.js";
import observacoes from "./etapas/observacoes.js";
import revisao from "./etapas/revisao.js";

class RetiradaPage {

    constructor() {

        this.app = document.getElementById("app");

        this.steps = {

            1: identificacao,

            2: viatura,

            3: fotos,

            4: checklist,

            5: observacoes,

            6: revisao

        };

    }

    /**
     * ======================================================
     * Renderiza toda a página
     * ======================================================
     */

    render() {

        const info = workflowController.getInfo();

        this.app.innerHTML = `

            <div class="page-retirada">

                ${stepper.render(info)}

                <div id="step-content"></div>

                <div class="step-actions">

                    <button
                        id="btnBack"
                        class="btn btn-secondary">

                        Voltar

                    </button>

                    <button
                        id="btnNext"
                        class="btn btn-primary">

                        Continuar

                    </button>

                </div>

            </div>

        `;

        this.renderStep();

        this.bindEvents();

    }

    /**
     * ======================================================
     * Renderiza apenas a etapa atual
     * ======================================================
     */

    renderStep() {

        const container = document.getElementById("step-content");

        const page = this.steps[workflowController.current()];

        if (!page) {

            console.error("Etapa inexistente.");

            return;

        }

        container.innerHTML = page.render();

        if (typeof page.bindEvents === "function") {

            page.bindEvents();

        }

        this.updateButtons();

    }

    /**
     * ======================================================
     * Atualiza os botões
     * ======================================================
     */

    updateButtons() {

        const btnBack = document.getElementById("btnBack");

        const btnNext = document.getElementById("btnNext");

        btnBack.disabled = workflowController.isFirst();

        btnNext.textContent = workflowController.isLast()
            ? "Finalizar"
            : "Continuar";

    }

    /**
     * ======================================================
     * Eventos dos botões
     * ======================================================
     */

    bindEvents() {

        document
            .getElementById("btnBack")
            .addEventListener("click", () => {

                this.destroyCurrentStep();

                workflowController.back();

                this.render();

            });

        document
            .getElementById("btnNext")
            .addEventListener("click", () => {

                if (!this.validateCurrentStep()) {

                    return;

                }

                if (workflowController.isLast()) {

                    this.finish();

                    return;

                }

                this.destroyCurrentStep();

                workflowController.next();

                this.render();

            });

    }

    /**
     * ======================================================
     * Validação da etapa atual
     * ======================================================
     */

    validateCurrentStep() {

        const page = this.steps[workflowController.current()];

        if (
            page &&
            typeof page.validate === "function"
        ) {

            return page.validate();

        }

        return true;

    }

    /**
     * ======================================================
     * Libera recursos da etapa
     * ======================================================
     */

    destroyCurrentStep() {

        const page = this.steps[workflowController.current()];

        if (
            page &&
            typeof page.destroy === "function"
        ) {

            page.destroy();

        }

    }

    /**
     * ======================================================
     * Finalização
     * ======================================================
     */

    finish() {

        console.clear();

        console.log("===== DADOS DA RETIRADA =====");

        console.table(retiradaController.getDados());

        alert("Cautela finalizada com sucesso.");

        // Próximas versões:
        //
        // ✔ enviar para Google Apps Script
        // ✔ gerar PDF
        // ✔ salvar imagens
        // ✔ registrar protocolo
        // ✔ voltar para Home

    }

}

const retiradaPage = new RetiradaPage();

export default retiradaPage;