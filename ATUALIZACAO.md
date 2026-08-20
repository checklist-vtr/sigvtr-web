# ATUALIZAÇÃO — Otimização 04 — autenticação administrativa

## Objetivo
Reduzir o custo-base de todas as rotas administrativas sem retirar validação de sessão, permissões ou expiração.

## Arquivo funcional alterado
- `backend/Autenticacao_Admin.gs`

## O que mudou
- sessão já validada pode ser reutilizada por até 60 segundos via `CacheService`;
- o login pré-aquece esse cache após persistir a sessão no Sheets;
- cada cache contém usuário, expiração absoluta, última atividade e versão de segurança do usuário;
- cada cache hit verifica a versão de segurança em `PropertiesService`;
- logout não usa cache e remove o cache do token;
- troca/redefinição de senha, mudança de perfil/status e encerramento de sessões invalidam caches por usuário;
- a cada expiração do cache a validação volta ao Sheets, preservando renovação da atividade e timeout ocioso.

## Segurança preservada
- `SESSOES_ADMIN` e `USUARIOS` continuam sendo a fonte oficial;
- timeout ocioso: 30 minutos;
- expiração absoluta: 8 horas;
- permissões CMD/SUBCMD/FISCAL/DEV permanecem iguais;
- operações de logout/revogação continuam persistidas no Sheets;
- alterações manuais diretamente na planilha, fora do SIGVTR, podem levar no máximo o TTL curto do cache para refletir em uma chamada já aquecida.

## Logs esperados
Após a primeira validação completa, chamadas próximas devem registrar:

```text
[SIGVTR PERF] adminValidateSession_ CACHE HIT ... ms
```

Quando o cache expirar ou estiver ausente:

```text
[SIGVTR PERF] adminValidateSession_ SHEETS ... ms
```

## Implantação
1. Substituir somente `Autenticacao_Admin.gs` no Google Apps Script.
2. Salvar o projeto.
3. Criar uma nova versão da implantação do Web App mantendo as mesmas permissões.
4. Não é necessário alterar GitHub Pages/frontend nesta etapa.

## Teste recomendado
1. Login.
2. Dashboard.
3. Permanecer no Dashboard por 30–45 s observando `adminAlertasRecentes`.
4. Abrir Viaturas e Cartões.
5. Retornar ao Dashboard.
6. Fazer logout.
7. Confirmar no Apps Script os logs `CACHE HIT` e `SHEETS`.

---

## Relatórios 2.3.2 — legibilidade de impressão/PDF (2026-08-18)

A impressão dos Relatórios foi ajustada com prioridade explícita para legibilidade e acessibilidade. A tabela impressa passa a ter **10 pt como piso absoluto**, inclusive no cabeçalho. Relatórios com até 5 colunas usam corpo de 11 pt e cabeçalho de 10 pt; com 6 a 8 colunas, corpo de 10,5 pt e cabeçalho de 10 pt; com 9 ou mais, corpo e cabeçalho de 10 pt. A orientação continua automática: retrato até 5 colunas e paisagem a partir de 6.

Para evitar a antiga compactação excessiva, cabeçalhos e células podem quebrar texto de forma controlada, linhas podem crescer verticalmente e a tabela usa layout fixo no documento impresso. Campos curtos recebem menos espaço e campos textuais recebem mais espaço por identificação semântica da coluna. O cabeçalho da tabela é configurado para repetição em páginas seguintes quando suportado pelo navegador, e linhas tentam evitar quebra entre páginas.

A alteração não muda filtros, seleção de colunas, dados, cálculos, CSV, relatórios rápidos, regras de negócio, Google Sheets, APIs ou Apps Script. Não foi adicionada biblioteca de PDF: a solução permanece baseada em CSS de impressão e `window.print()`. O cache administrativo foi renovado para distribuir os novos arquivos de frontend.

---

# ATUALIZAÇÃO — Modernização visual dos Checklists Condutor e Fiscal

## Objetivo
Modernizar a experiência dos Checklists do Condutor e do Fiscal para aparência de aplicativo atual, com foco em legibilidade, organização, acessibilidade e uso mobile, sem modificar a lógica operacional aprovada.

