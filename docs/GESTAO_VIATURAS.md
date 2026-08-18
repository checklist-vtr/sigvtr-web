# Gestão de Viaturas — SIGVTR

## Objetivo

Permitir ao Administrador cadastrar, editar, pesquisar e consultar viaturas da OPM.

## Recursos da versão v1.5

- indicadores da frota;
- pesquisa por prefixo, placa, marca ou modelo;
- filtros por situação, companhia e avarias;
- ordenação;
- cadastro de nova viatura;
- edição de dados;
- prevenção de prefixo ou placa duplicados;
- acesso direto ao Prontuário Digital.

## Situações administrativas

- Ativa
- Em manutenção
- Reserva
- Inativa

Essas situações são informativas. Uma avaria isolada não bloqueia automaticamente a viatura.

## Persistência

Nesta etapa, os cadastros e alterações são armazenados em `sessionStorage`. A integração definitiva será feita com Google Apps Script e Google Sheets.

---

## Estado documental — Relatórios 2.3.2 (2026-08-18)

Este documento integra a documentação vigente do SIGVTR. Na versão Relatórios 2.3.2, a impressão/PDF do módulo administrativo passou a adotar fonte mínima de 10 pt na tabela e no cabeçalho, quebra controlada de texto e distribuição semântica de largura das colunas. A mudança é exclusivamente de apresentação do relatório: não altera os dados, regras de negócio, CSV, backend ou Google Apps Script.

Para implantação desta atualização, publicar os arquivos de frontend normalmente. O Service Worker administrativo foi versionado para renovar o cache; não é necessária nova implantação do Apps Script por causa desta correção de Relatórios.

