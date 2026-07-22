/**
 * ==========================================================
 * SIGVTR
 * Sistema Integrado de Gestão de Viaturas
 * ----------------------------------------------------------
 * Controller responsável por armazenar e gerenciar
 * todos os dados da cautela.
 * ==========================================================
 */

class RetiradaController {

    constructor() {

        this.reset();

    }

    /**
     * ======================================================
     * Reinicia a cautela
     * ======================================================
     */

    reset() {

        this.cautela = {

            protocolo: "",

            dataHora: "",

            militar: {

                rg: "",

                nome: "",

                nomeGuerra: "",

                posto: "",

                opm: ""

            },

            viatura: {

                prefixo: "",

                placa: "",

                modelo: ""

            },

            fotos: {

                odometro: this.criarFoto(),

                frente: this.criarFoto(),

                lateralDireita: this.criarFoto(),

                traseira: this.criarFoto(),

                lateralEsquerda: this.criarFoto()

            },

            checklist: {},

            observacoes: "",

            confirmacao: false

        };

    }

    /**
     * ======================================================
     * Modelo de Foto
     * ======================================================
     */

    criarFoto() {

        return {

            nome: "",

            imagem: "",

            mimeType: "",

            tamanho: 0,

            largura: 0,

            altura: 0,

            dataHora: ""

        };

    }

    /* ======================================================
       MILITAR
    ====================================================== */

    setMilitar(dados) {

        this.cautela.militar = {

            ...this.cautela.militar,

            ...dados

        };

    }

    getMilitar() {

        return this.cautela.militar;

    }

    /* ======================================================
       VIATURA
    ====================================================== */

    setViatura(dados) {

        this.cautela.viatura = {

            ...this.cautela.viatura,

            ...dados

        };

    }

    getViatura() {

        return this.cautela.viatura;

    }

    /* ======================================================
       FOTOS
    ====================================================== */

    setFoto(tipo, dados) {

        if (!(tipo in this.cautela.fotos)) {

            throw new Error(`Foto inválida: ${tipo}`);

        }

        this.cautela.fotos[tipo] = {

            ...this.cautela.fotos[tipo],

            ...dados

        };

    }

    getFoto(tipo) {

        return this.cautela.fotos[tipo];

    }

    getFotos() {

        return this.cautela.fotos;

    }

    removerFoto(tipo) {

        if (!(tipo in this.cautela.fotos)) {

            return;

        }

        this.cautela.fotos[tipo] = this.criarFoto();

    }

    fotosCompletas() {

        return Object.values(this.cautela.fotos)

            .every(

                foto => foto.imagem !== ""

            );

    }

    /* ======================================================
       CHECKLIST
    ====================================================== */

    setChecklist(item, valor) {

        this.cautela.checklist[item] = valor;

    }

    getChecklist() {

        return this.cautela.checklist;

    }

    checklistCompleto(totalItens) {

        return (

            Object.keys(

                this.cautela.checklist

            ).length === totalItens

        );

    }

    /* ======================================================
       OBSERVAÇÕES
    ====================================================== */

    setObservacoes(texto) {

        this.cautela.observacoes = texto.trim();

    }

    getObservacoes() {

        return this.cautela.observacoes;

    }

    /* ======================================================
       CONFIRMAÇÃO
    ====================================================== */

    confirmar(valor = true) {

        this.cautela.confirmacao = valor;

    }

    confirmado() {

        return this.cautela.confirmacao;

    }

    /* ======================================================
       PROTOCOLO
    ====================================================== */

    setProtocolo(protocolo) {

        this.cautela.protocolo = protocolo;

    }

    getProtocolo() {

        return this.cautela.protocolo;

    }

    /* ======================================================
       DATA
    ====================================================== */

    setDataHora(dataHora) {

        this.cautela.dataHora = dataHora;

    }

    getDataHora() {

        return this.cautela.dataHora;

    }

    /* ======================================================
       EXPORTAÇÃO
    ====================================================== */

    getDados() {

        return structuredClone(

            this.cautela

        );

    }

    /* ======================================================
       VALIDAÇÃO
    ====================================================== */

    podeFinalizar(totalItensChecklist) {

        return (

            this.cautela.militar.rg !== "" &&

            this.cautela.viatura.prefixo !== "" &&

            this.fotosCompletas() &&

            this.checklistCompleto(totalItensChecklist) &&

            this.confirmado()

        );

    }

}

const retiradaController = new RetiradaController();

export default retiradaController;