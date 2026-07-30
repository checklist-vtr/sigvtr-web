# Atualização para v1.9.7

## Frontend

Substitua integralmente `index.html`, `js/app.js`, `css/style.css`, `sw.js`, `manifest.json`, `assets/` e `admin/`.

## Apps Script

Substitua integralmente:

- `Código.gs`;
- `Complemento_Mobile_v4.gs`;
- `Avarias_Pendentes.gs`.

Teste primeiro em `/dev`. Depois publique nova versão da implantação existente.

## Limpeza de cache

Abra o endereço com `?v=1.9.7`. Em Android instalado como PWA, feche e reabra; se necessário, remova e instale novamente.

## Teste obrigatório de regressão

1. Envie uma alteração para o prefixo externo `025`, por exemplo “Capô amassado” em Lataria Geral.
2. Inicie novo checklist para `025`.
3. Confirme o aviso na identificação.
4. Abra Parte externa e confirme o aviso dentro de Lataria Geral.
5. Informe a situação da avaria.
6. Confirme os detalhes no Resumo e envio.
7. Teste os indicadores de etapas com mouse e touchscreen.
