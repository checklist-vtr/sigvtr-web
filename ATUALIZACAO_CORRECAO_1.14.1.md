# ATUALIZAÇÃO CORRETIVA — PAINEL ADMINISTRATIVO v1.14.1

## Correções
- Remoção do título `Pilares do SIGVTR` no Dashboard.
- Correção do erro JavaScript `prefixo is not defined` no Histórico por Viatura.
- Atualização do cache PWA para `sigvtr-admin-v1141`.

## Arquivos do frontend a substituir
1. `admin/index.html`
2. `admin/historico-viatura.html`
3. `admin/assets/js/historico-viatura.js`
4. `admin/sw.js`
5. `CHANGELOG.md`
6. `ATUALIZACAO_CORRECAO_1.14.1.md`

## Backend
Nenhum arquivo `.gs` precisa ser alterado ou implantado nesta correção.

## Commit
### Summary
`fix(admin): corrigir pesquisa do histórico e título do dashboard`

### Description
`Corrige a referência da variável prefixo na pesquisa do Histórico por Viatura, elimina o erro prefixo is not defined, remove o título redundante Pilares do SIGVTR do Dashboard e atualiza o cache PWA do painel para carregar os arquivos corrigidos.`
