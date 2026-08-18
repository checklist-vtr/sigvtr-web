# Prontuário Digital da Viatura — SIGVTR

## Versão 1.6

O prontuário agora permite editar:

- prefixo;
- placa;
- ano;
- marca;
- modelo;
- companhia;
- quilometragem;
- combustível;
- situação;
- observações administrativas.

As alterações são compartilhadas com a Gestão de Viaturas por meio do `sessionStorage`.

O prontuário também passa a ler as avarias salvas pela Gestão de Avarias, mantendo os indicadores e a aba de ocorrências sincronizados durante a sessão.

---

## Estado documental — Relatórios 2.3.2 (2026-08-18)

Este documento integra a documentação vigente do SIGVTR. Na versão Relatórios 2.3.2, a impressão/PDF do módulo administrativo passou a adotar fonte mínima de 10 pt na tabela e no cabeçalho, quebra controlada de texto e distribuição semântica de largura das colunas. A mudança é exclusivamente de apresentação do relatório: não altera os dados, regras de negócio, CSV, backend ou Google Apps Script.

Para implantação desta atualização, publicar os arquivos de frontend normalmente. O Service Worker administrativo foi versionado para renovar o cache; não é necessária nova implantação do Apps Script por causa desta correção de Relatórios.

