/**
 * =====================================================
 * SIGVTR
 * Componente: Card
 * =====================================================
 */

function Card({
    title = "",
    content = "",
    footer = ""
} = {}) {

    return `
        <section class="card">

            ${title ? `<h2 class="card__title">${title}</h2>` : ""}

            <div class="card__body">
                ${content}
            </div>

            ${footer ? `
                <div class="card__footer">
                    ${footer}
                </div>
            ` : ""}

        </section>
    `;

}