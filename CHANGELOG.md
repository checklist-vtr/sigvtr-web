## Controle da Guarda v0.6.8.1
- Simplifica a identificação de quem encerra turno pendente para apenas **Comandante / Não Comandante**.
- Remove referências a encerramento "em atraso" da interface.
- Mantém motivo obrigatório somente quando quem encerra não é o Comandante da Guarda do turno.

## Controle da Guarda v0.6.8

- Corrige o encerramento de turno pendente: o sistema pergunta se quem encerra é o próprio Comandante da Guarda do turno ou outro militar.
- O motivo passa a ser obrigatório somente quando outro militar realiza o encerramento.
- A prévia de fechamento usa primeiro o contexto já carregado no navegador, reduzindo uma chamada desnecessária ao Apps Script.


## Controle da Guarda v0.6.7

- Performance-only: pesquisa de militares local após o carregamento do contexto.
- Polling de QR usa cache curto por movimentação e não renova atividade da sessão.
- Início da devolução elimina releitura da movimentação após a gravação.
- Invalidação de tokens ativos usa RangeList em lote.
- Lógica operacional e segurança preservadas.
## Controle da Guarda 0.6.1 — PDF robusto e performance (2026-09-01)
- Corrige autorização explícita do gerador de PDF e otimiza chamadas do módulo.
- Migração de estrutura passa a ser versionada e deixa de reformatar planilhas a cada request.
- Fechamento e geração de PDF são separados para reduzir latência percebida.

# Changelog

## Controle da Guarda 0.6.0 — PDF do turno (2026-09-01)

- Gera PDF automaticamente ao fechar turno normal ou pendente.
- Armazena cópia privada no Drive em pasta própria do Controle da Guarda.
- Mantém `PDF_FILE_ID` e `PDF_GERADO_EM` para recuperação posterior.
- Permite leitura do PDF já gerado e regeneração autenticada a partir dos dados estruturados.
- Preserva no documento a situação existente no instante do fechamento, inclusive VTR ainda em uso.
- Identifica devoluções recebidas de turno anterior sem deslocar a retirada histórica.
- Inclui confirmação eletrônica e identificação do Comandante da Guarda ou substituto.
- Adiciona feedback visual durante fechamento e botão **Baixar PDF** após geração.
- Não altera checklists Condutor/Fiscal nem as demais regras aprovadas do SIGVTR.

## 1.20.20-RC1 — cache curto de autenticação administrativa (2026-08-20)

- Adiciona cache de sessão administrativa já validada por até 60 segundos em `CacheService`.
- Mantém `Google Sheets` como fonte oficial das sessões e usuários; cache é apenas aceleração temporária.
- Pré-aquece a sessão no login para evitar releitura imediata de `SESSOES_ADMIN` e `USUARIOS` na primeira chamada administrativa.
- `adminValidateSession_` registra `CACHE HIT` ou `SHEETS` nos logs de desempenho.
- Logout sempre ignora o cache, valida a sessão na fonte oficial e remove o cache do token ao revogar a sessão.
- Revogação de todas as sessões incrementa uma versão por usuário em `PropertiesService`, invalidando caches após troca/redefinição de senha, alteração de perfil, desativação e encerramento de sessões.
- Mantidos timeout ocioso de 30 minutos, expiração absoluta de 8 horas, renovação de atividade e permissões por perfil.
- Não há mudança de frontend nesta entrega.

## 1.20.15-RC1 — segurança, logout, instrumentação e consistência PWA (2026-08-19)

