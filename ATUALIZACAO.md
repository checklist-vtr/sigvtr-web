# ATUALIZAÇÃO — SIGVTR PAINEL ADMINISTRATIVO

## Versão atual

- Painel Administrativo: **1.16.1**
- Backend: **1.9.20**
- Etapa: **5 — Gestão de Avarias**
- Data: **04/08/2026**

## Objetivo desta atualização

Ativar a navegação pelos cards de situação da Gestão de Avarias e consolidar a documentação existente na raiz do repositório.

## Arquivos alterados

- `admin/avarias.html`
- `admin/assets/js/avarias.js`
- `admin/assets/css/avarias.css`
- `admin/sw.js`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

## Arquivos antigos removidos da raiz

- `README_CORRECAO.md`
- `README_ETAPA5.md`
- `README-FAVICON.md`
- `CHANGELOG_v1.14.2.md`
- `CHANGELOG_v1.14.3.md`
- `ATUALIZACAO_CORRECAO_1.14.1.md`
- `ATUALIZACAO_ETAPA5.md`
- `ATUALIZACAO_v1.14.2.md`

## Comportamento dos cards

- **Abertas:** Pendente + Em manutenção.
- **Pendentes:** apenas Pendente.
- **Em manutenção:** apenas Em manutenção.
- **Resolvidas:** apenas Resolvida.
- **Arquivadas:** apenas Arquivada.

O campo Situação acompanha o card selecionado. O botão Limpar filtros remove a seleção e retorna à exibição de todas as ocorrências.

## Publicação

1. Substituir os quatro arquivos do frontend listados acima.
2. Atualizar os três documentos consolidados da raiz.
3. Excluir os arquivos antigos listados.
4. Conferir as alterações no GitHub Desktop.
5. Fazer commit e `Push origin`.
6. Aguardar o GitHub Pages.
7. Limpar o Service Worker e os dados do site.
8. Reabrir a página com `Ctrl + Shift + R`.

Não há alteração no backend e não é necessária nova implantação do Google Apps Script.

## Commit

### Summary

`fix(admin): ativar filtros pelos cards de avarias`

### Description

`Transforma os indicadores da Gestão de Avarias em filtros rápidos, sincroniza os cards com o campo Situação, adiciona o agrupamento Abertas, destaca a seleção ativa e retorna a paginação à primeira página. Consolida a documentação da raiz em README.md, CHANGELOG.md e ATUALIZACAO.md e atualiza o cache PWA para a versão 1.16.1.`

## Testes

1. Clicar em Abertas e confirmar Pendente + Em manutenção.
2. Clicar em Pendentes, Em manutenção, Resolvidas e Arquivadas.
3. Confirmar que o seletor Situação acompanha o card.
4. Usar Limpar filtros e confirmar retorno para Todas.
5. Testar acionamento dos cards com Tab e Enter.
6. Confirmar que prontuário, fotos, exportação e atualização administrativa continuam funcionando.
