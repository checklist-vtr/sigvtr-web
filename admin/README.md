# SIGVTR — Painel Administrativo v1.1

## Entrega atual

- Dashboard administrativo responsivo
- Login administrativo em modo protótipo
- Sessão com duração de 8 horas
- Proteção de rotas
- Controle inicial de permissões por perfil
- Bloqueio local após cinco tentativas inválidas
- Bloqueio temporário de cinco minutos
- Logout com remoção da sessão
- Opção de lembrar apenas o e-mail
- Redirecionamento para a página originalmente solicitada

## Credenciais temporárias

- E-mail: `admin@sigvtr.local`
- Senha: `SIGVTR@2026`

Estas credenciais existem somente para testes locais e devem ser removidas na integração com o Google Apps Script.

## Execução

Use o Live Server do VS Code e abra `admin/login.html`.

## Limitação de segurança

A autenticação desta versão ocorre no navegador. Ela valida fluxo, interface, sessão e permissões, mas não representa autenticação segura de produção. A próxima integração deverá validar credenciais exclusivamente no backend e retornar uma sessão assinada ou token temporário.

## Perfil de acesso

O Painel Administrativo é exclusivo para o perfil **Administrador**.


## Gestão de Avarias — v1.3

Inclui indicadores, filtros, pesquisa, tabela responsiva, detalhes, fotos simuladas, linha do tempo e encerramento administrativo simulado.

Regra oficial: uma avaria não bloqueia automaticamente a viatura.


## Prontuário Digital — v1.4

A página `prontuario.html` centraliza dados cadastrais, indicadores, avarias, checklists e linha do tempo da viatura.

O botão “Ver prontuário” da Gestão de Avarias agora direciona para a viatura correspondente.


## Hotfix de autenticação — v1.4.1

Corrigida a incompatibilidade entre `login.js` e `auth.js` que impedia a criação da sessão no GitHub Pages.

Após publicar, faça uma atualização forçada no navegador:

- Windows/Linux: `Ctrl + F5` ou `Ctrl + Shift + R`
- macOS: `Command + Shift + R`


## Gestão de Viaturas — v1.5

A página `viaturas.html` agora oferece cadastro, edição, indicadores, filtros e acesso direto ao Prontuário Digital.

Os dados são simulados e as alterações permanecem durante a sessão do navegador.