- Substitui a validação permissiva de `return`/`redirect` por allowlist das páginas administrativas reais do SIGVTR.
- Bloqueia URLs externas, esquemas executáveis (`javascript:`, `data:`), caminhos absolutos/relativos inesperados e páginas administrativas desconhecidas no retorno pós-login.
- Define o formulário de login como `POST`, impedindo que usuário e senha sejam serializados na URL caso o JavaScript não intercepte a submissão.
- Adiciona trava lógica contra submissões repetidas no login e mantém o botão bloqueado durante o redirecionamento após autenticação bem-sucedida.
- Mantém a trava de logout já existente e adiciona feedback visual imediato com overlay responsivo, bloqueando os botões de saída no primeiro clique.
- O logout usa timeout específico de 20 segundos e sem retry automático; em falha de comunicação, preserva a limpeza local existente e informa no login que a confirmação remota não foi obtida.
- Adiciona instrumentação centralizada no `ApiService` com `console.debug` contendo somente ação, duração e resultado, sem registrar token, senha ou payload.
- Valida links internos retornados pela Pesquisa Global e URLs de arquivos/fotos recebidas da API, permitindo somente HTTPS em hosts esperados do Google Drive/Googleusercontent.
- Reduz o brasão usado no painel de 1600×1600 (~157 KB) para 192×192 (~7,5 KB), mantendo o original no repositório.
- Uniformiza o cache-busting dos arquivos administrativos, versão exibida, manifest, registro do Service Worker, cache PWA e prefixo de cache do `ApiService` em `1.20.15-RC1`.
- Nenhum arquivo `.gs`, regra de negócio, autorização, perfil, planilha, dado ou integração Google Drive/Sheets foi alterado.
- Polling e backend permanecem inalterados até existirem medições reais das chamadas em produção/homologação.

## Relatórios 2.3.2 — legibilidade de impressão/PDF (2026-08-18)

A impressão dos Relatórios foi ajustada com prioridade explícita para legibilidade e acessibilidade. A tabela impressa passa a ter **10 pt como piso absoluto**, inclusive no cabeçalho. Relatórios com até 5 colunas usam corpo de 11 pt e cabeçalho de 10 pt; com 6 a 8 colunas, corpo de 10,5 pt e cabeçalho de 10 pt; com 9 ou mais, corpo e cabeçalho de 10 pt. A orientação continua automática: retrato até 5 colunas e paisagem a partir de 6.

Para evitar a antiga compactação excessiva, cabeçalhos e células podem quebrar texto de forma controlada, linhas podem crescer verticalmente e a tabela usa layout fixo no documento impresso. Campos curtos recebem menos espaço e campos textuais recebem mais espaço por identificação semântica da coluna. O cabeçalho da tabela é configurado para repetição em páginas seguintes quando suportado pelo navegador, e linhas tentam evitar quebra entre páginas.

A alteração não muda filtros, seleção de colunas, dados, cálculos, CSV, relatórios rápidos, regras de negócio, Google Sheets, APIs ou Apps Script. Não foi adicionada biblioteca de PDF: a solução permanece baseada em CSS de impressão e `window.print()`. O cache administrativo foi renovado para distribuir os novos arquivos de frontend.


## 2026-08 — Modernização visual dos Checklists Condutor e Fiscal

- Moderniza o padrão visual compartilhado dos checklists Condutor e Fiscal sem alterar a lógica operacional.
- Amplia legibilidade com tipografia base de 16px, hierarquia mais clara e textos auxiliares maiores.
- Refina cabeçalho, apresentação institucional, stepper, cards de inspeção, inputs, selects, textareas e resumo final.
- Amplia áreas de toque de botões e estados de seleção para uso confortável em celular.
- Melhora a apresentação de avarias conhecidas, novas alterações, fotografias e previews.
- Adiciona estados hover/focus discretos, foco visível por teclado e suporte a `prefers-reduced-motion`.
- Refina layouts em 360px, 390px, 412px, tablet e desktop sem criar nova lógica responsiva em JavaScript.
- Mantém a identidade SIGVTR/20º BPM e não adiciona fontes, frameworks ou bibliotecas externas.
- Atualiza o cache do Condutor para `sigvtr-mobile-v1184rc1` e do Fiscal para `sigvtr-fiscal-v11911rc1`.
- `js/app.js`, `fiscal/js/app.js` e todos os arquivos `.gs` permanecem inalterados.


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


## Histórico de Status da Frota

