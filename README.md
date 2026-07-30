# SIGVTR v1.9.10 — Checklist do Condutor

Branch exclusiva de estabilização do Checklist do Condutor do 20º BPM.

## Correções desta versão

- Avarias já registradas e novas alterações passam a ter decisões separadas.
- Quando houver avaria pendente, o grupo pergunta explicitamente se existe outra alteração no mesmo item.
- Os botões mudam para `NENHUMA OUTRA ALTERAÇÃO` e `SIM, OUTRA ALTERAÇÃO...`.
- A nova alteração continua exigindo descrição e fotografia, sem duplicar a avaria conhecida.
- Restauração do fluxo completo de envio, que estava sem a função `submit`.
- Bloqueio de envio duplicado e manutenção dos dados quando ocorrer falha.
- Timeout controlado e validação da resposta real do Apps Script.
- Confirmação de sucesso apenas quando a API retorna ID e protocolo.
- Resumo informa que novas alterações ficarão pendentes após o envio.
- Backend retorna a quantidade de novas avarias registradas.
- Identificador de requisição para reduzir duplicidade em novas tentativas.
- Cache PWA atualizado para `sigvtr-mobile-v1910`.

## Backend

Copie integralmente os arquivos de `backend/` para o mesmo projeto Apps Script:

- `Código.gs`
- `Complemento_Mobile_v4.gs`
- `Avarias_Pendentes.gs`

O projeto mantém somente um `doGet` e um `doPost`. Após salvar, crie uma nova implantação do Web App e confirme que a URL em `js/app.js` corresponde à implantação publicada.

## Publicação do frontend

Substitua os arquivos do repositório, publique no GitHub Pages e abra a aplicação com `?v=1.9.10`.
