# SIGVTR — Painel Administrativo

## Escopo desta entrega

Primeira estrutura funcional do módulo administrativo do SIGVTR.

### Incluído

- Dashboard administrativo responsivo
- Sidebar mobile e desktop
- Navbar fixa
- Tema claro e escuro
- KPIs simulados
- Atividade recente simulada
- Lista de pendências
- Estrutura de serviços para API e autenticação
- Páginas reservadas para módulos futuros

## Execução local

Abra `admin/index.html` em um navegador moderno.

Para evitar limitações de segurança do navegador durante desenvolvimento, recomenda-se usar a extensão Live Server no VS Code.

## Integração futura

O arquivo `assets/js/api.js` centralizará toda comunicação com o Google Apps Script.

O arquivo `assets/js/auth.js` será expandido para autenticação e controle de sessão.

## Regra arquitetural

Nenhuma página deve realizar chamadas diretas ao Google Apps Script. Toda comunicação deverá passar pelo `ApiService`.