- Nova aba do mesmo banco: `HISTORICO_STATUS_VTR`, criada com cabeçalhos controlados pelo backend.
- O status atual e a `Data do Status` da aba `VIATURAS` continuam funcionando como antes.
- Somente mudanças efetivas de Status geram transições permanentes; salvar o mesmo Status não gera histórico duplicado.
- Edição individual, atualização em massa e a rotina backend de importação existente passam pelo mesmo registro histórico.
- O responsável é obtido da sessão administrativa validada no backend; a atualização em massa não confia mais no texto de responsável enviado pelo frontend.
- O Relatório `Frota / Viaturas` aceita `Posição da frota em` e reconstrói a última situação conhecida até o final da data informada. Sem data, mantém exatamente a situação atual.
- Novo relatório `Movimentações de Status` consulta as transições por período, viatura, Status anterior, novo Status e responsável.
- O Assistente SIGVTR IA permanece somente leitura e reutiliza `getAdminReportsV2_`, inclusive para posição histórica e movimentações.
- O módulo registra um marco inicial real de implantação (`IMPLANTACAO_HISTORICO_STATUS`) para as viaturas existentes, sem inventar transições anteriores. Consultas anteriores a esse marco podem ter viaturas sem histórico confiável.
- Retenção: não há rotina de exclusão ou limpeza automática do histórico.

### Implantação

1. Atualize apenas os arquivos `.gs` alterados no Apps Script.
2. Salve o projeto e execute uma vez `initializeAdminVehicleStatusHistory_()` pelo editor do Apps Script para criar a aba e registrar o marco inicial da frota atual. A inicialização também possui proteção de contingência caso a primeira mudança de Status ocorra antes dessa execução manual.
3. Crie uma nova versão/implantação do Web App usando a mesma URL operacional.
4. Publique os arquivos web alterados no Git/Navegador.
5. Valide edição individual, atualização em massa, posição histórica, CSV, impressão/PDF e Assistente IA.

## 1.20.15-RC1 - Otimizacao backend baseada em medicao

- Otimiza o Dashboard administrativo para ler cada aba necessaria uma unica vez por requisicao e reutilizar os dados em memoria durante o processamento.
- Remove releituras internas de ALERTAS, RETIRADAS, AVARIAS e VIATURAS durante a composicao do Dashboard.
- Torna a migracao legada de estado de notificacoes idempotente e executada uma unica vez por instalacao, evitando varredura completa de ALERTAS em consultas normais.
- Evita reaplicar formatacao da coluna Prefixo durante simples consulta de viaturas.
- Otimiza a montagem de viaturas com indices em memoria para avarias abertas, ultimo checklist e revisao ativa.
- Otimiza o historico por viatura reutilizando leituras de RETIRADAS, AVARIAS, EVENTOS, ALERTAS, FOTOS e VIATURAS na mesma requisicao.
- Reduz gravacoes individuais do consumo de notificacoes agrupando linhas contiguas em operacoes setValues, mantendo o LockService existente.
- Otimiza o relatorio inicial de CHECKLISTS/COMBUSTIVEL para reutilizar contexto de leitura por requisicao, sem cache persistente de dados administrativos.
- Mantem autenticacao, autorizacao, sessoes, perfis, LockService, dados e rotas da API inalterados.

## 1.20.16-RC1 — 2026-08-19
- Corrige gargalo crítico da listagem de avarias, eliminando releituras da aba AVARIAS dentro do loop de registros.
- Indexa contagens de fotos e histórico em memória durante a mesma requisição.
- Diferencia cache de avarias de resultado confirmado e informa falha de revalidação em rede lenta.
- Mantém o último resultado válido visível quando a atualização falha, sem apresentar cache vazio como confirmação atual.
- Uniformiza referências de assets/PWA do painel administrativo em 1.20.16-RC1.

