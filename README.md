# SIGVTR — Sistema Integrado de Gestão de Viaturas

Sistema exclusivo do 20º Batalhão da Polícia Militar do Pará.

## Versões
- Painel Administrativo: 1.13.7-rc1
- Backend: 1.9.18

## Arquitetura
- Frontend: HTML, CSS, Bootstrap, JavaScript e PWA.
- Backend: Google Apps Script.
- Banco: Google Sheets.
- Fotografias: Google Drive.
- API: um único `doGet()` e um único `doPost()`.

## Pilares operacionais
O painel utiliza combustível, quilometragem preventiva e avarias como base da gestão da frota. O KM alimenta alertas de troca de óleo e revisão, enquanto as avarias permanecem registradas até ação administrativa.

## Contato
Sugestões e melhorias: checklist.viaturas.oficial@gmail.com


## Painel Administrativo — Etapa 3 (v1.14.0)

O módulo **Histórico por Viatura** fornece prontuário consolidado, exclusivamente com dados reais do backend: dados cadastrais, evolução de quilometragem, checklists, avarias, fotografias, eventos, alertas, linha do tempo e exportação por impressão/PDF. A consulta aceita prefixos completos ou numéricos e mantém a arquitetura de um único `doGet()` e um único `doPost()`.
