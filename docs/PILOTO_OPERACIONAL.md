# SIGVTR — Piloto Operacional v1.17.0-RC1

## Objetivo
Validar, em ambiente controlado, o fluxo completo do Checklist do Condutor até o Painel Administrativo, sem limpar a base e sem alterar a arquitetura institucional.

## Liberação gradual
1. Administrador responsável.
2. Dois condutores previamente orientados.
3. Cinco condutores em turnos distintos.
4. Ampliação somente após ausência de falhas críticas.

## Cenários obrigatórios do condutor
- Checklist sem alteração.
- Checklist com uma avaria.
- Checklist com duas ou mais avarias.
- Envio das cinco fotografias obrigatórias.
- Tentativa em conexão instável.
- Reabertura pelo PWA.
- Conferência do protocolo e da confirmação final.

## Conferência administrativa
- Novo checklist no Dashboard e no módulo Checklists.
- Modal central e som.
- Condutor, graduação, RG, prefixo, KM e status corretos.
- Cinco fotografias acessíveis.
- Avaria criada e visível na Gestão de Avarias.
- Histórico por Viatura atualizado.
- Ausência de registro duplicado.

## Critérios de interrupção
Interromper o piloto se ocorrer qualquer uma destas situações:
- checklist confirmado ao condutor sem gravação no banco;
- gravação duplicada;
- perda de fotografias;
- avaria não registrada;
- dados atribuídos a viatura ou condutor incorretos;
- falha recorrente de comunicação sem recuperação.
