# CHANGELOG

## 1.13.4-rc1 — 04/08/2026

### Painel Administrativo
- Consolida o Dashboard como centro operacional do SIGVTR.
- Adiciona os três pilares: combustível, quilometragem/revisões e avarias.
- Exibe níveis críticos de combustível com base no último checklist de cada viatura.
- Exibe revisões vencidas e próximas por quilometragem.
- Mantém avarias abertas até ação administrativa.
- Atualiza cache e Service Worker para 1.13.4-rc1.

### Backend 1.9.15
- Amplia a rota `adminDashboard` sem criar novo `doGet()`.
- Preserva um único `doGet()` e um único `doPost()`.
- Mantém compatibilidade com o Checklist do Condutor.
