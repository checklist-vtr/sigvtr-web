# Controle da Guarda — Etapa 1

Versão do módulo: `0.1.0`.

Esta etapa prepara somente a fundação de dados do novo módulo. Não altera o comportamento dos checklists Condutor/Fiscal, autenticação administrativa, relatórios ou regras atuais de status das viaturas.

## Estruturas criadas

Ao executar `configurarControleGuardaEtapa1()` no Apps Script, são garantidas as abas:

- `MILITARES_GUARDA`
- `TURNOS_GUARDA`
- `MOVIMENTACOES_GUARDA`
- `TOKENS_GUARDA`

A base inicial contém 148 militares provenientes da base do Relatório de Viagem. CPF e RG são tratados como texto. Posto/Graduação, Nome de Guerra e OPM são completados progressivamente durante o uso.

## Viaturas

O Controle da Guarda consulta `VIATURAS` sem bloquear por status. O controle de disponibilidade é físico/operacional.

A opção `OUTROS` permitirá registrar Prefixo e Placa para viatura reserva/temporária ainda não cadastrada. O Prefixo é tratado como texto, preservando zeros à esquerda, por exemplo `092`. Essa operação não cria cadastro automático em `VIATURAS`.

## Instalação da Etapa 1

1. Adicionar `backend/Controle_Guarda.gs` ao projeto Apps Script.
2. Atualizar `Código.gs` com as quatro constantes de abas do módulo.
3. Salvar o projeto.
4. Executar manualmente `configurarControleGuardaEtapa1()` uma única vez e autorizar quando solicitado.
5. Conferir o retorno da função; na primeira execução, a expectativa é `base: 148`, `inseridos: 148`, `conflitos: 0`.
6. Executar `testarControleGuardaEtapa1()` e confirmar `success: true`.

A função de configuração é idempotente: uma nova execução não deve duplicar os 148 militares já importados.
