# Changelog

## Relatórios 2.3 — Modernização visual e acessibilidade

- Aumentada a tipografia base da página de Relatórios para melhorar a leitura.
- Títulos, subtítulos, labels, campos, botões e seletores de colunas receberam hierarquia visual mais clara.
- Cards do Resumo da Frota passaram a destacar melhor números e rótulos.
- Tabela do relatório ganhou maior espaçamento de linhas, cabeçalho mais legível e hover discreto em desktop.
- Campos e botões possuem áreas clicáveis maiores e foco visível para navegação por teclado.
- Responsividade refinada para tablet e celular.
- Impressão/PDF recebeu ajustes próprios de tipografia e densidade sem alterar os dados exportados.
- Nenhuma regra de negócio, consulta, API ou backend foi alterado nesta etapa.

## Relatórios 2.2 — Cartões vinculados e Assistente IA consultando Relatórios 2.x

- Adiciona a coluna opcional **Cartões vinculados** aos relatórios de Checklists, Frota, Combustível e Quilometragem/Revisões.
- Relaciona cartões às viaturas usando o vínculo real já existente em `CARTOES` (`ID_VTR` e, como compatibilidade, prefixo).
- Mantém o relatório específico **Cartões** e as colunas de cartão do **Relatório Personalizado**.
- O Assistente SIGVTR IA passa a consultar `getAdminReportsV2_()` conforme o assunto da pergunta, reutilizando a mesma fonte somente leitura do módulo Relatórios.
- Adiciona classificação específica de perguntas sobre **Frota** e **Cartões**, evitando confundir “viatura reserva” ou “cartão reserva” com nível de combustível `RESERVA`.
- O Assistente passa a receber status da frota, Data do Status, observações, cartões vinculados, revisões, checklists, combustível e avarias conforme a categoria solicitada.
- Perguntas gerais recebem uma consolidação controlada dos principais relatórios, respeitando o limite de contexto da integração Groq.
- Nenhuma operação de escrita foi adicionada ao Assistente; a IA permanece estritamente consultiva.

## Relatórios 2.1.1 — Status temporários no Resumo da Frota

- O Resumo da Frota passa a exibir **Indisponíveis** e **Em manutenção**, além dos totais já existentes.
- O status `INDISPONIVEL`, já suportado pelo cadastro de Viaturas, é contado diretamente no resumo do relatório, inclusive quando usado para afastamentos temporários como viagens.
- Mantidos os filtros, Data do Status, observações, regras de reserva e demais funcionalidades do Relatórios 2.1.
- Nenhuma alteração no fluxo dos Checklists Condutor/Fiscal ou nos demais módulos administrativos.

## 1.20.4-RC1 — Ajustes do módulo Cartões e navegação administrativa

- Corrige a estrutura da página `admin/cartoes.html` para usar o mesmo shell do Painel Administrativo, eliminando sobreposição do conteúdo com a sidebar no desktop.
- Adiciona controle para recolher/expandir a sidebar do Painel Administrativo em navegadores desktop, preservando o comportamento mobile existente.
- Configura o botão “Consultar na Ticket Log” para abrir o site oficial `https://www.ticketlog.com.br/` em nova aba.
- Adiciona botão de copiar ao lado do número de cada cartão, com feedback visual e fallback compatível.
- Ajusta a grade responsiva de cartões para até 4 colunas no desktop.
- Atualiza o cache administrativo/PWA para `v1204rc1`.
- Checklist Condutor e Checklist Fiscal permanecem inalterados.

## 1.20.3-RC1 — Módulo Cartões de Abastecimento

- Adicionada a nova página administrativa `admin/cartoes.html`.
- Adicionados cards visuais responsivos para cartões TITULAR e RESERVA, com pesquisa e filtros.
- Adicionado cadastro/edição com prevenção de duplicidade no backend e sem exclusão física.
- Criada a aba lógica `CARTOES`, independente de `VIATURAS`, com auditoria de criação/alteração.
- Adicionadas permissões backend para CMD, SUBCMD, FISCAL e DEV no módulo Cartões.
- Incluída a função idempotente `bootstrapCartoesTitulares()` com os 21 cartões do documento oficial fornecido.
- Preparada a interface para futura URL/API oficial da Ticket Log, sem scraping, CPF ou saldo fictício.
- Atualizado o cache administrativo/PWA para incluir o novo módulo.
- Checklist Condutor e Checklist Fiscal não foram alterados.

## 1.20.2-RC1 — Acesso às fotografias do SIGVTR

- Novas fotografias passam a ser compartilhadas automaticamente como `ANYONE_WITH_LINK / VIEW` no Google Drive.
- Mantém as pastas do SIGVTR privadas; somente os arquivos fotográficos registrados recebem acesso por link.
- Preserva `resourcekey` do Google Drive nos links quando exigida pela política de segurança do Drive.
- Corrige a URL de miniaturas do Painel Administrativo para encaminhar a `resourcekey` quando existente.
- Adiciona a rotina manual e idempotente `liberarAcessoFotosExistentesSIGVTR()` para corrigir somente fotos já indexadas na aba `FOTOS`.
- A rotina não percorre indiscriminadamente a pasta raiz e não altera outros documentos do Drive.
- Nenhuma alteração visual ou funcional nos checklists Condutor/Fiscal.

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


## Relatórios 2.1 — Resumo da Frota e Data do Status
- Adicionado resumo dinâmico da frota com totais de VTRs, ativas, baixadas, reservas e baixadas com/sem reserva disponibilizada.
- Adicionado campo **Data do Status** à estrutura de VIATURAS, preenchido automaticamente quando o status é alterado.
- Registros históricos sem data permanecem sem data informada; nenhuma data retroativa é inventada.
- Data do Status disponível nos relatórios Frota e Personalizado.


## Relatórios 2.3.1 — Refinamento visual e fluxo de exportação
- Reposiciona **Exportar CSV** e **Imprimir / Salvar PDF** junto ao botão **Gerar relatório**, acompanhando o fluxo natural de uso.
- Mantém CSV e PDF desabilitados até existir um relatório gerado.
- Reduz a dominância visual das ações de exportação no cabeçalho.
- Compacta discretamente o bloco de Relatórios rápidos em telas amplas.
- Adiciona impressão adaptativa: até 5 colunas usa A4 retrato e fonte maior; de 6 a 8 colunas usa A4 paisagem com densidade média; acima de 8 colunas usa A4 paisagem compacta.
- Nenhuma API, regra de negócio ou backend foi alterado nesta etapa.


## Ajustes administrativos — Cartões e Viaturas — 17/08/2026

- Corrige o modal **Editar/Novo cartão** para manter cabeçalho e rodapé visíveis em zoom 100%, com rolagem somente no corpo quando a altura da tela for insuficiente.
- Garante acesso permanente aos botões **Cancelar** e **Salvar cartão** em desktop, notebook e telas menores.
- Remove do frontend de **Viaturas** a ação **Importar frota oficial**, pois a importação inicial da relação oficial já cumpriu sua finalidade e não deve permanecer como ação operacional recorrente.
- Mantém a função de importação no backend apenas por compatibilidade/recuperação técnica; ela deixa de ser exposta ao usuário administrativo.
- Atualiza o cache PWA administrativo para distribuir os ajustes sem depender do cache anterior.
- Nenhuma regra de cadastro, cartão, viatura, checklist, relatório ou Assistente IA foi alterada.
