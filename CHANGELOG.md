# CHANGELOG

## v1.10.2 — 03/08/2026

### Checklist do Condutor
- Adicionado **Outras alterações externas** ao final da Parte Externa.
- Adicionado **Outras alterações internas** ao final da Parte Interna.
- Mantido **Outras alterações mecânicas** na etapa Mecânica.
- Novos campos seguem as mesmas regras de descrição, fotografia, validação e geração de avaria.

### Painel Administrativo
- Substituído o alerta discreto no canto por modal centralizado e responsivo.
- Modal com cores por tipo: vermelho para avaria, azul-petróleo para checklist e verde para revisão.
- Adicionada fila para exibir vários alertas novos sem sobreposição.
- Botão direto para a Central de Alertas.

## v1.10.2 — 03/08/2026

### Adicionado

- Central de Alertas integrada ao Checklist do Condutor.
- Alertas automáticos para novo checklist e nova avaria.
- Verificação de revisão preventiva com intervalo inicial de 10.000 km.
- Abas `ALERTAS` e `REVISOES` criadas automaticamente.
- Dashboard administrativo com dados reais.
- Listagem real de checklists.
- Histórico consolidado por prefixo da viatura.
- Linha do tempo com checklists, avarias, eventos e alertas.
- Compartilhamento manual pelo WhatsApp Web, sem telefone cadastrado e sem API externa.
- Alteração e histórico de status dos alertas.

### Segurança

- Validação de ações e status no backend.
- Whitelist de status.
- Sanitização da pesquisa por prefixo.
- LockService preservado no único `doPost`.
- Logs das mudanças de status.
- Proteções existentes do Checklist do Condutor preservadas.

## v1.10.2 - 03/08/2026
- Adicionada persistência local dos últimos dados válidos do painel.
- Adicionadas tentativas automáticas e fallback para cache em falhas temporárias/404.
- Dashboard atualizado automaticamente a cada 20 segundos.
- Incluídos alertas visuais em tempo real para novos registros.
- Corrigida abertura do WhatsApp Web antes da atualização remota do status.
- Gestão de Avarias passou a consumir os registros reais da aba AVARIAS.
- Corrigida formatação de data e hora na Central de Alertas.
- Adicionado Service Worker específico do Painel Administrativo.
