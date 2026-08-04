# ATUALIZAÇÃO — SIGVTR 1.13.6-rc1

## Objetivo
Corrigir a confirmação do envio do Checklist do Condutor, acelerar a Pesquisa Global e tornar o alerta em tempo real confiável.

## Frontend a substituir
- `index.html`
- `js/app.js`
- `sw.js`
- pasta `admin/` completa
- `README.md`, `CHANGELOG.md` e `ATUALIZACAO.md`

## Backend a substituir
- `Código.gs`
- `Complemento_Mobile_v4.gs`
- `Painel_Administrativo.gs`

Os demais arquivos do Apps Script permanecem sem alteração. Após salvar, publique uma nova versão da implantação existente.

## Testes essenciais
1. Enviar novo checklist e confirmar que a tela mostra sucesso mesmo se a resposta inicial oscilar.
2. Confirmar que o Dashboard mostra o novo alerta em modal central.
3. Pesquisar pelo prefixo completo, sem hífen e somente pelos quatro últimos dígitos.
4. Confirmar que os filtros não acumulam números repetidos.

Não limpar o banco nesta fase.
