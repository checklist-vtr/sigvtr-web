# ATUALIZAÇÃO — SIGVTR v1.18.1-RC1

## Escopo

Esta versão conclui a Gestão de Viaturas com atualização administrativa em massa e padroniza o rodapé institucional. O fluxo do Checklist do Condutor não foi alterado.

## Frontend alterado

- `index.html`
- `css/style.css`
- `sw.js`
- páginas HTML do diretório `admin/` para atualização de versão
- `admin/viaturas.html`
- `admin/assets/js/viaturas.js`
- `admin/assets/js/admin-layout.js`
- `admin/assets/css/viaturas.css`
- `admin/sw.js`

## Backend alterado

- `backend/Código.gs`
- `backend/Complemento_Mobile_v4.gs`
- `backend/Painel_Administrativo.gs`

O backend passa a usar o pacote `1.9.23`. Esta é uma entrega completa: os arquivos do backend devem ser adicionados ao Git e também substituídos no projeto do Google Apps Script.

## Nova ação interna

- `adminAtualizarViaturasEmMassa`

A ação utiliza o `doPost()` existente. Nenhum novo `doPost()` ou endpoint foi criado.

## Publicação

1. Substitua os arquivos do frontend.
2. Adicione a pasta `backend` ao repositório Git.
3. Faça commit e push.
4. Substitua no Apps Script somente `Código.gs`, `Complemento_Mobile_v4.gs` e `Painel_Administrativo.gs`.
5. Edite a implantação Web App existente e selecione **Nova versão**.
6. Use a descrição `SIGVTR v1.18.1-RC1 — Gestão de Viaturas finalizada`.
7. Limpe o cache e os Service Workers do checklist e do painel administrativo.

## Teste principal

Selecione `50-2001` a `50-2020`, escolha o campo **Modelo**, informe `S10` e confirme. Depois edite `50-2021` individualmente como Duster. Confira que placa, chassi, motor, RENAVAM e KM permaneceram inalterados.
