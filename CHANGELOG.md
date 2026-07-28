# CHANGELOG

## [1.3.0-admin-alpha] - 2026-07-28

### Adicionado

- interface de Gestão de Avarias
- indicadores, filtros e pesquisa
- modal de detalhes e linha do tempo
- encerramento administrativo simulado
- documentação da regra oficial de avarias

### Regra de negócio

- avarias não bloqueiam automaticamente a viatura
- ocorrências permanecem vinculadas à viatura até encerramento administrativo

## [1.2.0-admin-alpha] - 2026-07-28

### Alterado

- remove o perfil Supervisor
- restringe o Painel Administrativo ao Administrador
- simplifica a validação de sessão
- atualiza a documentação de autenticação
- mantém o Checklist Mobile separado do painel

## [1.1.0-admin-auth-alpha] - 2026-07-28

### Adicionado

- Página de login administrativo
- Sessão temporária com expiração
- Proteção de rotas administrativas
- Perfis e matriz inicial de permissões
- Bloqueio após tentativas inválidas
- Lembrança opcional do e-mail
- Página de acesso negado
- Documentação da autenticação

### Alterado

- Dashboard agora exige autenticação
- Logout passa a encerrar a sessão
- Páginas reservadas agora são protegidas

### Segurança

- Credenciais atuais são exclusivas do protótipo local
- Integração real com Google Apps Script ainda não implementada
