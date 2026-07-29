# CHANGELOG — SIGVTR v1.8.3

Data: 29/07/2026

## Checklist Mobile

- Removido o bloqueio que exigia que o RG do condutor estivesse cadastrado na aba `USUARIOS`.
- O RG passa a ser usado apenas como identificação operacional do checklist.
- Mantida a validação de RG exclusivamente numérico.
- Mantidas todas as regras de higienização e proteção contra fórmulas e caracteres indevidos.
- O campo `ID_USUARIO` da retirada mobile é gravado vazio, sem impedir o registro.
- O nome informado em `Condutor` é preservado como motorista da retirada.

## Escopo

O SIGVTR não valida escala, autorização ou vínculo do militar no Checklist Mobile. Esse controle ocorre externamente. O sistema registra a retirada, a viatura, o condutor, o RG, a equipe, a inspeção, as fotos e as avarias.
