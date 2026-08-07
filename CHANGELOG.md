## v1.19.5-RC1 — Correção de identificação do Fiscal e atualização de cache

## 1.20.1-RC1 — Autenticação: desempenho seguro e logout visível

- Mantém integralmente o KDF de senhas com 4096 iterações, salt individual e pepper em Script Properties.
- Otimiza buscas de usuários e sessões para leitura apenas da linha necessária.
- Evita gravação de `ULTIMA_ATIVIDADE` a cada requisição, mantendo timeout de 30 minutos de forma conservadora.
- Retira o cálculo de senha de dentro do `ScriptLock`, preservando controle de concorrência na atualização de falhas/bloqueios.
- Otimiza a conversão hexadecimal do KDF sem alterar os hashes já existentes.
- Mantém nova e antiga senha com KDF completo durante a troca de senha.
- Adiciona botão **Sair** visível na barra superior, além da opção já existente no rodapé lateral.
- Oficializa no código versionado os wrappers manuais de configuração inicial do Apps Script.
- Nenhuma alteração nos módulos Condutor e Fiscal.

- Corrigido o payload do Checklist do Fiscal para enviar explicitamente `tipoChecklist: "FISCAL"`.
- Pesquisa Global, Dashboard, Checklists e Histórico passam a resolver o tipo por `Tipo Checklist`, `Tipo_Retirada` ou `ITENS_JSON`.
- Atualizado o Service Worker administrativo para liberar a tela nova de revisão preventiva em Viaturas.
- Checklist do Condutor permanece inalterado.

## v1.19.4-RC1 — Branch 02 — Entrega 05

- Adiciona edição da próxima revisão e da antecedência do alerta no cadastro individual da viatura.
- Define 200 km como sugestão inicial, mantendo o valor totalmente editável pela Administração.
- Implementa estados PROGRAMADA, ALERTA, ATINGIDA e VENCIDA, sem níveis intermediários.
- Gera um alerta preventivo na faixa configurada e um alerta de limite ao atingir/ultrapassar a revisão.
- Mantém a revisão vencida até o registro administrativo da realização.
- Adiciona ação “Registrar revisão realizada”, resolve os alertas anteriores e inicia novo ciclo.
- Preserva integralmente os Checklists do Condutor e do Fiscal.

# CHANGELOG

## v1.19.2-RC1 — Branch 02 — Entrega 03

- Corrige a Pesquisa Global para reconhecer checklists do Fiscal a partir de `Tipo Checklist`, `Tipo_Retirada` ou `ITENS_JSON`.
- Renova a chave de cache da Pesquisa Global para impedir reaproveitamento do índice anterior.
- Consolida a origem `CONDUTOR/FISCAL` na consulta e no prontuário de avarias.
- Permite pesquisar avarias pelos termos `Fiscal`, `Condutor`, `FISCAL` e `CONDUTOR`.
- Atualiza o cache do PWA administrativo.
- Mantém o Checklist do Condutor e o Checklist do Fiscal sem alterações.

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


## v1.19.6-RC1 — Entrega 07

- O Checklist do Fiscal passa a usar a rota exclusiva `salvarChecklistFiscal`.
- O backend força `FISCAL` nessa rota, independentemente do nome, RG ou função anterior do militar.
- A resposta do backend informa `tipoChecklist` e `backendVersion` para diagnóstico.
- A tela de Viaturas injeta os campos de revisão pelo JavaScript quando uma cópia HTML antiga estiver em cache.
- Cache Fiscal e Administrativo atualizado para v1.19.6-RC1.
