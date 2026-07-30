# Instalação — SIGVTR v1.9.4

## Frontend

Substitua integralmente os arquivos do repositório pelos arquivos deste pacote. Confirme que o topo exibe `v1.9.4`.

Abra o endereço com `?v=1.9.4` para forçar a atualização inicial. Se estiver instalado como PWA e a versão anterior persistir, remova o atalho e instale novamente.

## Apps Script

Substitua integralmente:

- `Código.gs`
- `Complemento_Mobile_v4.gs`
- `Avarias_Pendentes.gs`

Teste primeiro na URL `/dev`. O endpoint de versão deve retornar `packageVersion: 1.9.4`. Depois publique uma nova versão da implantação `/exec`.

## Planilha

Na aba `RETIRADAS`, mantenha ou crie a coluna `Turno`. O backend também grava o turno dentro de `ITENS_JSON`.

## Teste

O envio deve ser bloqueado quando o turno não for selecionado. Teste as quatro opções disponíveis e confirme o valor salvo em `RETIRADAS`.
