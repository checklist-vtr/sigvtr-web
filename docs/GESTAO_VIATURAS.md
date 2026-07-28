# Gestão de Viaturas — SIGVTR

## Objetivo

Permitir ao Administrador cadastrar, editar, pesquisar e consultar viaturas da OPM.

## Recursos da versão v1.5

- indicadores da frota;
- pesquisa por prefixo, placa, marca ou modelo;
- filtros por situação, companhia e avarias;
- ordenação;
- cadastro de nova viatura;
- edição de dados;
- prevenção de prefixo ou placa duplicados;
- acesso direto ao Prontuário Digital.

## Situações administrativas

- Ativa
- Em manutenção
- Reserva
- Inativa

Essas situações são informativas. Uma avaria isolada não bloqueia automaticamente a viatura.

## Persistência

Nesta etapa, os cadastros e alterações são armazenados em `sessionStorage`. A integração definitiva será feita com Google Apps Script e Google Sheets.