## Alterações exclusivamente visuais
- `css/style.css`
- `fiscal/css/style.css`
- `index.html` — apenas versão exibida e query strings de cache.
- `fiscal/index.html` — apenas versão exibida e query strings de cache.
- `sw.js` — somente renovação do nome do cache e referências versionadas.
- `fiscal/sw.js` — somente renovação do nome do cache e referências versionadas.

## O que foi modernizado
- tipografia e hierarquia de títulos;
- fundo geral e separação dos cards;
- cabeçalho institucional;
- indicador de etapas;
- inputs, selects e textareas;
- cards de inspeção;
- botões de status e navegação;
- área de avarias;
- captura e prévia de fotos;
- resumo, confirmação e modais;
- foco por teclado, contraste e áreas de toque;
- responsividade mobile-first e acabamento em desktop;
- redução de movimento conforme preferência do sistema.

## Preservação funcional
Não houve alteração em campos, IDs, eventos, funções, regras, validações, submissão, compressão de fotos, upload, armazenamento, avarias, API, autenticação, Google Sheets, Google Drive ou Google Apps Script. Os arquivos `js/app.js`, `fiscal/js/app.js` e `backend/*.gs` permanecem byte a byte iguais ao ZIP de origem.

## Performance
A alteração utiliza apenas CSS e recursos já presentes. Não foram adicionados frameworks, fontes externas, imagens de fundo, bibliotecas ou novas requisições. O aumento do CSS é pequeno em termos absolutos e não deve gerar impacto perceptível no carregamento.

## PWA / cache
- Condutor: cache atualizado para `sigvtr-mobile-v1184rc1`, recursos `v1.18.4-rc1`.
- Fiscal: cache atualizado para `sigvtr-fiscal-v11911rc1`, recursos `v1.19.11-rc1`.

A estratégia de Service Worker foi preservada; houve apenas renovação das chaves/versionamento para forçar a obtenção do frontend atualizado.

## Implantação
### GitHub Desktop / Git
1. Substituir os arquivos alterados pelos arquivos desta entrega.
2. Conferir a lista de mudanças antes do commit.
3. Fazer o commit com o título sugerido abaixo.
4. Publicar/push para a branch utilizada no projeto.
5. Validar Condutor e Fiscal em celular e desktop após a publicação.

### Google Apps Script
**Não é necessário substituir nem publicar arquivos no Apps Script**, pois nenhum arquivo `.gs` foi alterado.

## Testes de homologação recomendados após publicação
### Condutor e Fiscal
- carregamento;
- identificação e seleção de viatura;
- KM e combustível;
- campos obrigatórios;
- navegação pelas seis etapas;
- avarias conhecidas e nova alteração;
- fotos e prévias;
- resumo e confirmação;
- envio real do checklist.

### Visual
- 360px, 390px e 412px;
- tablet;
- desktop amplo;
- zoom 100% e 125%;
- foco por teclado;
- atualização/cache do PWA.

## Commit sugerido
**Título:** `Moderniza visual dos checklists Condutor e Fiscal`

**Descrição:** `Moderniza tipografia, cards, inputs, botões, avarias, fotos, stepper e responsividade dos checklists Condutor e Fiscal, preservando integralmente a lógica operacional, backend e integrações. Atualiza somente o versionamento de cache/PWA necessário para distribuir o novo CSS.`

---

# ATUALIZAÇÃO — Relatórios 2.3 / Modernização visual

## Objetivo
Modernizar a página de Relatórios com foco em **legibilidade, acessibilidade e uso em telas diferentes**, mantendo velocidade e compatibilidade.

## Arquivos funcionais alterados
- `admin/relatorios.html`
- `admin/assets/css/relatorios.css`

## Principais mudanças
- fonte base maior;
- títulos e subtítulos mais legíveis;
- campos, botões e checkboxes com áreas de interação maiores;
- cards do Resumo da Frota com números mais destacados;
- tabela com fonte e altura de linha maiores;
- foco visível para teclado;
- melhor organização em celular/tablet;
- ajustes de impressão/PDF;
- respeito à preferência do sistema por redução de movimento.

## O que NÃO foi alterado
Não houve alteração de backend, Apps Script, APIs, regras de relatório, Assistente IA, filtros, dados, exportação CSV ou lógica de negócio. Portanto, **esta atualização visual não exige nova implantação do Google Apps Script**.

