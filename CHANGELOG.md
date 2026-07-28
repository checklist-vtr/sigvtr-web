# CHANGELOG

## [1.6.1-admin-visual] - 2026-07-28

### Adicionado

- favicon inspirado na Chevrolet S10 operacional com xadrez
- ícones para navegador, Android, iOS e PWA
- manifest do Painel Administrativo
- versionamento dos ícones para evitar cache

## [1.6.0-admin-alpha] - 2026-07-28

### Adicionado

- categorias Lataria, Sinalização, Equipamentos, Estrutura, Freios e Outros
- campo Componente na ocorrência
- edição administrativa de avarias
- edição de dados no Prontuário Digital
- sincronização temporária entre Viaturas, Avarias e Prontuário

### Mantido

- encerramento administrativo de avarias
- regra de não bloqueio automático da viatura

### Pendente em outra branch

- prevenção de avaria duplicada no Checklist Mobile

## [1.5.0-admin-alpha] - 2026-07-28

### Adicionado

- Gestão de Viaturas
- indicadores da frota
- pesquisa, filtros e ordenação
- cadastro de nova viatura
- edição de dados cadastrais
- validação de prefixo e placa duplicados
- acesso direto ao Prontuário Digital
- persistência temporária em sessionStorage

## [1.4.1-admin-hotfix] - 2026-07-28

### Corrigido

- incompatibilidade entre `login.js` e `auth.js`
- sessão administrativa não criada no GitHub Pages
- redirecionamento após autenticação
- recuperação do e-mail lembrado
- contagem regressiva de bloqueio por tentativas

### Melhorado

- adiciona versionamento `?v=1.4.1` aos scripts locais
- reduz risco de cache antigo no GitHub Pages

## [1.4.0-admin-alpha] - 2026-07-28

### Adicionado

- Prontuário Digital da Viatura
- seleção de viaturas
- resumo cadastral
- indicadores de quilometragem, combustível, checklists e avarias
- abas de avarias, checklists e histórico
- integração visual entre Gestão de Avarias e Prontuário

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
