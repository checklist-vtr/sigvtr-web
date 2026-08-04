# ATUALIZAÇÃO — SIGVTR 1.13.4-rc1

## Objetivo
Transformar o Dashboard em uma visão operacional baseada nos pilares combustível, quilometragem preventiva e avarias.

## Frontend
Substituir a pasta `admin/` completa.

## Backend
Substituir todos os arquivos `.gs` pelos arquivos da pasta `backend/`, preservando os nomes no Apps Script. Depois, salvar e publicar uma nova versão da implantação.

## Testes
1. Abrir o Dashboard com o banco vazio e confirmar todos os valores em zero.
2. Enviar um checklist e confirmar a atualização dos indicadores.
3. Registrar combustível RESERVA ou 1/4 e confirmar o alerta no pilar Combustível.
4. Registrar avaria e confirmar o pilar Avarias.
5. Verificar o controle de revisão após atualização de KM.