## Implantação
No Git/Navegador, publicar os arquivos de frontend alterados. Como o CSS recebeu nova versão no query string, o navegador/PWA tende a buscar a folha de estilos atualizada sem depender do cache antigo.

## Commit sugerido
**Título:** `Moderniza visual dos Relatórios com foco em acessibilidade`

**Descrição:** `Aumenta tipografia, melhora cards, filtros, seletores e tabela da página Relatórios, com refinamentos responsivos e de impressão, sem alterar backend ou regras de negócio.`

---

# ATUALIZAÇÃO — Relatórios 2.2 / Assistente IA

## Cartões relacionados às viaturas nos relatórios

A coluna opcional **Cartões vinculados** foi adicionada aos relatórios:

- Checklists / Relatório operacional;
- Frota / Viaturas;
- Combustível;
- Quilometragem / Revisões.

O vínculo utiliza os dados reais do módulo `CARTOES`, priorizando `ID_VTR` e usando o prefixo como compatibilidade. Quando houver mais de um cartão associado, eles aparecem no mesmo campo com número, tipo e situação.

O relatório específico **Cartões** continua disponível e o **Relatório Personalizado** mantém suas colunas próprias de cartão.

## Assistente SIGVTR IA

O Assistente passa a reutilizar as consultas somente leitura do **Relatórios 2.x**. A categoria da pergunta determina a consulta usada:

- Frota → `FROTA`;
- Cartões → `CARTOES`;
- Checklists → `CHECKLISTS`;
- Combustível → `COMBUSTIVEL`;
- Avarias → `AVARIAS`;
- Quilometragem/manutenção → `QUILOMETRAGEM`.

Perguntas gerais recebem uma consolidação limitada desses relatórios. Perguntas sobre uma viatura específica também podem combinar histórico, situação cadastral e cartões vinculados. A IA continua **somente leitura** e não altera nenhum registro do SIGVTR.

### Arquivos alterados

- `backend/Painel_Administrativo.gs`
- `backend/Assistente_IA.gs`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

### Implantação

No Google Apps Script, substituir **Painel_Administrativo.gs** e **Assistente_IA.gs** e publicar uma nova versão do Web App. No Git/Navegador, atualizar os arquivos do projeto e validar os testes abaixo antes do commit definitivo.

### Testes recomendados

1. Gerar Checklists marcando `Prefixo`, `Placa` e `Cartões vinculados`.
2. Gerar Frota e conferir o cartão de uma VTR com cartão titular cadastrado.
3. Gerar Combustível e Quilometragem/Revisões com a coluna `Cartões vinculados`.
4. Perguntar ao Assistente: `Quantas viaturas estão indisponíveis?`.
5. Perguntar: `Quais viaturas estão baixadas e quais possuem reserva?`.
6. Perguntar: `Qual é a data do status da viatura 50-XXXX?` usando um prefixo real.
7. Perguntar: `Qual cartão está vinculado à viatura 50-XXXX?`.
8. Perguntar: `Quais cartões reserva estão cadastrados?`.
9. Perguntar: `Quais viaturas estão com revisão vencida?`.
10. Confirmar que o Assistente não altera status, cartões, avarias ou qualquer outro dado.

---

# ATUALIZAÇÃO — Relatórios 2.1.1

## Resumo da Frota — status temporários

O resumo do relatório **Frota / Viaturas** agora contabiliza também:

- **Indisponíveis** — viaturas com status `INDISPONIVEL`, incluindo afastamentos temporários como viagens;
- **Em manutenção** — viaturas com status `MANUTENCAO`.

A observação administrativa continua livre para detalhar o motivo, por exemplo `Em viagem até 22/08/2026`. A **Data do Status** permanece sendo atualizada quando há mudança efetiva do status.

### Arquivos alterados

- `backend/Painel_Administrativo.gs`
- `admin/assets/js/relatorios.js`
- `admin/assets/css/relatorios.css`
- `admin/relatorios.html`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

### Implantação

Substituir `Painel_Administrativo.gs` no Google Apps Script e publicar uma nova versão do Web App. Atualizar no Git/Navegador os arquivos administrativos alterados.

---

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


