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


## Etapa 2 — painel operacional (v0.2.0)

- Nova rota `/controle-da-guarda/`, mobile-first.
- Reutiliza sessão administrativa existente; também permite login direto na rota usando o mesmo backend de autenticação.
- Um turno aberto é recuperado automaticamente; se não houver, o operador toca apenas em **Iniciar turno**.
- Seleção de VTR sem filtro de status.
- Opção **Outros — VTR reserva** com Prefixo e Placa; o prefixo permanece textual para preservar zeros à esquerda.
- Pesquisa de militar por RG, CPF, nome e nome de guerra.
- Cadastro/complementação progressiva de Posto/Graduação, Nome de Guerra e OPM.
- A seleção VTR + militar pode ser validada pelo backend e fica pronta para a geração do QR, que entra na Etapa 3.
- Nenhuma movimentação operacional é criada ainda nesta etapa.

## Etapa 3 — retirada, QR e confirmação do condutor (v0.3.0)

Implementada a criação da movimentação de retirada vinculada ao turno aberto, emissão de token opaco de uso único com validade de 10 minutos e geração de QR Code na tela da Guarda.

O QR contém somente a URL pública de confirmação com o token. Nome, RG, CPF, KM e demais dados pessoais não são gravados diretamente no QR.

A página pública `/controle-da-guarda/confirmar/` exibe apenas os dados necessários para o condutor reconhecer a operação: VTR, Posto/Graduação + Nome de Guerra e horário da solicitação. O único dado operacional digitado pelo condutor é o KM atual.

A confirmação valida token, expiração, uso anterior, status da movimentação e KM. Para VTR cadastrada, o último KM conhecido no SIGVTR é usado como referência e a regra existente de `Math.max` continua sendo utilizada ao atualizar `KM Atual`. Para VTR `OUTROS`, não é criado cadastro automático na aba `VIATURAS`.

Enquanto o QR estiver aberto, a tela da Guarda consulta apenas aquela movimentação em intervalo leve de 5 segundos. Ao confirmar, o polling é encerrado e a Guarda recebe a confirmação automaticamente.

Se o QR expirar, o operador pode gerar novamente para a mesma retirada pendente; o token anterior é invalidado e um novo token é emitido sem duplicar a movimentação.
