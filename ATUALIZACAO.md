## Entrega 06 — Correção definitiva do tipo Fiscal e cache administrativo

- Corrigido o payload do Checklist do Fiscal para enviar explicitamente `tipoChecklist: "FISCAL"`.
- Pesquisa Global, Dashboard, Checklists e Histórico passam a resolver o tipo por `Tipo Checklist`, `Tipo_Retirada` ou `ITENS_JSON`.
- Atualizado o Service Worker administrativo para liberar a tela nova de revisão preventiva em Viaturas.
- Checklist do Condutor permanece inalterado.

# ATUALIZAÇÃO — v1.19.4-RC1

## Entrega 05 — Controle administrativo de revisão

No módulo **Viaturas**, abra **Editar cadastro** para definir ou alterar:

- Próxima revisão (km);
- Alerta antecipado (km), por exemplo, alterar de 1.000 para 200.

No prontuário da viatura, o botão **Registrar revisão realizada** encerra o ciclo anterior, resolve os alertas vinculados e exige a configuração da próxima revisão.

Fluxo adotado:

1. PROGRAMADA: fora da faixa de alerta;
2. ALERTA: entrou na antecedência configurada;
3. ATINGIDA: KM atual igual ao KM da revisão;
4. VENCIDA: KM atual maior que o KM da revisão e permanece assim até a baixa administrativa.

Não foram criados níveis adicionais.

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
