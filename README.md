## Branch 02 — Checklist do Fiscal — v1.19.4-RC1

A Branch 02 possui dois checklists independentes, Condutor e Fiscal, utilizando a mesma API, planilha e Google Drive. A Entrega 05 acrescenta ao cadastro administrativo da viatura o controle de próxima revisão, antecedência editável e baixa manual da revisão realizada, sem alterar os checklists homologados.

# SIGVTR — Sistema Integrado de Gestão de Viaturas

## Estado atual: Branch 02 — Checklist do Fiscal — v1.19.2-RC1

O sistema possui Checklists independentes para Condutor e Fiscal, utilizando o mesmo backend, planilha, Google Drive e Painel Administrativo. A Pesquisa Global reconhece a origem dos registros de forma retrocompatível, e a Gestão de Avarias informa se a ocorrência foi registrada por Condutor ou Fiscal.

# SIGVTR — Sistema Integrado de Gestão de Viaturas

Versão administrativa: **1.19.1-RC1**. Backend: **1.9.23**.

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


## Branch 02 — Entrega 02 — Filtros e integração administrativa

- O módulo Checklists permite filtrar por `CONDUTOR` ou `FISCAL`.
- A Pesquisa Global indexa o tipo do checklist e o perfil responsável.
- Novos alertas registram a coluna `Tipo Checklist`.
- O histórico cronológico identifica Checklist do Condutor e Checklist do Fiscal.
- Registros antigos sem tipo continuam tratados como `CONDUTOR`.
- O Checklist do Condutor permanece congelado.
