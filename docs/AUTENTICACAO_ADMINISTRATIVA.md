# Autenticação Administrativa — SIGVTR

## Escopo

A autenticação administrativa é validada exclusivamente pelo Google Apps Script. O navegador não é fonte de verdade para identidade, perfil ou autorização.

Perfis iniciais:

- CMD — conta individual do ocupante atual da função, com autoridade operacional e sem administração técnica do sistema.
- SUBCMD — conta individual do ocupante atual da função, com autoridade operacional e sem administração técnica do sistema.
- FISCAL — credencial funcional compartilhada pela P4, permitindo múltiplas sessões simultâneas.
- DEV — conta técnica com acesso integral para manutenção, administração de segurança, gerenciamento de usuários e redefinição de senhas.

## Sessões

Cada login válido recebe um token opaco próprio. O token bruto permanece apenas no `sessionStorage` do navegador e nunca é gravado na planilha. A aba `SESSOES_ADMIN` armazena somente o hash do token.

A sessão expira após 30 minutos de inatividade ou 8 horas de duração absoluta. Logout, alteração/redefinição de senha, desativação ou alteração relevante de conta podem revogar sessões existentes.

Múltiplas sessões simultâneas são permitidas. Isso é obrigatório para a conta funcional FISCAL/P4.

## Senhas

Nenhuma senha é armazenada em texto puro. Cada conta utiliza salt individual e HMAC-SHA-256 iterativo com pepper secreto mantido em Script Properties.

O Google Apps Script não possui bcrypt, Argon2 ou PBKDF2 nativos. Esta implementação evita dependências externas e usa o mecanismo criptográfico viável dentro da arquitetura atual. O fator de trabalho está centralizado no backend e pode ser revisto futuramente.

Regras iniciais:

- mínimo de 12 caracteres;
- maiúscula, minúscula, número e caractere especial;
- senha diferente do login/perfil;
- bloqueio temporário após 5 falhas consecutivas;
- troca obrigatória de senha temporária;
- nenhuma recuperação da senha anterior: somente redefinição.

## Bootstrap inicial

1. Execute `configurarSegredosAutenticacao_()` no editor do Apps Script. Ela cria `PASSWORD_PEPPER` e `SESSION_SECRET` diretamente em Script Properties, caso ainda não existam.
2. Em **Configurações do projeto → Propriedades do script**, crie temporariamente:
   - `INITIAL_PASSWORD_CMD`
   - `INITIAL_PASSWORD_SUBCMD`
   - `INITIAL_PASSWORD_FISCAL`
   - `INITIAL_PASSWORD_DEV`
3. Informe senhas temporárias fortes, diferentes entre si.
4. Execute manualmente `bootstrapInitialUsers_()`.
5. A função cria/atualiza CMD, SUBCMD, FISCAL e DEV, exige troca no primeiro login e apaga automaticamente as quatro propriedades `INITIAL_PASSWORD_*`.
6. O bootstrap é marcado como concluído para impedir repetição acidental.

Nunca coloque essas senhas no código, GitHub, README, comentários ou arquivos JSON.

## Gestão de usuários

A página `admin/usuarios.html` permite ao DEV:

- listar contas administrativas;
- criar/editar conta;
- editar nome, login e perfil;
- ativar/desativar;
- redefinir senha temporária;
- encerrar todas as sessões.

Não há exclusão física de contas.

## APIs administrativas

As operações administrativas usam POST autenticado. O token não é colocado em URL/GET. Cada ação administrativa é novamente autorizada no backend pela matriz RBAC.

As rotas públicas necessárias aos checklists Condutor/Fiscal permanecem independentes da autenticação administrativa.


## Ajustes v1.20.1-RC1
- Mantido o mesmo fator criptográfico de 4096 iterações; nenhuma redução de segurança foi aplicada para ganho de velocidade. A conversão interna para hexadecimal foi otimizada sem alterar o resultado dos hashes existentes.
- Buscas de usuário e sessão passaram a localizar apenas a linha necessária, evitando leitura integral das abas em cada validação.
- A gravação de `ULTIMA_ATIVIDADE` é limitada a intervalos de 2 minutos; o timeout de inatividade permanece em 30 minutos e pode expirar de forma conservadora alguns segundos/minutos antes, nunca depois do limite por causa dessa otimização.
- A troca obrigatória do primeiro acesso continua verificando novamente a senha temporária atual e aplicando o KDF completo na nova senha; essa defesa em profundidade foi preservada mesmo com impacto de tempo.
- O botão **Sair** ficou visível também na barra superior e continua executando logout real no backend.
- As funções públicas `configurarSegredosAutenticacao()` e `bootstrapInitialUsers()` passam a integrar oficialmente o arquivo versionado, apenas como wrappers das rotinas privadas de instalação manual.

---

## Estado documental — Relatórios 2.3.2 (2026-08-18)

Este documento integra a documentação vigente do SIGVTR. Na versão Relatórios 2.3.2, a impressão/PDF do módulo administrativo passou a adotar fonte mínima de 10 pt na tabela e no cabeçalho, quebra controlada de texto e distribuição semântica de largura das colunas. A mudança é exclusivamente de apresentação do relatório: não altera os dados, regras de negócio, CSV, backend ou Google Apps Script.

Para implantação desta atualização, publicar os arquivos de frontend normalmente. O Service Worker administrativo foi versionado para renovar o cache; não é necessária nova implantação do Apps Script por causa desta correção de Relatórios.

## Cache curto de validação — v1.20.20-RC1

Para reduzir leituras repetidas de `SESSOES_ADMIN` e `USUARIOS`, uma sessão já validada pode ser mantida no `CacheService` por até 60 segundos. O cache é uma otimização transitória e nunca substitui as abas como fonte oficial. O conteúdo inclui somente os dados necessários do usuário, expiração, última atividade e a versão de segurança do usuário.

A validação completa volta ao Sheets quando o cache expira, é removido ou a versão de segurança muda. `adminLogout_` sempre força validação oficial e remove o cache do token. `adminRevokeAllSessions_` altera a versão de segurança do usuário antes de revogar as sessões, fazendo com que caches aquecidos deixem de ser aceitos após troca/redefinição de senha, alteração de perfil, desativação ou encerramento de sessões.

Os logs distinguem explicitamente `adminValidateSession_ CACHE HIT` e `adminValidateSession_ SHEETS`, permitindo medir o ganho sem registrar tokens ou senhas.

