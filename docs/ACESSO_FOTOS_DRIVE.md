# SIGVTR — Acesso às Fotografias no Google Drive

Versão: 1.20.2-RC1

## Objetivo

As fotografias registradas pelo SIGVTR devem poder ser visualizadas no Painel Administrativo sem exigir uma segunda autorização da conta Google.

A partir desta versão, cada nova fotografia recebe no Google Drive a permissão:

- Acesso: `ANYONE_WITH_LINK`
- Permissão: `VIEW`

As pastas do SIGVTR permanecem privadas. Apenas os arquivos fotográficos efetivamente criados pelo sistema recebem acesso por link.

## Fotos existentes

Após atualizar e implantar o backend, execute manualmente no editor do Apps Script a função:

`liberarAcessoFotosExistentesSIGVTR`

A rotina lê exclusivamente os links registrados na aba `FOTOS`, libera esses arquivos para visualização por link e atualiza o link armazenado quando houver `resourcekey` do Google Drive.

A função é idempotente e pode ser executada novamente sem duplicar registros.

## Observação de segurança

A autenticação do Painel Administrativo continua protegendo a navegação e a descoberta normal das fotografias. Entretanto, um arquivo configurado como `ANYONE_WITH_LINK / VIEW` pode ser aberto por qualquer pessoa que obtenha diretamente o link daquele arquivo, mesmo sem autenticação no SIGVTR.

Essa política é necessária para impedir que o Google Drive exija uma segunda autorização de conta ao visualizar as fotos pelo painel.

---

## Estado documental — Relatórios 2.3.2 (2026-08-18)

Este documento integra a documentação vigente do SIGVTR. Na versão Relatórios 2.3.2, a impressão/PDF do módulo administrativo passou a adotar fonte mínima de 10 pt na tabela e no cabeçalho, quebra controlada de texto e distribuição semântica de largura das colunas. A mudança é exclusivamente de apresentação do relatório: não altera os dados, regras de negócio, CSV, backend ou Google Apps Script.

Para implantação desta atualização, publicar os arquivos de frontend normalmente. O Service Worker administrativo foi versionado para renovar o cache; não é necessária nova implantação do Apps Script por causa desta correção de Relatórios.

