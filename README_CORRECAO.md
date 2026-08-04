# SIGVTR — Correção v1.14.2

Correção da Etapa 3 para visualização das fotografias e exportação institucional em PDF.

## Arquivos alterados

Frontend:
- `admin/historico-viatura.html`
- `admin/assets/js/historico-viatura.js`
- `admin/assets/css/prontuario.css`
- `admin/sw.js`

Backend:
- `Painel_Administrativo.gs`

## Principais mudanças

- Card **Fotos** passa a abrir diretamente a aba de fotografias.
- Fotografias reais são exibidas como miniaturas.
- Clique na foto abre visualização ampliada em modal.
- Mantido botão para abrir o arquivo original no Drive.
- Backend normaliza os campos da aba `FOTOS` e gera URL de miniatura.
- Impressão/PDF preserva cores institucionais e inclui as fotografias.
- Cache PWA atualizado para `sigvtr-admin-v1142`.

## Observação sobre permissões

A pré-visualização depende de a conta autenticada no navegador possuir acesso aos arquivos do Drive. Não foi aplicada alteração pública automática às permissões dos arquivos.
