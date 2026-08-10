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
