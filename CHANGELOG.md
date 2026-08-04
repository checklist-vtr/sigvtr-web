## [1.14.1] - 2026-08-04

### Corrigido
- Corrige o erro `prefixo is not defined` na pesquisa do Histórico por Viatura.
- Remove o título redundante `Pilares do SIGVTR` do Dashboard, mantendo apenas `CONTROLE OPERACIONAL` e a descrição operacional.
- Atualiza o cache PWA do painel para forçar o carregamento dos arquivos corrigidos.

# CHANGELOG

## [1.14.0] - 2026-08-04

### Adicionado
- Prontuário completo por viatura com sete áreas de consulta.
- Histórico de quilometragem com diferença entre registros.
- Filtros por período e tipo de evento.
- Galeria de fotografias vinculadas aos checklists.
- Detalhamento de checklists e avarias em modal.
- Exportação do prontuário em PDF pelo recurso de impressão do navegador.

### Alterado
- Rota `adminHistoricoViatura` ampliada sem criação de novo endpoint.
- Cache administrativo versionado para `v1.14.0`.
- Dados de avarias, eventos, alertas e fotos normalizados no backend.

### Preservado
- Único `doGet()` e único `doPost()`.
- Estrutura atual da planilha, Google Drive e demais módulos.
- Banco de testes existente, sem qualquer rotina de limpeza.
# CHANGELOG

## 1.13.7-rc1 — 04/08/2026

- Reduz o intervalo de detecção de alertas para até 10 segundos com rota leve dedicada.
- Evita consultas concorrentes durante o monitoramento.
- Consulta alertas imediatamente ao retornar para a aba do painel.
- Implementa ativação real do som com Web Audio API e teste sonoro.
- Diferencia som desativado, ativado e bloqueado pelo navegador.
- Adiciona cache de 60 segundos ao índice da Pesquisa Global.
- Invalida o índice após novos checklists e alterações de status de alertas.
- Atualiza o Painel Administrativo para 1.13.7-rc1 e o backend para 1.9.18.

## 1.13.6-rc1 — 04/08/2026

### Frontend
- Otimiza a Pesquisa Global e elimina atualização acumulativa dos contadores.
- Faz o Dashboard consultar a rede real durante o monitoramento periódico.
- Exibe alertas novos ainda não apresentados mesmo na primeira abertura do painel.
- Persiste localmente apenas os IDs de alertas já mostrados, sem ocultar alertas novos.
- Recupera a confirmação do checklist pelo `idRequisicao` quando a resposta do POST é perdida.
- Impede novo envio quando o registro já foi localizado no banco.

### Backend 1.9.17
- Adiciona a rota GET `confirmarRetiradaMobile`.
- Cria o alerta administrativo imediatamente após a persistência principal do checklist.
- Recria de forma idempotente o alerta ausente durante a confirmação por `idRequisicao`.
- Otimiza a Pesquisa Global para uma única leitura por aba.
- Normaliza buscas por `50-2020`, `502020` e `2020`.

## 1.13.6-rc1 — 04/08/2026

### Painel Administrativo
- Consolida o Dashboard como centro operacional do SIGVTR.
- Adiciona os três pilares: combustível, quilometragem/revisões e avarias.
- Exibe níveis críticos de combustível com base no último checklist de cada viatura.
- Exibe revisões vencidas e próximas por quilometragem.
- Mantém avarias abertas até ação administrativa.
- Atualiza cache e Service Worker para 1.13.6-rc1.

### Backend 1.9.17
- Amplia a rota `adminDashboard` sem criar novo `doGet()`.
- Preserva um único `doGet()` e um único `doPost()`.
- Mantém compatibilidade com o Checklist do Condutor.

## [Painel Administrativo 1.13.8-rc1] - 2026-08-04

### Corrigido
- Variável de inicialização dos alertas em tempo real não declarada.
- Modal central e som não executados após a chegada de novo alerta.
- Atualização tardia dos indicadores após identificação do alerta.

### Alterado
- Cache administrativo atualizado para impedir reutilização do JavaScript anterior.
