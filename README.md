# SIGVTR 20º BPM — Painel Administrativo v1.10.2

Primeira integração funcional entre o Checklist do Condutor e o Painel Administrativo.

## Recursos entregues

- Dashboard com dados reais do Google Sheets.
- Listagem real dos checklists recebidos.
- Alertas automáticos de checklist e nova avaria.
- Alertas de revisão preventiva por quilometragem.
- Status: NOVO, VISUALIZADO, ENCAMINHADO, RESOLVIDO e ARQUIVADO.
- Botão único de compartilhamento manual pelo WhatsApp Web.
- Busca e linha do tempo completa por prefixo da viatura.
- Histórico permanente, sem exclusão automática.
- Backend compartilhado mantendo somente um `doGet` e um `doPost`.

## Backend

Copie para o mesmo projeto Apps Script:

- `backend/Código.gs`
- `backend/Complemento_Mobile_v4.gs`
- `backend/Avarias_Pendentes.gs`
- `backend/Painel_Administrativo.gs`

Execute `configurarSistema()` uma vez. A função cria e valida as abas `ALERTAS` e `REVISOES`.

Depois crie uma nova versão da implantação do Aplicativo da Web.

## Frontend

Publique todos os arquivos no GitHub Pages. O painel está na pasta `admin/`.

A URL da API fica em `admin/assets/js/api.js`. A entrega preserva a URL encontrada no projeto recebido. Caso a nova implantação gere outra URL, substitua somente esse valor.

## Teste mínimo

1. Envie um novo checklist.
2. Abra `admin/index.html` e confirme os indicadores.
3. Abra `admin/alertas.html` e confirme os alertas.
4. Clique em **Compartilhar no WhatsApp**.
5. Pesquise a viatura em `admin/historico-viatura.html`.
6. Altere o status de um alerta e confirme a persistência na aba `ALERTAS`.

### Resiliência do Painel (v1.10.2)
O Painel Administrativo mantém localmente a última resposta válida de cada consulta. Em falhas temporárias de internet ou do Apps Script, os dados salvos continuam visíveis com aviso de modo offline. O Dashboard realiza atualização automática a cada 20 segundos e exibe notificações visuais quando novos alertas são encontrados.


## Complementos da v1.10.2

O Checklist do Condutor inclui agora campos genéricos para alterações não previstas nas etapas externa, interna e mecânica. No Dashboard, novos alertas são apresentados em modal central responsivo, com diferenciação visual por tipo de ocorrência.


## Painel Administrativo 1.13.2-rc1
- Dados de viaturas, prontuários, checklists e avarias são carregados exclusivamente da API/Google Sheets.
- Dados fictícios e sementes locais foram removidos.
- Brasão oficial do 20º BPM aplicado ao login e à navegação administrativa.
- E-mail de sugestões: checklist.viaturas.oficial@gmail.com.
- O controle de KM alimentará alertas de troca de óleo e revisão; combustível e avarias são pilares operacionais.

### Backend
Substitua os arquivos do Apps Script pelos arquivos da pasta `backend/` e publique uma nova versão da implantação Web App.