## Otimização 02 - desempenho administrativo (2026-08-20)
- Rotas de leitura de Dashboard/Alertas deixam de executar verificação/migração completa de estrutura quando as abas essenciais já existem.
- `adminViaturas` deixa de validar/reformatar a estrutura da aba VIATURAS em toda consulta.
- `adminCartoes` deixa de validar/regravar cabeçalhos da aba CARTOES em toda consulta e passa a registrar métricas `[SIGVTR PERF]`.
- Dashboard passa a consultar `adminAlertasRecentes` antes de consumir notificações; `adminConsumirNotificacoesNovas` só é chamado quando há notificações novas.
- Polling ativo de notificações passa de 10 s para 15 s e recebe proteção contra chamadas repetidas por foco/visibilidade.
- Gestão de Viaturas reaproveita cache de sessão para exibição imediata e revalida em segundo plano; ações manuais e escritas continuam forçando atualização de rede.
- Central de Alertas substitui recarga completa automática a cada 30 s por uma consulta leve de detecção de mudanças.
- Cache do Service Worker administrativo atualizado para `sigvtr-admin-v12018rc1`.

## 1.20.19-RC1 - Otimização 03 (20/08/2026)

### Desempenho
- `adminAlertasRecentes` passa a usar um marcador de versão em `PropertiesService`; quando o cliente já conhece a versão atual, a consulta retorna sem abrir a aba `ALERTAS`.
- O marcador de alertas é atualizado em criação, consumo e alteração de status de alertas, preservando a detecção de mudanças.
- O Dashboard mantém cache operacional curto de 30 segundos no backend e reaproveita sua própria leitura para pré-aquecer a resposta de `adminViaturas`.
- `adminViaturas` usa cache operacional curto de 30 segundos; atualização manual envia `fresh=1` e força nova leitura do backend.
- Alterações de viaturas e alertas invalidam os caches operacionais relacionados.

### Frontend
- O polling do Dashboard envia `sinceVersion` e evita leitura do Sheets quando não houve alteração de alertas.
- A Central de Alertas usa o mesmo marcador de versão para detectar mudanças.
- O polling é interrompido imediatamente no evento de logout, evitando chamadas após a revogação da sessão.
- Service Worker administrativo atualizado para `sigvtr-admin-v12019rc1`.

### Segurança e dados
- Nenhum registro histórico é removido ou sobrescrito por cache.
- Cache é somente uma camada temporária de leitura (30 s) e nunca substitui Google Sheets como fonte oficial.
- Regras de autenticação, perfis, LockService e contratos das rotas foram preservados.


## Sessão visual por inatividade — v1.20.22-RC1
- contador regressivo de 30 minutos no cabeçalho administrativo;
- destaque visual nos últimos 5 minutos e modal obrigatório nos últimos 2 minutos;
- botão **Continuar conectado** renova a sessão no backend e preserva o formulário atual;
- logout automático ao zerar o contador;
- limite absoluto de 8 horas permanece obrigatório;
- polling de alertas valida a sessão de forma passiva e não renova a inatividade;
- movimento do mouse não renova a sessão; interações reais em controles/formulários podem renovar com throttle de 2 minutos.
## Controle da Guarda — Etapa 1 (módulo 0.1.0)

- Adicionada fundação de dados isolada em `backend/Controle_Guarda.gs`.
- Preparadas as abas `MILITARES_GUARDA`, `TURNOS_GUARDA`, `MOVIMENTACOES_GUARDA` e `TOKENS_GUARDA`.
- Incluída importação idempotente da base inicial de 148 militares do Relatório de Viagem.
- CPF, RG e Prefixo são tratados como texto para preservar zeros à esquerda.
- Consulta de viaturas do Controle da Guarda não aplica bloqueio por status.
- Preparado snapshot para VTR `OUTROS` com Prefixo e Placa, sem cadastro automático em `VIATURAS`.
- Nenhuma alteração no fluxo dos checklists Condutor/Fiscal.



## Controle da Guarda — Etapa 2 (v0.2.0)
- Adicionada rota `/controle-da-guarda/` com interface mobile-first.
- Abertura e recuperação de turno da Guarda.
- Seleção de VTR cadastrada sem filtro de status e opção VTR `Outros`.
- Pesquisa, complementação e cadastro de militar.
- Integração autenticada das novas ações no backend.
- Preparação/validação da retirada sem criar movimentação nem QR nesta etapa.