## Entrega 07 — Correção estrutural Fiscal e Viaturas

- O Checklist do Fiscal passa a usar a rota exclusiva `salvarChecklistFiscal`.
- O backend força `FISCAL` nessa rota, independentemente do nome, RG ou função anterior do militar.
- A resposta do backend informa `tipoChecklist` e `backendVersion` para diagnóstico.
- A tela de Viaturas injeta os campos de revisão pelo JavaScript quando uma cópia HTML antiga estiver em cache.
- Cache Fiscal e Administrativo atualizado para v1.19.6-RC1.


## Atualização — Relatórios 2.1
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


## Ajuste administrativo — Cartões e Viaturas — 17/08/2026

### Cartões
O modal de cadastro/edição passa a ter o corpo rolável e o rodapé fixo dentro da janela. Em zoom 100%, o usuário consegue chegar aos botões **Cancelar** e **Salvar cartão** sem precisar reduzir a escala do navegador.

### Viaturas
A opção **Importar frota oficial** foi retirada do menu **Ações em massa**. A importação oficial é uma operação de carga inicial e, após sua utilização, não deve permanecer disponível como rotina administrativa. A função de backend foi preservada somente para compatibilidade e recuperação técnica.

### Implantação
Esta entrega é somente de frontend/PWA. Não exige nova implantação do Google Apps Script. Atualizar no GitHub os arquivos `admin/cartoes.html`, `admin/assets/css/cartoes.css`, `admin/viaturas.html`, `admin/assets/js/viaturas.js`, `admin/sw.js` e os documentos consolidados.


## Histórico de Status da Frota — implementação

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

---

# Atualizacao - Performance backend baseada em medicao - 1.20.15-RC1

## Diagnostico confirmado

Medicoes antes desta intervencao mostraram aproximadamente:

- adminDashboard: 16.457 a 16.845 ms
- adminRelatorios: 20.818 ms
- adminConsumirNotificacoesNovas: 9.437 ms
- adminHistoricoViatura: 8.188 a 9.504 ms
- adminAlertas: 7.040 ms
- adminViaturas: 5.985 ms
- adminCartoes: 5.322 ms
- adminChecklists: 4.121 ms

A analise do Apps Script confirmou releituras repetidas das mesmas abas dentro de uma unica requisicao, manutencao estrutural sendo executada no caminho de leitura e gravacoes unitarias no consumo de notificacoes.

## Arquivo alterado

- backend/Painel_Administrativo.gs

Os demais arquivos .gs enviados foram preservados sem alteracao.

## Alteracoes realizadas

### Dashboard

- Introduzido contexto de leitura valido somente durante a requisicao atual.
- RETIRADAS, AVARIAS, ALERTAS, VIATURAS, REVISOES e EVENTOS sao lidas uma vez e reutilizadas para KPIs, alertas recentes, checklists recentes e timeline.
- Indices de viaturas em memoria substituem buscas lineares repetidas.

### Estrutura administrativa

- A formatacao de cabecalho e congelamento de linha passam a ocorrer apenas quando a estrutura da aba realmente muda.
- A migracao legada de Status Notificacao e executada uma unica vez e marcada em Script Properties pela chave SIGVTR_ADMIN_NOTIFICATION_MIGRATION_V1.
- Novos alertas continuam recebendo Status Notificacao=NOVA normalmente.

### Polling

- LockService foi mantido.
- A leitura e a regra de selecao de notificacoes permanecem iguais.
- Gravacoes de Status Notificacao/Data Visualizacao Notificacao passam a ser agrupadas por linhas contiguas com setValues.

### Viaturas

- Consulta simples nao reaplica setNumberFormat sobre toda a coluna Prefixo.
- Avarias abertas, ultimo checklist e revisao ativa sao indexados em uma passagem pelos dados, preservando o objeto retornado pela API.

### Historico por viatura

- As mesmas leituras sao reutilizadas durante a requisicao, evitando chamadas internas que voltavam ao Sheets.

### Relatorios

- CHECKLISTS e COMBUSTIVEL passam a compartilhar um contexto de leitura durante a mesma geracao.
- Nao foi introduzido cache persistente para relatorios, sessoes, permissoes ou dados criticos.

## Seguranca e integridade

