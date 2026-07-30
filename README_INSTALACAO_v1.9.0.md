# SIGVTR v1.9.0 — Instalação

## Escopo desta entrega
- Checklist do Condutor simplificado.
- Remoção de Equipe, turno e posto/graduação do fluxo do condutor.
- Fotos iniciais de odômetro e combustível.
- Foto obrigatória para cada item marcado como Com alteração.
- Quatro fotos finais: frente, traseira e laterais.
- Avarias pendentes exibidas no início e dentro do item correspondente.
- Avarias permanecem visíveis até a administração alterar a situação na aba/painel de avarias.

## Apps Script
Substitua integralmente:
1. Código.gs
2. Complemento_Mobile_v4.gs
3. Avarias_Pendentes.gs

Salve e teste pela URL /dev. O retorno de status deve informar packageVersion 1.9.0.
Depois edite a implantação /exec, selecione Nova versão e implante.

## Frontend
Substitua integralmente index.html, css/style.css, js/app.js e sw.js. O diretório admin não foi alterado.
Após publicar, faça atualização forçada ou remova o Service Worker antigo.

## Observação sobre avarias
O Checklist Mobile não possui função para resolver ou apagar avaria. Somente o painel administrativo deve alterar a situação para RESOLVIDA/SOLUCIONADA. A rota pública só lista PENDENTE e EM MANUTENÇÃO.
