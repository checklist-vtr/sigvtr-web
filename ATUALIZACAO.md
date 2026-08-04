# ATUALIZAÇÃO — SIGVTR

## Painel Administrativo 1.13.8-rc1

Correção emergencial do monitoramento em tempo real.

### Correções

- Declara corretamente o estado interno `initializedAlerts`.
- Remove o erro silencioso que interrompia o processamento de novos alertas.
- Restaura a abertura do modal centralizado no Dashboard.
- Restaura a chamada do aviso sonoro quando o som estiver ativado.
- Atualiza o Dashboard imediatamente após a identificação de um novo alerta.
- Mantém verificação periódica de 10 segundos com bloqueio de chamadas simultâneas.
- Adiciona aviso técnico no console quando a consulta de alertas falhar.
- Atualiza o cache administrativo para `sigvtr-admin-v1138rc1`.

### Backend

Nenhuma substituição de backend é necessária nesta atualização.
