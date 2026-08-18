# Painel Administrativo — Arquitetura Inicial

## Responsabilidades

O módulo administrativo será responsável por visualização gerencial, gestão de viaturas, análise de checklists, usuários, avarias, relatórios e configurações.

## Separação de responsabilidades

- `admin.js`: inicialização e renderização da interface
- `menu.js`: comportamento da navegação lateral
- `auth.js`: sessão e autenticação
- `api.js`: comunicação centralizada com o backend
- `admin.css`: estrutura geral do painel
- `dashboard.css`: elementos exclusivos do dashboard

## Impacto em outros módulos

Nenhum arquivo do Checklist Mobile foi alterado.

A integração com o backend existente será planejada em etapa posterior e deverá preservar compatibilidade com o fluxo atual.

---

## Estado documental — Relatórios 2.3.2 (2026-08-18)

Este documento integra a documentação vigente do SIGVTR. Na versão Relatórios 2.3.2, a impressão/PDF do módulo administrativo passou a adotar fonte mínima de 10 pt na tabela e no cabeçalho, quebra controlada de texto e distribuição semântica de largura das colunas. A mudança é exclusivamente de apresentação do relatório: não altera os dados, regras de negócio, CSV, backend ou Google Apps Script.

Para implantação desta atualização, publicar os arquivos de frontend normalmente. O Service Worker administrativo foi versionado para renovar o cache; não é necessária nova implantação do Apps Script por causa desta correção de Relatórios.

