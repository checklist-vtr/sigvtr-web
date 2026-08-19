# ATUALIZAÇÃO — 1.20.15-RC1 — Segurança, Performance e UX

## Objetivo
Intervenção cirúrgica no Painel Administrativo do SIGVTR para corrigir os riscos confirmados de retorno pós-login e fallback GET, melhorar o feedback de logout, instrumentar chamadas ao Apps Script e alinhar o versionamento PWA, sem redesenhar o sistema e sem alterar backend, dados, perfis ou regras de negócio.

## Diagnóstico e correções

| Problema | Arquivo/função | Causa confirmada | Correção |
| --- | --- | --- | --- |
| `return`/`redirect` permissivo | `admin/assets/js/auth.js` | rejeição apenas de padrões simples de URL | allowlist de páginas administrativas e canonicalização local |
| fallback GET do login | `admin/login.html` | formulário sem `method`, cujo padrão HTML é GET | `method="post"` e `action="login.html"` |
| múltiplas submissões de login | `admin/assets/js/login.js` | proteção dependia principalmente do estado do botão | trava lógica `loginInProgress` |
| logout sem resposta visual | `AuthService.logout()` | chamada ao Apps Script iniciava antes de qualquer feedback visual | overlay imediato e bloqueio dos botões |
| logout potencialmente longo | `AuthService.logout()` / `ApiService.post()` | timeout global + retry podia prolongar a operação | timeout de 20 s e `retries: 0` somente no logout |
| ausência de medição objetiva | `admin/assets/js/api.js` | chamadas não registravam duração | `console.debug('[SIGVTR API]', ação, ms, status)` |
| URL de backend usada em `href`/foto | scripts de Pesquisa Global, Arquivamento, Histórico, Checklists e Avarias | escape HTML não valida protocolo/origin | allowlist de página interna e HTTPS restrito a hosts Google esperados |
| brasão excessivamente pesado | `admin/assets/images/brasao-20bpm.webp` | 1600×1600 para exibição de até 112 px | nova cópia 192×192, mantendo o original |
| versões PWA divergentes | HTML, `manifest.json`, `sw.js`, `admin.js`, `admin-layout.js`, `api.js` | cache-busters e caches de várias versões | versão administrativa oficial `1.20.15-RC1` |

## Segurança
- **Melhora:** retorno pós-login passa a aceitar somente páginas administrativas conhecidas.
- **Melhora:** `javascript:`, `data:`, URL externa, `//`, caminho absoluto, `../`, barra invertida e páginas desconhecidas são rejeitados.
- **Melhora:** credenciais não são mais serializadas na URL por submissão HTML nativa.
- **Melhora:** links/fotos provenientes da API são validados antes do uso em `href` ou `src`.
- **Mantém:** token continua em `sessionStorage`; não houve migração arquitetural para cookies.
- **Mantém:** autorização server-side, validação de sessão e lógica do backend não foram removidas nem relaxadas.
- **Logout:** se o backend não responder em 20 segundos, a sessão local é removida como já ocorria anteriormente e o login informa que a confirmação remota não foi obtida. Isso não é tratado como confirmação de revogação no servidor.

## Performance
### Recurso estático
- Brasão administrativo anterior: aproximadamente **160.470 bytes**, 1600×1600.
- Brasão novo: aproximadamente **7.458 bytes**, 192×192.
- Redução aproximada do arquivo usado no painel/login: **95,4%**.

### Chamadas Apps Script
A versão agora mede chamadas de rede no console no formato:

```text
[SIGVTR API] adminDashboard 1840 ms ok
[SIGVTR API] adminHistoricoViatura 3260 ms ok
```

A instrumentação não registra senha, token, CPF ou payload.

**ANTES:** não existia medição centralizada confiável.

**DEPOIS:** medição disponível por ação no navegador.

Não foram inventados tempos de Dashboard, Alertas, Cartões, Prontuário, Checklists ou Viaturas, porque esta cópia não possui uma sessão autenticada de homologação para executar essas chamadas reais. Por esse motivo, nenhuma função do Apps Script foi otimizada nesta entrega.

## Polling
O polling de `adminConsumirNotificacoesNovas` foi analisado e mantido sem alteração. A chamada não é somente leitura: ela também marca notificações como visualizadas. A implementação já possui trava contra concorrência própria e intervalo diferenciado quando o documento está oculto. Sem medição comprovando competição relevante, alterar frequência ou paralelização nesta etapa seria especulativo.

## PWA / cache
- Versão oficial administrativa: `1.20.15-RC1`.
- Service Worker: `sigvtr-admin-v12015rc1`.
- Registro do SW: `sw.js?v=1.20.15-rc1`.
- Manifest: `1.20.15-rc1`.
- Cache do `ApiService`: `sigvtr_admin_api_v12015rc1:`.
- Query strings dos assets administrativos foram sincronizadas em `v=1.20.15-rc1`.
- A estratégia do Service Worker foi preservada; não houve conversão para SPA nem mudança da política network-first existente para HTML/JS/CSS.

## Arquivos alterados

