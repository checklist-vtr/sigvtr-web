# SIGVTR — Sistema Integrado de Gestão de Viaturas

Sistema operacional exclusivo do 20º BPM da Polícia Militar do Pará.

## Versão atual

- Piloto operacional: **v1.17.0-RC1**
- Backend: **pacote 1.9.21 / API 2.0**
- Branch de desenvolvimento: `feature/painel-administrativo-v1`

## Arquitetura

- Frontend: HTML, CSS, Bootstrap, JavaScript puro e PWA.
- Backend: Google Apps Script, Google Sheets e Google Drive.
- Arquitetura obrigatória: um único `doGet()` e um único `doPost()` com roteamento interno.

## Módulos operacionais do piloto

- Checklist do Condutor.
- Dashboard e alertas em tempo real.
- Pesquisa Global.
- Histórico por Viatura.
- Checklists administrativos.
- Gestão de Avarias.
- Viaturas e Prontuário.
- Arquivamento.

Relatórios, Usuários e Configurações permanecem em desenvolvimento e não impedem o piloto com os condutores.

## Retenção

Registros operacionais não são excluídos automaticamente. A retenção mínima prevista é de cinco anos, com arquivamento controlado e validação administrativa.

## Documentação

- `ATUALIZACAO.md`: publicação e testes da versão atual.
- `CHANGELOG.md`: histórico consolidado.
- `docs/PILOTO_OPERACIONAL.md`: roteiro do piloto.
- `docs/FICHA_TESTES_PILOTO.md`: ficha para registro de resultados.

## Contato

checklist.viaturas.oficial@gmail.com
