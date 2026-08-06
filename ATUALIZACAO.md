# ATUALIZAÇÃO — v1.19.3-RC1

## Branch 02 — Checklist do Fiscal — Entrega 04

Esta entrega consolida as pendências da Pesquisa Global e da Gestão de Avarias e adiciona o controle administrativo de próxima revisão por quilometragem.

### Arquivos alterados

- `backend/Painel_Administrativo.gs`
- `admin/viaturas.html`
- `admin/assets/js/viaturas.js`
- `admin/assets/js/avarias.js`
- `admin/avarias.html`
- `admin/busca-global.html`
- `admin/sw.js`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

### Apps Script

Substituir somente `Painel_Administrativo.gs` e publicar a versão `SIGVTR v1.19.3-RC1 — Branch 02 — Revisões e consolidação da pesquisa — Entrega 04`.

### Banco de dados

O sistema acrescenta automaticamente as colunas `Próxima Revisão KM` e `Antecedência Alerta KM` à aba `VIATURAS`, além de `Antecedência Alerta KM` à aba `REVISOES`. Não criar nova planilha.

# ATUALIZAÇÃO — v1.19.2-RC1

## Branch 02 — Checklist do Fiscal — Entrega 03

Esta entrega corrige a ausência dos registros do Fiscal na Pesquisa Global e consolida a identificação da origem das avarias. O backend agora identifica o tipo de checklist de forma retrocompatível usando a coluna `Tipo Checklist`, o campo `Tipo_Retirada` ou o conteúdo de `ITENS_JSON`.

### Arquivos alterados

- `backend/Painel_Administrativo.gs`
- `admin/assets/js/avarias.js`
- `admin/sw.js`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

### Apps Script

Substituir somente `Painel_Administrativo.gs` e publicar uma nova versão com o título: `SIGVTR v1.19.2-RC1 — Branch 02 — Checklist do Fiscal — Entrega 03`.

# ATUALIZAÇÃO — SIGVTR 1.19.1-RC1

## Branch 02 — Checklist do Fiscal — Entrega 02

### Situação

A Entrega 01 foi validada operacionalmente. O Checklist do Fiscal envia registros, fotografias e avarias utilizando a mesma arquitetura do Checklist do Condutor.

### Implementado nesta entrega

- filtro Todos/Condutor/Fiscal no módulo Checklists;
- filtro processado pelo backend, sem uso de dados locais como fonte principal;
- Pesquisa Global preparada para localizar `FISCAL`, `CONDUTOR`, `Fiscal` e `Condutor`;
- links da Pesquisa Global abrem o módulo Checklists com o tipo correspondente;
- novos alertas armazenam `Tipo Checklist`;
- linha do tempo administrativa identifica a origem do checklist;
- compatibilidade retroativa preservada para registros antigos;
- cache do Painel Administrativo atualizado para a nova versão.

### Arquivos do Condutor

Os arquivos `index.html`, `css/style.css`, `js/app.js`, `manifest.json` e `sw.js` da raiz não foram alterados.

### Próxima etapa

Validar os filtros e a Pesquisa Global em ambiente publicado. Após aprovação, revisar a apresentação da origem nas avarias e consolidar os testes finais multiplataforma da Branch 02.