### Segurança / UX / instrumentação
- `admin/login.html`
- `admin/assets/js/login.js`
- `admin/assets/js/auth.js`
- `admin/assets/js/api.js`
- `admin/assets/css/admin.css`
- `admin/assets/js/busca-global.js`
- `admin/assets/js/arquivamento.js`
- `admin/assets/js/historico-viatura.js`
- `admin/assets/js/checklists-admin.js`
- `admin/assets/js/avarias.js`

### PWA / versionamento / recurso estático
- `admin/sw.js`
- `admin/manifest.json`
- `admin/assets/js/admin.js`
- `admin/assets/js/admin-layout.js`
- `admin/assets/images/brasao-20bpm-192.webp`
- páginas `admin/*.html` somente para sincronização das query strings de versão quando aplicável.

### Documentação
- `CHANGELOG.md`
- `ATUALIZACAO.md`

`README.md` permanece inalterado. Nenhum arquivo de `backend/*.gs` foi modificado.

## Testes executados
- [x] `node --check` nos JavaScripts alterados.
- [x] `return=index.html` aceito.
- [x] retorno com query string legítima aceito.
- [x] retorno com hash legítimo aceito.
- [x] URL externa rejeitada.
- [x] `//host` rejeitado.
- [x] `javascript:` rejeitado.
- [x] `data:` rejeitado.
- [x] caminho absoluto rejeitado.
- [x] `../` rejeitado.
- [x] página não cadastrada rejeitada.
- [x] `login.html` rejeitado como destino de retorno.
- [x] URL HTTPS do Google Drive aceita.
- [x] URL HTTPS de `googleusercontent.com` aceita.
- [x] HTTP do Drive rejeitado.
- [x] host falso `drive.google.com.evil.example` rejeitado.
- [x] 10 acionamentos simultâneos de logout resultam em uma única chamada.
- [x] os dois botões de logout ficam bloqueados no primeiro acionamento.
- [x] formulário de login validado estaticamente com `method=post`.
- [x] todos os 39 recursos declarados no `admin/sw.js` existem.
- [x] referências administrativas de versão convergem para `1.20.15-RC1`.
- [ ] teste integrado com credencial real em GitHub Pages + Apps Script.
- [ ] medição real antes/depois das páginas protegidas.
- [ ] teste visual automatizado completo nas seis resoluções solicitadas; o Chromium headless do ambiente de revisão não concluiu a captura dentro do limite disponível.

## Testes de homologação obrigatórios após publicação
Login correto/incorreto, usuário inexistente, JavaScript desabilitado, Enter, clique repetido, retornos válidos/inválidos; logout normal, duplo clique, 10 cliques, rede lenta/offline, erro Apps Script, timeout, sessão expirada, voltar/recarregar página protegida; e responsividade em 360×800, 390×844, 412×915, 768×1024, 1366×768 e 1920×1080. Conferir também Console e Network para erros, chamadas duplicadas e os novos tempos `[SIGVTR API]`.

## Observações não corrigidas nesta etapa
- `admin/arquivamento.html` referencia `assets/css/arquivamento.css`, mas esse arquivo não existe na versão recebida. Como não está diretamente ligado às correções solicitadas e corrigir poderia alterar apresentação sem contexto, foi apenas registrado.
- Bootstrap Icons continua carregado no login. A substituição por SVG local não foi feita porque é otimização secundária e não houve medição de impacto real que justificasse aumentar o escopo.
- Cabeçalhos CSP/SRI não foram introduzidos nesta etapa; exigem homologação específica devido a GitHub Pages, CDN, scripts existentes e integração com Apps Script.

## GitHub Desktop
1. Substituir os arquivos desta entrega no repositório local.
2. Conferir o diff e confirmar que **nenhum arquivo `backend/*.gs`** aparece alterado.
3. Revisar especialmente `auth.js`, `login.js`, `api.js`, `admin.css`, `sw.js`, `manifest.json` e as mudanças de versão nos HTML.
4. Criar o commit com o texto abaixo.
5. Fazer push para a branch utilizada no projeto.
6. Publicar no GitHub Pages e executar a homologação acima.

## Apps Script
**Nenhuma atualização é necessária nesta entrega.** Não copiar arquivos `.gs`, não criar nova implantação e não alterar a URL do Web App. Uma alteração de backend somente deverá ser feita depois que os logs de tempo identificarem uma função lenta específica.

## Commit sugerido

**Título:** `fix: reforça segurança, logout e instrumentação do painel administrativo`

**Descrição:**

```text
- valida return/redirect com allowlist de páginas administrativas
- impede fallback GET com credenciais no login
- bloqueia submissões repetidas de login
- adiciona feedback imediato e trava visual no logout
- limita timeout do logout sem retry automático
- instrumenta duração das chamadas ao Apps Script sem dados sensíveis
- valida links internos e URLs de arquivos recebidas do backend
- otimiza o brasão usado no login e na sidebar
- uniformiza versão, cache e service worker em 1.20.15-RC1
- mantém backend, autorização, dados, perfis e polling inalterados
```

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
