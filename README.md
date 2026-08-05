# SIGVTR — Sistema Integrado de Gestão de Viaturas

Versão administrativa: **1.18.0-RC1**. Backend: **1.9.22**.

Sistema operacional exclusivo do 20º BPM/PMPA. O Checklist do Condutor permanece congelado e sem alterações nesta versão.

## Escopo atual

- Checklist do Condutor e fotos;
- Dashboard e alertas;
- Histórico por Viatura;
- Checklists administrativos;
- Gestão de Avarias;
- Cadastro mestre da frota e viaturas reserva;
- Controle administrativo de quilometragem.

## Arquitetura

Frontend HTML, CSS, Bootstrap e JavaScript puro/PWA. Backend Google Apps Script, Google Sheets e Google Drive, com somente um `doGet()` e um `doPost()`.

## Gestão de Viaturas — ações em massa

A partir da versão 1.18.1-RC1, o administrador pode selecionar viaturas e atualizar coletivamente campos administrativos comuns: marca, modelo, ano, combustível, tipo, lotação, situação e observações. Campos documentais, prefixo e quilometragem permanecem exclusivamente individuais.

Toda atualização coletiva é registrada na aba `LOGS`. O Checklist do Condutor continua com o mesmo fluxo operacional, recebendo apenas o rodapé institucional com o e-mail `checklist.viaturas.oficial@gmail.com`.

## Checklist do Fiscal — Branch 02

A Branch `feature/checklist-fiscal-v1` adiciona um frontend independente em `/fiscal/`, preservando integralmente o Checklist do Condutor na raiz. O novo checklist utiliza o mesmo backend, planilha e Google Drive e envia `tipoChecklist: FISCAL`. Registros antigos ou sem identificação continuam sendo tratados como `CONDUTOR`.
