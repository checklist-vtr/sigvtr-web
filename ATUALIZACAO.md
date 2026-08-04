# ATUALIZAÇÃO — SIGVTR 1.13.5-rc1

## Objetivo

Integrar a Pesquisa Global ao banco real do SIGVTR e permitir consulta unificada por viatura, prefixo, placa, condutor, RG, protocolo, checklist, avaria e alerta.

## Frontend alterado

- `admin/busca-global.html`
- `admin/index.html`
- `admin/assets/js/busca-global.js`
- `admin/assets/js/checklists-admin.js`
- `admin/assets/js/alertas.js`
- `admin/assets/css/admin.css`
- `admin/assets/js/admin.js`
- `admin/assets/js/api.js`
- `admin/sw.js`
- arquivos administrativos com atualização de versão do cache.

## Backend alterado

- `backend/Código.gs`
- `backend/Painel_Administrativo.gs`

O backend permanece com somente um `doGet()` e um `doPost()`.

## Publicação

1. Substitua a pasta `admin/` no frontend.
2. Substitua `Código.gs` e `Painel_Administrativo.gs` no Apps Script.
3. Salve o Apps Script e publique uma nova versão da implantação atual.
4. Faça commit e Push pelo GitHub Desktop.
5. Aguarde o GitHub Pages e use “Esvaziar cache e recarregamento forçado”.

## Testes

- Pesquisar prefixo completo e parcial.
- Pesquisar nome de guerra e posto/graduação.
- Pesquisar RG e protocolo.
- Pesquisar descrição de avaria.
- Alternar os filtros por tipo.
- Abrir um resultado e confirmar o encaminhamento para a página correspondente.
- Confirmar estado vazio quando não houver resultados.
