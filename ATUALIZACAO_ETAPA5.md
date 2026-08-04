# ATUALIZAÇÃO — ETAPA 5 — GESTÃO DE AVARIAS

Versão do Painel: 1.16.0  
Versão do backend: 1.9.20

## Frontend alterado
- admin/avarias.html
- admin/assets/js/avarias.js
- admin/assets/css/avarias.css
- admin/assets/js/api.js
- admin/sw.js

## Backend alterado
- Código.gs
- Painel_Administrativo.gs
- Complemento_Mobile_v4.gs

## Publicação
1. Substituir os arquivos do frontend.
2. Commit e Push no GitHub Desktop.
3. Substituir os três arquivos no Apps Script.
4. Editar a implantação existente e selecionar Nova versão.
5. Limpar Service Worker e dados do site.
6. Recarregar com Ctrl+Shift+R.

## Segurança
A opção Excluir realiza exclusão lógica. A linha da avaria não é removida da planilha.
