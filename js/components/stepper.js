/**
 * ==========================================================
 * SIGVTR
 * Sistema Integrado de Gestão de Viaturas
 * ----------------------------------------------------------
 * Componente Stepper
 * Exibe o progresso da cautela.
 * ==========================================================
 */

class Stepper {

    render(info) {

        const porcentagem = info.progresso;

        return `

            <section class="stepper">

                <div class="stepper-header">

                    <span class="step-number">
                        Etapa ${info.etapa} de ${info.total}
                    </span>

                    <span class="step-title">
                        ${info.nome}
                    </span>

                </div>

                <div class="step-progress">

                    <div
                        class="step-progress-bar"
                        style="width:${porcentagem}%">
                    </div>

                </div>

            </section>

        `;

    }

}

const stepper = new Stepper();

export default stepper;