- Autenticacao_Admin.gs nao foi alterado.
- Complemento_Mobile_v4.gs nao foi alterado.
- Cartoes_Abastecimento.gs nao foi alterado.
- Rotas administrativas continuam passando por adminAuthorize_.
- LockService do fluxo de escrita permanece ativo.
- Nenhuma validacao, sanitizacao, autorizacao ou log de seguranca foi removido.
- Nenhuma planilha, coluna ou registro e apagado ou migrado por esta atualizacao, exceto a migracao legada de notificacoes que ja existia e agora e executada uma unica vez.

## Testes locais executados

- Verificacao sintatica JavaScript/V8 do Painel_Administrativo.gs: OK.
- Equivalencia controlada da resposta de getAdminVehicles_: OK.
- Teste controlado de leituras do Dashboard com dados simulados: 13 leituras antes e 6 depois.
- Confirmacao por hash de que Autenticacao_Admin.gs, Complemento_Mobile_v4.gs e Cartoes_Abastecimento.gs permaneceram inalterados na copia de trabalho.

## Medicao depois

Ainda nao disponivel. O ganho real deve ser medido apos nova implantacao do Apps Script usando os mesmos logs [SIGVTR API]. Nao considerar o teste local de 13 -> 6 como tempo de producao.

## Implantacao Apps Script

1. Substituir somente Painel_Administrativo.gs pelo arquivo desta entrega.
2. Salvar o projeto.
3. Em Implantar > Gerenciar implantacoes, editar a implantacao atual ou criar nova versao da mesma implantacao Web App conforme o fluxo usado no SIGVTR.
4. Manter a mesma URL do Web App quando a implantacao existente for atualizada; nao alterar a URL no frontend sem necessidade.
5. Abrir o SIGVTR publicado e repetir as medicoes de adminDashboard, adminRelatorios, adminConsumirNotificacoesNovas, adminHistoricoViatura, adminViaturas e adminChecklists.
6. Comparar os resultados com os tempos ANTES registrados acima.

## Riscos e pendencias

- A primeira requisicao apos esta versao pode executar a migracao legada de notificacoes uma ultima vez, caso a Script Property ainda nao exista.
- Relatorios dos tipos FROTA, AVARIAS, QUILOMETRAGEM e PERSONALIZADO ainda possuem oportunidades de reutilizacao adicional; nao foram ampliadas nesta rodada para evitar refatoracao excessiva antes de nova medicao.
- A resiliencia visual ja existente no frontend continua ativa; qualquer ampliacao de cache para paginas que hoje usam forceNetwork deve ser tratada separadamente e com indicacao explicita de dado desatualizado.

## Atualização 1.20.16-RC1 — Avarias, rede lenta e PWA

### Alterações
- `backend/Painel_Administrativo.gs`: `getAdminDamages_()` passou a ler AVARIAS uma única vez e a usar índices em memória para fotos/logs.
- `admin/assets/js/api.js`: a revalidação em segundo plano agora pode informar sucesso ou falha à página chamadora; prefixo de cache atualizado.
- `admin/assets/js/avarias.js`: distingue dados salvos, atualização em andamento e falha de atualização; não confunde falha de rede com zero avarias.
- HTML administrativo, `admin/manifest.json`, `admin/sw.js`, `admin.js` e `admin-layout.js`: versionamento PWA/assets sincronizado em 1.20.16-RC1.

### Segurança e integridade
- Nenhuma alteração em autenticação, autorização, perfis, sessão ou estrutura de dados.
- Nenhuma remoção de `LockService`.
- A otimização de avarias é somente leitura e preserva os campos retornados pela API.

### Testes recomendados após implantação
- Abrir Avarias com Wi-Fi e dados móveis e confirmar retorno dos registros existentes.
- Testar cache com rede offline após uma consulta válida e verificar o aviso de dados salvos.
- Testar atualização forçada e confirmar que falha de rede não produz mensagem falsa de zero registros.
- Conferir no DevTools que assets administrativos usam `v=1.20.16-rc1`.
- Repetir a medição `[SIGVTR API] adminAvarias ... ms`.

### Implantação
- Atualizar `Painel_Administrativo.gs` no Apps Script e criar nova versão da implantação mantendo a URL existente.
- Publicar os arquivos frontend alterados no GitHub Pages.

