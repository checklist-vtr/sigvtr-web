# CHANGELOG — SIGVTR v1.8.2

## Frota

- Mantida a seleção fixa de `50-2001` a `50-2021`.
- `Outro prefixo` agora aceita exclusivamente números.
- Zeros iniciais de viaturas externas são preservados.
- Backend passa a criar cadastro provisório para viaturas externas ainda não existentes.
- Inclusão da função `sincronizarFrotaFixa()` para cadastrar prefixos fixos ausentes.

## Segurança

- Validação dupla no frontend e backend.
- Bloqueio de caracteres incompatíveis com cada campo.
- Rejeição de valores que tentem iniciar fórmulas de planilha.
- Remoção de caracteres de controle.
- Limites de tamanho por campo.
- Higienização de descrições, dados do dispositivo e avarias conhecidas.

## PWA

- Cache atualizado para `sigvtr-mobile-v182`.
- Correção dos caminhos dos ícones no Service Worker.
