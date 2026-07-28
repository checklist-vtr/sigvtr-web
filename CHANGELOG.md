# CHANGELOG

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