## Implantação - Otimização 02 (2026-08-20)
### Backend / Apps Script
Substituir e publicar nova versão do Web App:
- `backend/Painel_Administrativo.gs`
- `backend/Cartoes_Abastecimento.gs`

### Frontend / GitHub Pages
Publicar os arquivos alterados:
- `admin/assets/js/admin.js`
- `admin/assets/js/alertas.js`
- `admin/assets/js/viaturas.js`
- `admin/sw.js`
- `admin/index.html`
- `admin/alertas.html`
- `admin/viaturas.html`
- `admin/busca-global.html`
- `admin/checklists.html`
- `admin/historico-viatura.html`
- `admin/relatorios.html`

Os HTML adicionais acima mudam apenas o parâmetro de versão de `admin.js`, garantindo invalidação correta do cache do navegador.

### Teste após publicação
1. Fechar abas antigas do SIGVTR e abrir o login novamente.
2. DevTools > Network: marcar Preserve log e Disable cache apenas para o teste.
3. Executar: login > Dashboard > Alertas > Viaturas > Cartões > Dashboard > logout.
4. Registrar no Console os tempos `[SIGVTR API]`.
5. No Apps Script > Execuções, registrar os `[SIGVTR PERF]` de `adminDashboard`, `adminAlertas`, `adminViaturas` e `adminCartoes`.
6. Confirmar que `adminConsumirNotificacoesNovas` não aparece repetidamente quando não existem notificações novas.

# Atualização 1.20.19-RC1 - Otimização 03

Data: 20/08/2026

## Objetivo
Reduzir o custo do monitoramento de alertas, impedir polling durante o logout e diminuir leituras repetidas no caminho Dashboard -> Viaturas.

## Backend alterado
- `backend/Painel_Administrativo.gs`
- `backend/Complemento_Mobile_v4.gs`

## Frontend alterado funcionalmente
- `admin/assets/js/admin.js`
- `admin/assets/js/alertas.js`
- `admin/assets/js/auth.js`
- `admin/assets/js/viaturas.js`
- `admin/sw.js`

Os HTML administrativos receberam apenas atualização de versão de `auth.js`/`admin.js`/scripts específicos para evitar execução de cache antigo.

## Implantação Apps Script
1. Fazer backup/exportação da versão publicada.
2. Substituir `Painel_Administrativo.gs` e `Complemento_Mobile_v4.gs` pelos arquivos desta entrega.
3. Salvar.
4. Criar nova versão da implantação Web App, preservando executor e permissões atuais.

## Implantação GitHub Pages
1. Copiar os arquivos da pasta `admin/` desta entrega sobre os equivalentes do repositório atual.
2. Confirmar principalmente os quatro JS alterados e `admin/sw.js`.
3. Fazer commit e push.
4. Reabrir o SIGVTR e fazer recarregamento forte (`Ctrl+Shift+R`) uma vez.

## Teste de desempenho recomendado
Executar: Login -> Dashboard -> aguardar 30-45 s -> Alertas -> aguardar 30-45 s -> Viaturas -> Atualizar manualmente -> Dashboard -> Logout.

No Console/Network observar:
- `adminAlertasRecentes`: após a primeira sincronização, deve registrar `[SIGVTR PERF] adminAlertasRecentes VERSION HIT` e não abrir `ALERTAS`.
- `adminViaturas`: ao entrar logo após Dashboard, deve poder registrar `[SIGVTR PERF] adminViaturas CACHE HIT`.
- Ao clicar em Atualizar em Viaturas, deve ocorrer leitura real (`fresh=1`).
- Após clicar em Sair, não devem surgir novas chamadas `adminAlertasRecentes` iniciadas pelo polling.
- `adminDashboard` pode registrar `CACHE HIT` em reaberturas dentro de 30 segundos.

## Critérios de aceite
- Nenhuma regressão funcional no Dashboard, Alertas, Viaturas ou logout.
- Novos alertas continuam aparecendo no Dashboard.
- Mudança de status na Central de Alertas é detectada.
- Atualização manual de Viaturas busca dados atuais do backend.
- Nenhuma chamada periódica de alertas é iniciada após o clique em logout.
