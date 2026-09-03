# Controle da Guarda — v0.6.1 — PDF robusto e performance

O PDF é gerado após o fechamento e permanece regenerável pelos dados estruturados. A cópia final é salva no Drive, mas o arquivo não é a fonte oficial. Para manter fidelidade histórica, uma regeneração considera o horário de fechamento do turno: uma VTR devolvida somente em turno posterior continua aparecendo como **EM USO NO ENCERRAMENTO** no relatório do turno de origem.

Ações backend adicionadas: `guardaBaixarPdfTurno` e `guardaRegenerarPdfTurno`. Ambas exigem sessão válida do perfil GUARDA/DEV.

---

# Controle da Guarda — Etapa 1

Versão do módulo: `0.1.0`.

Esta etapa prepara somente a fundação de dados do novo módulo. Não altera o comportamento dos checklists Condutor/Fiscal, autenticação administrativa, relatórios ou regras atuais de status das viaturas.

## Estruturas criadas

Ao executar `configurarControleGuardaEtapa1()` no Apps Script, são garantidas as abas:

- `MILITARES_GUARDA`
- `TURNOS_GUARDA`
- `MOVIMENTACOES_GUARDA`
- `TOKENS_GUARDA`

A base inicial contém 148 militares provenientes da base do Relatório de Viagem. CPF e RG são tratados como texto. Posto/Graduação, Nome de Guerra e OPM são completados progressivamente durante o uso.

## Viaturas

O Controle da Guarda consulta `VIATURAS` sem bloquear por status. O controle de disponibilidade é físico/operacional.

A opção `OUTROS` permitirá registrar Prefixo e Placa para viatura reserva/temporária ainda não cadastrada. O Prefixo é tratado como texto, preservando zeros à esquerda, por exemplo `092`. Essa operação não cria cadastro automático em `VIATURAS`.

## Instalação da Etapa 1

1. Adicionar `backend/Controle_Guarda.gs` ao projeto Apps Script.
2. Atualizar `Código.gs` com as quatro constantes de abas do módulo.
3. Salvar o projeto.
4. Executar manualmente `configurarControleGuardaEtapa1()` uma única vez e autorizar quando solicitado.
5. Conferir o retorno da função; na primeira execução, a expectativa é `base: 148`, `inseridos: 148`, `conflitos: 0`.
6. Executar `testarControleGuardaEtapa1()` e confirmar `success: true`.

A função de configuração é idempotente: uma nova execução não deve duplicar os 148 militares já importados.


## Etapa 2 — painel operacional (v0.2.0)

- Nova rota `/controle-da-guarda/`, mobile-first.
- Reutiliza sessão administrativa existente; também permite login direto na rota usando o mesmo backend de autenticação.
- Um turno aberto é recuperado automaticamente; se não houver, o operador toca apenas em **Iniciar turno**.
- Seleção de VTR sem filtro de status.
- Opção **Outros — VTR reserva** com Prefixo e Placa; o prefixo permanece textual para preservar zeros à esquerda.
- Pesquisa de militar por RG, CPF, nome e nome de guerra.
- Cadastro/complementação progressiva de Posto/Graduação, Nome de Guerra e OPM.
- A seleção VTR + militar pode ser validada pelo backend e fica pronta para a geração do QR, que entra na Etapa 3.
- Nenhuma movimentação operacional é criada ainda nesta etapa.

## Etapa 3 — retirada, QR e confirmação do condutor (v0.3.0)

Implementada a criação da movimentação de retirada vinculada ao turno aberto, emissão de token opaco de uso único com validade de 10 minutos e geração de QR Code na tela da Guarda.

O QR contém somente a URL pública de confirmação com o token. Nome, RG, CPF, KM e demais dados pessoais não são gravados diretamente no QR.

A página pública `/controle-da-guarda/confirmar/` exibe apenas os dados necessários para o condutor reconhecer a operação: VTR, Posto/Graduação + Nome de Guerra e horário da solicitação. O único dado operacional digitado pelo condutor é o KM atual.

A confirmação valida token, expiração, uso anterior, status da movimentação e KM. Para VTR cadastrada, o último KM conhecido no SIGVTR é usado como referência e a regra existente de `Math.max` continua sendo utilizada ao atualizar `KM Atual`. Para VTR `OUTROS`, não é criado cadastro automático na aba `VIATURAS`.

Enquanto o QR estiver aberto, a tela da Guarda consulta apenas aquela movimentação em intervalo leve de 5 segundos. Ao confirmar, o polling é encerrado e a Guarda recebe a confirmação automaticamente.

Se o QR expirar, o operador pode gerar novamente para a mesma retirada pendente; o token anterior é invalidado e um novo token é emitido sem duplicar a movimentação.


### Controle da Guarda 0.3.1 — correções pós-teste
- Novo perfil `GUARDA`, exclusivo do módulo e sem permissões do painel administrativo.
- Redirecionamento de contas GUARDA para `/controle-da-guarda/`.
- Prefixos de VTR reserva preservados como texto, inclusive zeros à esquerda (ex.: `025`).
- Adicionado fechamento de turno com confirmação de Posto/Graduação, RG, nome completo e nome de guerra do Comandante da Guarda.
- Logout agora exibe feedback visual imediato “Saindo...”.
- Troca obrigatória de senha do primeiro acesso ocorre dentro do próprio Controle da Guarda.


## Etapa 4 — Retirada e devolução
A tela operacional apresenta as movimentações do turno. Após confirmação da retirada, a VTR fica em **Em uso** e pode iniciar a devolução. A devolução gera novo QR de uso único, solicita KM final ao condutor, valida KM final >= KM inicial, calcula o percurso e encerra a movimentação. O botão Fechar turno oferece resposta visual imediata enquanto o resumo é consultado no backend.

