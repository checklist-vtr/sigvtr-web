# Autenticação Administrativa — SIGVTR

## Escopo

O Painel Administrativo possui apenas um perfil de acesso:

- Administrador

Condutores e demais usuários operacionais não acessam este módulo. O uso deles permanece restrito ao Checklist Mobile.

## Fluxo

1. O administrador acessa `login.html`.
2. As credenciais são validadas.
3. Uma sessão temporária é criada no navegador.
4. As páginas administrativas verificam a sessão antes de carregar.
5. O logout remove a sessão e retorna ao login.

## Protótipo local

Nesta versão, as credenciais são temporárias e ficam no JavaScript apenas para validação da interface e do fluxo.

Credenciais:

- E-mail: `admin@sigvtr.local`
- Senha: `SIGVTR@2026`

## Produção

Na integração oficial:

- a validação deverá ocorrer no Google Apps Script;
- nenhuma senha deverá permanecer no frontend;
- a senha deverá ser armazenada com hash e salt;
- tentativas de login deverão gerar registros de auditoria;
- a sessão deverá ser emitida e validada pelo backend;
- apenas administradores ativos poderão acessar o painel.