## Controle da Guarda — Etapa 3 (v0.3.0)
- Adicionada criação da movimentação de retirada vinculada ao turno aberto.
- Adicionado token seguro/opaco, com hash SHA-256 armazenado e validade de 10 minutos.
- Adicionada invalidação de token anterior ao reemitir QR para a mesma retirada pendente.
- Adicionada página pública `/controle-da-guarda/confirmar/` sem login completo.
- QR não contém CPF, RG, nome, KM ou outros dados pessoais; transporta somente token aleatório.
- Condutor informa somente o KM atual e confirma o recebimento.
- Adicionada validação do KM contra o último KM conhecido para VTR cadastrada.
- Mantida a regra existente de atualização do `KM Atual` pelo maior valor.
- VTR `OUTROS` continua sem criar cadastro automático em `VIATURAS`.
- Adicionada atualização automática leve da tela da Guarda enquanto aguarda confirmação.
- Nenhuma alteração funcional nos checklists Condutor/Fiscal, relatórios ou autenticação administrativa existente.


### Controle da Guarda 0.3.1 — correções pós-teste
- Novo perfil `GUARDA`, exclusivo do módulo e sem permissões do painel administrativo.
- Redirecionamento de contas GUARDA para `/controle-da-guarda/`.
- Prefixos de VTR reserva preservados como texto, inclusive zeros à esquerda (ex.: `025`).
- Adicionado fechamento de turno com confirmação de Posto/Graduação, RG, nome completo e nome de guerra do Comandante da Guarda.
- Logout agora exibe feedback visual imediato “Saindo...”.
- Troca obrigatória de senha do primeiro acesso ocorre dentro do próprio Controle da Guarda.


## Controle da Guarda — Etapa 4 (v0.4.0)
- Implementado painel de retiradas e devoluções do turno.
- VTR em uso passa a oferecer **Iniciar devolução**.
- Devolução gera novo QR de uso único e o condutor informa o KM final.
- O KM final não pode ser inferior ao KM da retirada; o sistema calcula o KM percorrido.
- O fechamento do turno agora exibe feedback visual imediatamente enquanto o resumo é carregado.
- Mantidos os módulos existentes do SIGVTR sem alteração de comportamento.

## Controle da Guarda v0.4.1
- Define o acesso do Controle da Guarda como conta funcional/compartilhada, sem identificação pessoal do comandante pelo login.
- Adiciona pesquisa do Comandante da Guarda no fechamento por RG, CPF, nome ou nome de guerra usando MILITARES_GUARDA.
- Preenche automaticamente Posto/Graduação, RG, Nome completo e Nome de guerra ao selecionar o militar.
- Mantém os dados editáveis para conferência e permite preenchimento manual quando o comandante não estiver na base.
- Registra a função fixa "Comandante da Guarda" junto ao retorno do fechamento para uso no PDF futuro.

## Controle da Guarda v0.5.0
- Adiciona continuidade operacional quando um turno anterior não foi encerrado.
- Permite iniciar novo turno, convertendo o anterior para PENDENTE_ENCERRAMENTO.
- Adiciona encerramento de turno pendente por substituto, com identificação e motivo obrigatório.
- Separa ID_TURNO_RETIRADA e ID_TURNO_DEVOLUCAO para preservar VTR retirada em um serviço e devolvida em outro.
- Exibe movimentações abertas de turnos anteriores no turno atual para permitir a devolução.
- Altera o botão pós-devolução para FECHAR e unifica seu comportamento com o X do modal.


## Controle da Guarda v0.6.1 — PDF e performance
- A verificação/migração das quatro abas do Controle da Guarda agora é versionada e não reaplica formatação em todas as requisições.
- O fechamento do turno foi separado da geração do PDF: o turno é encerrado primeiro e o PDF é gerado em chamada própria com feedback visual contínuo.
- O fechamento grava a linha do turno em lote, reduzindo chamadas `setValue`.
- Adicionada `autorizarControleGuardaPdf()` para solicitar explicitamente as permissões de Google Docs/Drive antes do uso do PDF no Web App.
- Removidas atualizações redundantes da lista durante abertura/fechamento do modal de QR.

## Controle da Guarda v0.6.2
- PDF: substitui o identificador técnico do turno pela data legível do serviço.
- PDF: remove a frase técnica de rodapé sobre registros estruturados.
- Controle da Guarda: adiciona encerramento visual da sessão após 30 minutos de inatividade, alinhado ao timeout já existente no backend.