## Login funcional e identificação do Comandante da Guarda
A conta GUARDA é funcional/compartilhada e não representa o militar escalado. O operador inicia e conduz o turno com essa conta. No encerramento, o militar que exerceu a função deve ser identificado separadamente. A tela permite pesquisar MILITARES_GUARDA por RG, CPF, nome completo ou nome de guerra, preenchendo Posto/Graduação, RG, Nome completo e Nome de guerra. Os campos permanecem editáveis e podem ser preenchidos manualmente caso o militar não esteja localizado. O turno fechado mantém snapshot desses dados; o PDF deve apresentar o nome do responsável e a função "Comandante da Guarda", além da confirmação eletrônica e respectiva data/hora.

## Continuidade de serviço e turno pendente (v0.5.0)
Se um comandante deixar o serviço sem encerrar seu turno, o próximo operador da conta funcional pode iniciar um novo turno. O turno anterior não é sobrescrito: passa ao status `PENDENTE_ENCERRAMENTO`.

O encerramento posterior por outro militar exige identificação do responsável e motivo do encerramento por substituto. Esse caso é registrado como `FECHADO_POR_SUBSTITUTO`.

As movimentações preservam `ID_TURNO_RETIRADA` e `ID_TURNO_DEVOLUCAO`. Assim, uma VTR retirada no turno anterior pode ser devolvida durante o turno atual sem mover ou adulterar a retirada original.


## Controle da Guarda v0.6.1 — PDF e performance
- A verificação/migração das quatro abas do Controle da Guarda agora é versionada e não reaplica formatação em todas as requisições.
- O fechamento do turno foi separado da geração do PDF: o turno é encerrado primeiro e o PDF é gerado em chamada própria com feedback visual contínuo.
- O fechamento grava a linha do turno em lote, reduzindo chamadas `setValue`.
- Adicionada `autorizarControleGuardaPdf()` para solicitar explicitamente as permissões de Google Docs/Drive antes do uso do PDF no Web App.
- Removidas atualizações redundantes da lista durante abertura/fechamento do modal de QR.

### Sessão e inatividade
A conta funcional do Controle da Guarda utiliza timeout de 30 minutos por inatividade. O backend invalida a sessão após esse período e o frontend também encerra a tela operacional após 30 minutos sem interação, retornando ao login com aviso ao operador.


### v0.6.3
O fechamento passa a enriquecer `MILITARES_GUARDA` quando o comandante informado ainda não existir. A carga inicial do painel reconcilia automaticamente VTRs em uso de turnos anteriores. PDFs usam somente data e hora no nome do arquivo.


## v0.6.4 — Reaproveitamento de VTR `OUTROS`

O histórico de `MOVIMENTACOES_GUARDA` é a memória operacional das VTRs reserva/temporárias. A interface consulta esse histórico para sugerir Prefixo, Placa e último KM confirmado. O último KM é obtido prioritariamente da devolução confirmada; na ausência dela, da retirada confirmada. A escolha de uma sugestão apenas reutiliza os dados no novo serviço e **não cria cadastro em `VIATURAS`**.

Para desempenho, o contexto inicial consolida a leitura de turnos/movimentações e listas estáveis usam cache de curta duração. O cache de militares é invalidado ao salvar/complementar cadastro e o cache de reservas é invalidado quando uma retirada/devolução de VTR `OUTROS` é confirmada.


### v0.6.5
O PDF e o resumo do fechamento usam a mesma visão operacional do painel, incluindo VTRs herdadas de turnos anteriores que permaneciam em uso no encerramento.

## v0.6.6 — performance e nome do PDF
O arquivo PDF usa `controle-da-guarda_DD-MM-AAAA_HH-mm.pdf`. O contexto operacional usa cache de 8 segundos, invalidado sempre que turno ou movimentação é alterado. Escritas críticas de confirmação foram agrupadas para reduzir chamadas ao Google Sheets, sem reduzir validações, locks ou segurança.

### Otimização adicional v0.6.6
Buscas pontuais por ID de movimentação e turno passaram a usar pesquisa exata na coluna identificadora, evitando leitura completa das abas em chamadas de status/retorno/PDF. As confirmações de retirada/devolução usam escrita agrupada de linha. O login não teve redução de segurança nem alteração no cálculo de senha.


## v0.6.7 — performance
Pesquisa de militares passou a ocorrer localmente após o contexto inicial; polling usa cache curto por movimentação e não renova sessão; início da devolução não relê a mesma linha após gravar.


## Etapa 7 — Integração com Admin > Relatórios
O painel Admin passa a oferecer o tipo **Controle da Guarda**, com filtro por período, listagem dos turnos, resumo operacional e ações para baixar/regenerar o PDF do serviço usando a mesma fonte de dados estruturados.


## Controle da Guarda v0.8.0 — segurança, concorrência e PWA/cache
- Mantém confirmações críticas sob `LockService`, protegendo contra confirmações concorrentes e duplo processamento.
- Otimiza a localização de tokens usando busca exata na coluna `TOKEN_HASH`, sem carregar toda `TOKENS_GUARDA`.
- Exclui toda a rota `/controle-da-guarda/` do cache do service worker principal.
- A página pública remove o token da barra de endereço após capturá-lo, reduzindo exposição em histórico/cópias de URL.
- Mantém token opaco, hash SHA-256 no banco, validade de 10 minutos e uso único.
- Mantém sessão funcional com timeout de 30 minutos e polling passivo sem renovação de atividade.
- Adiciona `testarControleGuardaEtapa8()` e roteiro manual `docs/CONTROLE_DA_GUARDA_TESTES_FINAIS.md`.
