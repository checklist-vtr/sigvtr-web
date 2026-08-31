## Relatórios 2.3.2 — legibilidade de impressão/PDF (2026-08-18)

A impressão dos Relatórios foi ajustada com prioridade explícita para legibilidade e acessibilidade. A tabela impressa passa a ter **10 pt como piso absoluto**, inclusive no cabeçalho. Relatórios com até 5 colunas usam corpo de 11 pt e cabeçalho de 10 pt; com 6 a 8 colunas, corpo de 10,5 pt e cabeçalho de 10 pt; com 9 ou mais, corpo e cabeçalho de 10 pt. A orientação continua automática: retrato até 5 colunas e paisagem a partir de 6.

Para evitar a antiga compactação excessiva, cabeçalhos e células podem quebrar texto de forma controlada, linhas podem crescer verticalmente e a tabela usa layout fixo no documento impresso. Campos curtos recebem menos espaço e campos textuais recebem mais espaço por identificação semântica da coluna. O cabeçalho da tabela é configurado para repetição em páginas seguintes quando suportado pelo navegador, e linhas tentam evitar quebra entre páginas.

A alteração não muda filtros, seleção de colunas, dados, cálculos, CSV, relatórios rápidos, regras de negócio, Google Sheets, APIs ou Apps Script. Não foi adicionada biblioteca de PDF: a solução permanece baseada em CSS de impressão e `window.print()`. O cache administrativo foi renovado para distribuir os novos arquivos de frontend.

---

## Modernização visual dos Checklists Condutor e Fiscal — 2026-08

Os dois checklists receberam modernização exclusivamente visual, preservando integralmente regras, campos, IDs, eventos, validações, fotos, avarias, submissão, API e backend. O padrão visual compartilhado passa a priorizar tipografia legível, cards com melhor hierarquia, controles com áreas de toque maiores, estados visuais claros, melhor contraste, foco por teclado e responsividade mobile-first.

Arquivos funcionais JavaScript e Google Apps Script não foram alterados. Os Service Workers foram versionados somente para renovação do cache dos arquivos de frontend.

- Condutor: frontend/cache `v1.18.4-RC1`.
- Fiscal: frontend/cache `v1.19.11-RC1`.
- Sem nova dependência externa, framework, fonte remota ou biblioteca.
- Sem necessidade de nova implantação do Google Apps Script.

---

## Branch 02 — Checklist do Fiscal — v1.19.4-RC1

A Branch 02 possui dois checklists independentes, Condutor e Fiscal, utilizando a mesma API, planilha e Google Drive. A Entrega 05 acrescenta ao cadastro administrativo da viatura o controle de próxima revisão, antecedência editável e baixa manual da revisão realizada, sem alterar os checklists homologados.

# SIGVTR — Sistema Integrado de Gestão de Viaturas

## Estado atual: Branch 02 — Checklist do Fiscal — v1.19.2-RC1

O sistema possui Checklists independentes para Condutor e Fiscal, utilizando o mesmo backend, planilha, Google Drive e Painel Administrativo. A Pesquisa Global reconhece a origem dos registros de forma retrocompatível, e a Gestão de Avarias informa se a ocorrência foi registrada por Condutor ou Fiscal.

# SIGVTR — Sistema Integrado de Gestão de Viaturas

Versão administrativa: **1.19.1-RC1**. Backend: **1.9.23**.

Sistema operacional exclusivo do 20º BPM/PMPA. O Checklist do Condutor permanece congelado e sem alterações nesta versão.

## Escopo atual

- Checklist do Condutor e fotos;
- Dashboard e alertas;
- Histórico por Viatura;
- Checklists administrativos;
- Gestão de Avarias;
- Cadastro mestre da frota e viaturas reserva;
- Controle administrativo de quilometragem.

## Arquitetura

Frontend HTML, CSS, Bootstrap e JavaScript puro/PWA. Backend Google Apps Script, Google Sheets e Google Drive, com somente um `doGet()` e um `doPost()`.

## Gestão de Viaturas — ações em massa

A partir da versão 1.18.1-RC1, o administrador pode selecionar viaturas e atualizar coletivamente campos administrativos comuns: marca, modelo, ano, combustível, tipo, lotação, situação e observações. Campos documentais, prefixo e quilometragem permanecem exclusivamente individuais.

Toda atualização coletiva é registrada na aba `LOGS`. O Checklist do Condutor continua com o mesmo fluxo operacional, recebendo apenas o rodapé institucional com o e-mail `checklist.viaturas.oficial@gmail.com`.

## Checklist do Fiscal — Branch 02

A Branch `feature/checklist-fiscal-v1` adiciona um frontend independente em `/fiscal/`, preservando integralmente o Checklist do Condutor na raiz. O novo checklist utiliza o mesmo backend, planilha e Google Drive e envia `tipoChecklist: FISCAL`. Registros antigos ou sem identificação continuam sendo tratados como `CONDUTOR`.


## Branch 02 — Entrega 02 — Filtros e integração administrativa

- O módulo Checklists permite filtrar por `CONDUTOR` ou `FISCAL`.
- A Pesquisa Global indexa o tipo do checklist e o perfil responsável.
- Novos alertas registram a coluna `Tipo Checklist`.
- O histórico cronológico identifica Checklist do Condutor e Checklist do Fiscal.
- Registros antigos sem tipo continuam tratados como `CONDUTOR`.
- O Checklist do Condutor permanece congelado.


