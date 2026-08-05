# CHANGELOG


## [1.19.1-RC1] — Branch 02 — Checklist do Fiscal — Entrega 02

- Adiciona filtro por tipo no módulo Checklists.
- Renomeia apenas os rótulos administrativos necessários para atender Condutor e Fiscal.
- Integra `tipoChecklist` aos parâmetros da API administrativa.
- Inclui a origem do checklist na Pesquisa Global.
- Registra `Tipo Checklist` nos novos alertas administrativos.
- Identifica a origem na linha do tempo global e no histórico da viatura.
- Mantém registros antigos como `CONDUTOR`.
- Não altera os arquivos homologados do Checklist do Condutor.


## 1.18.0-RC1 — Gestão de Viaturas

- Corrige ordenação de prefixos numéricos e alfanuméricos.
- Implementa cadastro mestre persistente no Google Sheets.
- Permite cadastro incompleto de viaturas reserva.
- Adiciona importação controlada das 21 viaturas oficiais.
- Adiciona placa, chassi, motor, RENAVAM, marca, modelo, ano, tipo, lotação e KM administrativo.
- Torna os cards da frota filtros rápidos.
- Padroniza o rodapé com o e-mail institucional.
- Mantém o Checklist do Condutor sem alterações.

## 1.18.1-RC1 — Rodapé institucional e atualização em massa

- Padroniza o rodapé do Checklist do Condutor e de todas as páginas administrativas.
- Adiciona e-mail clicável para sugestões, dúvidas e melhorias.
- Exibe a versão atual no rodapé.
- Substitui a ação isolada de importação por um menu de ações em massa.
- Adiciona seleção individual e seleção das viaturas filtradas.
- Permite atualizar em massa marca, modelo, ano, combustível, tipo, lotação, situação e observações.
- Bloqueia alterações coletivas de prefixo, placa, chassi, motor, RENAVAM e quilometragem.
- Registra cada viatura atualizada na auditoria da aba LOGS.
- Mantém o fluxo operacional do Checklist do Condutor sem alterações.

## [1.19.0-RC1] — Branch 02 — Checklist do Fiscal

- Criado frontend independente do Checklist do Fiscal em `/fiscal/`.
- Mantido o Checklist do Condutor sem alterações.
- Adicionada identificação `FISCAL`/`CONDUTOR` no backend, com compatibilidade retroativa.
- Integrada a origem do checklist à listagem e ao detalhamento administrativo.
- Alertas e histórico passam a identificar o Checklist do Fiscal.
