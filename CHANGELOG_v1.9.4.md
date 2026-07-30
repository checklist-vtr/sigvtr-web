# CHANGELOG — SIGVTR v1.9.4

## Correção

- Corrigida a validação do campo Turno no envio do Checklist do Condutor.
- O frontend passa a enviar códigos internos estáveis: `TURNO_1`, `TURNO_2`, `EXTRAORDINARIO` e `OUTROS`.
- O backend converte os códigos para os rótulos oficiais gravados na planilha.
- O backend também aceita valores legados e variações do símbolo ordinal, evitando falhas por codificação Unicode.
- Cache do PWA atualizado para `sigvtr-mobile-v194`.
