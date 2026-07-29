# SIGVTR v1.8.3 — Instalação

## Regra operacional desta versão

O Checklist Mobile não consulta a aba `USUARIOS` para autorizar o condutor. O militar informa nome e RG, e o SIGVTR registra esses dados. A conferência de escala ocorre fora deste módulo.

## Apps Script

Substitua integralmente os seguintes arquivos pelos arquivos da pasta `backend_apps_script`:

- `Código.gs`
- `Complemento_Mobile_v4.gs`
- `Avarias_Pendentes.gs`

Em cada arquivo: `Ctrl + A`, cole todo o conteúdo correspondente e salve com `Ctrl + S`.

## Conferência

- `function doGet` deve existir apenas em `Código.gs`.
- `function doPost` deve existir apenas em `Complemento_Mobile_v4.gs`.
- A mensagem `Usuário não encontrado para o RG informado` não deve existir no projeto.

## Teste no /dev

A URL sem parâmetros deve retornar `packageVersion: 1.8.3`.

Faça um checklist usando um RG numérico que não esteja na aba `USUARIOS`. O registro deve ser concluído normalmente.

## Publicação

Após o teste no `/dev`, edite a implantação pública, selecione `Nova versão` e publique como `SIGVTR Backend v1.8.3`.