## Controle da Guarda v0.6.3
- O militar informado no fechamento do turno passa a ser incluído/atualizado em `MILITARES_GUARDA`, preservando CPF/OPM existentes quando já cadastrado.
- VTRs ainda em uso de turnos anteriores são reconciliadas automaticamente na abertura/reentrada do turno, sem depender do botão Atualizar.
- A criação de novo turno já devolve as movimentações abertas herdadas do serviço anterior.
- O nome do PDF foi simplificado para `DD-MM-AAAA_HH-mm.pdf`, sem UUID ou identificador técnico.

## Controle da Guarda v0.6.4 — performance e memória de VTR reserva

- adiciona reaproveitamento de VTRs informadas em **Outros** a partir de `MOVIMENTACOES_GUARDA`;
- sugere Prefixo, Placa e último KM confirmado ao pesquisar uma reserva já utilizada;
- mantém a VTR temporária fora do cadastro mestre `VIATURAS`;
- passa a validar o KM inicial de VTR `OUTROS` contra o último KM histórico conhecido;
- adiciona cache curto para viaturas, militares e histórico de reservas;
- reduz leituras repetidas no `guardaContexto`, consolidando turnos e movimentações em uma leitura coerente;
- pesquisas de militares passam a usar índice em cache, invalidado automaticamente após alterações cadastrais.


## Controle da Guarda v0.6.5
- Corrige o PDF para incluir todas as VTRs operacionalmente visíveis no turno, inclusive retiradas em turnos anteriores que permaneciam em uso no encerramento.
- O resumo do PDF passa a usar a mesma visão operacional do painel.
- Remove a requisição extra de `guardaListarMovimentacoes` após carregar/iniciar turno quando o backend já devolveu as movimentações.


## Controle da Guarda v0.6.5.1
- Corrige estado visual após confirmação de retirada: VTR e militar selecionados são limpos imediatamente quando a movimentação passa para EM_USO.
- Fechar o modal pelo X ou pelo botão de continuidade não deixa o card 'Pronto para retirada' com dados já utilizados.
- Evita uma atualização redundante da lista ao continuar após a confirmação.

## Controle da Guarda v0.6.6
- PDF passa a usar o nome `controle-da-guarda_DD-MM-AAAA_HH-mm.pdf`.
- Contexto operacional recebe cache curtíssimo de 8 s com invalidação em alterações.
- Confirmações de retirada/devolução passam a agrupar escritas de linha no Sheets.
- Botão de atualização manual evita chamadas concorrentes duplicadas.
- Segurança do login e regras operacionais permanecem inalteradas.
- Busca por ID de movimentação/turno otimizada para evitar varredura integral das abas em chamadas pontuais.


## Controle da Guarda v0.7.0 — Admin > Relatórios
- Adiciona o tipo de relatório **Controle da Guarda** ao painel administrativo.
- Permite filtrar turnos por período, visualizar resumo/status/responsável e baixar ou regenerar o PDF do serviço.
- Reutiliza o gerador oficial do Controle da Guarda; não duplica a lógica do PDF.


## Controle da Guarda v0.8.0 — segurança, concorrência e PWA/cache
- Mantém confirmações críticas sob `LockService`, protegendo contra confirmações concorrentes e duplo processamento.
- Otimiza a localização de tokens usando busca exata na coluna `TOKEN_HASH`, sem carregar toda `TOKENS_GUARDA`.
- Exclui toda a rota `/controle-da-guarda/` do cache do service worker principal.
- A página pública remove o token da barra de endereço após capturá-lo, reduzindo exposição em histórico/cópias de URL.
- Mantém token opaco, hash SHA-256 no banco, validade de 10 minutos e uso único.
- Mantém sessão funcional com timeout de 30 minutos e polling passivo sem renovação de atividade.
- Adiciona `testarControleGuardaEtapa8()` e roteiro manual `docs/CONTROLE_DA_GUARDA_TESTES_FINAIS.md`.
