/**
 * =====================================================
 * SIGVTR
 * Utilitários
 * =====================================================
 */

const Utils = {

    formatDate(date) {

        return new Intl.DateTimeFormat("pt-BR").format(date);

    },

    generateId(prefix) {

        return `${prefix}${Date.now()}`;

    }

};