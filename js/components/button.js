/**
 * =====================================================
 * SIGVTR
 * Componente: Button
 * =====================================================
 */

function Button({
    text = "",
    icon = "",
    variant = "primary",
    type = "button",
    id = "",
    disabled = false,
    fullWidth = false
} = {}) {

    return `
        <button
            ${id ? `id="${id}"` : ""}
            type="${type}"
            class="btn btn--${variant} ${fullWidth ? "btn--full" : ""}"
            ${disabled ? "disabled" : ""}
        >
            ${icon ? `<span class="btn__icon">${icon}</span>` : ""}
            <span class="btn__text">${text}</span>
        </button>
    `;

}