### Correção v1.19.5-RC1
O Checklist do Fiscal envia identificação explícita `FISCAL`, e o Painel possui resolução retrocompatível da origem e cache administrativo renovado.


### Branch 02 — v1.19.6-RC1
O Fiscal utiliza rota exclusiva no backend, garantindo classificação por formulário e não por militar. O cadastro de viaturas possui recuperação defensiva dos campos de revisão.



### Relatórios 2.3 — Modernização visual e acessibilidade
A página **Relatórios** passa a ser o piloto visual do SIGVTR, com tipografia maior, melhor hierarquia de títulos, controles com áreas clicáveis mais amplas, cards de resumo mais legíveis, tabela com maior espaçamento, estados de foco visíveis e ajustes específicos para celular e impressão/PDF.

A modernização é **somente de frontend/CSS**, sem framework novo, sem biblioteca adicional e sem alteração das regras de negócio ou consultas do Relatórios 2.2. O objetivo é melhorar leitura e acessibilidade mantendo o desempenho e a identidade visual já aprovada.

### Relatórios 2.2 — Cartões vinculados e Assistente IA alinhado aos Relatórios
O gerador de relatórios passa a disponibilizar **Cartões vinculados** nas consultas de Checklists, Frota, Combustível e Quilometragem/Revisões, relacionando o cartão à viatura por ID/prefixo já existente no cadastro. O relatório específico de Cartões e o Relatório Personalizado permanecem disponíveis.

O **Assistente SIGVTR IA** passa a consultar as mesmas funções somente leitura do Relatórios 2.x para Frota, Cartões, Checklists, Combustível, Avarias e Quilometragem/Revisões. Assim, perguntas sobre status da frota, Data do Status, viaturas indisponíveis/baixadas/reserva, cartões vinculados e revisões usam os mesmos dados consolidados do gerador de relatórios, sem duplicar regras de negócio.

### Relatórios 2.1.1
O relatório de Frota inclui resumo gerencial dinâmico e a Data do Status da viatura. A data é registrada automaticamente nas novas mudanças de status. O resumo contabiliza também os status **INDISPONIVEL** e **MANUTENCAO**, permitindo visualizar imediatamente viaturas temporariamente fora do serviço, como em viagens ou manutenções.


### Relatórios 2.3.1
As ações **Gerar relatório**, **Exportar CSV** e **Imprimir / Salvar PDF** ficam agrupadas no final do seletor de informações. Exportações só são habilitadas após a geração. A impressão ajusta automaticamente orientação e densidade conforme a quantidade de colunas selecionadas.


### Ajustes administrativos — Cartões e Viaturas
O modal de cartões mantém o rodapé com **Salvar cartão** acessível em zoom 100%, usando rolagem interna apenas no corpo do formulário quando necessário. A ação **Importar frota oficial** não é mais exibida em Viaturas após a carga inicial; o backend correspondente permanece preservado apenas para contingência técnica.


## Histórico permanente de Status da Frota

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

## Nota de desempenho - Otimização 02
Esta versão reduz trabalho de manutenção estrutural durante rotas de leitura, diminui polling administrativo pesado e melhora o tempo percebido da página de Viaturas com cache de sessão + revalidação em segundo plano. O histórico operacional permanece intacto e continua sendo lido do backend; não houve remoção de dados nem alteração das regras de autenticação/permissão.

## Otimização 03 - desempenho administrativo

A versão 1.20.19-RC1 introduz um marcador de versão de alertas em `PropertiesService` para que o polling não precise consultar a planilha quando nada mudou. Também adiciona caches operacionais de leitura com TTL de 30 segundos para Dashboard e Viaturas, sempre com Google Sheets como fonte oficial e com invalidação nas alterações relevantes. O logout cancela o polling antes de revogar a sessão.

## Otimização 04 - cache curto de autenticação administrativa

A versão 1.20.20-RC1 reduz o custo de `adminValidateSession_` usando `CacheService` por até 60 segundos somente após uma validação completa da sessão. O cache não substitui `SESSOES_ADMIN`/`USUARIOS`, respeita expiração absoluta e ociosa e é invalidado em logout e nas revogações de sessão associadas a senha, perfil, status do usuário ou ação do DEV. Não há alteração de frontend nesta entrega.



## Sessão visual por inatividade — v1.20.22-RC1
- contador regressivo de 30 minutos no cabeçalho administrativo;
- destaque visual nos últimos 5 minutos e modal obrigatório nos últimos 2 minutos;
- botão **Continuar conectado** renova a sessão no backend e preserva o formulário atual;
- logout automático ao zerar o contador;
- limite absoluto de 8 horas permanece obrigatório;
- polling de alertas valida a sessão de forma passiva e não renova a inatividade;
- movimento do mouse não renova a sessão; interações reais em controles/formulários podem renovar com throttle de 2 minutos.

### Controle da Guarda (em implementação)

A fundação de dados do módulo Controle da Guarda está disponível a partir da versão interna `0.1.0`. O fluxo operacional e a rota `/controle-da-guarda/` serão adicionados nas próximas etapas. Veja `docs/CONTROLE_DA_GUARDA.md`.

