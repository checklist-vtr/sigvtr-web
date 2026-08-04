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
