/**
 * ==========================================================
 * SIGVTR
 * Sistema Integrado de Gestão de Viaturas
 * ----------------------------------------------------------
 * Controller responsável por controlar a navegação
 * entre as etapas da cautela.
 * ==========================================================
 */

class WorkflowController {

    constructor() {

        this.totalEtapas = 7;

        this.etapaAtual = 1;

    }

    /**
     * Reinicia o fluxo.
     */
    reset() {

        this.etapaAtual = 1;

    }

    /**
     * Avança para a próxima etapa.
     */
    next() {

        if (this.etapaAtual < this.totalEtapas) {

            this.etapaAtual++;

        }

        return this.etapaAtual;

    }

    /**
     * Retorna para a etapa anterior.
     */
    back() {

        if (this.etapaAtual > 1) {

            this.etapaAtual--;

        }

        return this.etapaAtual;

    }

    /**
     * Vai diretamente para uma etapa.
     */
    goTo(etapa) {

        if (
            Number.isInteger(etapa) &&
            etapa >= 1 &&
            etapa <= this.totalEtapas
        ) {

            this.etapaAtual = etapa;

        }

        return this.etapaAtual;

    }

    /**
     * Retorna a etapa atual.
     */
    current() {

        return this.etapaAtual;

    }

    /**
     * Total de etapas.
     */
    total() {

        return this.totalEtapas;

    }

    /**
     * Primeira etapa?
     */
    isFirst() {

        return this.etapaAtual === 1;

    }

    /**
     * Última etapa?
     */
    isLast() {

        return this.etapaAtual === this.totalEtapas;

    }

    /**
     * Percentual do progresso.
     */
    progress() {

        return Math.round(
            (this.etapaAtual / this.totalEtapas) * 100
        );

    }

    /**
     * Nome da etapa.
     */
    getStepName() {

        const etapas = {

            1: "Identificação",

            2: "Viatura",

            3: "Fotos",

            4: "Checklist",

            5: "Observações",

            6: "Revisão",

            7: "Finalização"

        };

        return etapas[this.etapaAtual];

    }

    /**
     * Todas as informações da etapa atual.
     */
    getInfo() {

        return {

            etapa: this.etapaAtual,

            total: this.totalEtapas,

            nome: this.getStepName(),

            progresso: this.progress(),

            primeira: this.isFirst(),

            ultima: this.isLast()

        };

    }

}

const workflowController = new WorkflowController();

export default workflowController;