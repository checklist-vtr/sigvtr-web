# SIGVTR v1.9.7

Checklist do Condutor do 20º BPM.

## Conteúdo

- frontend PWA na raiz;
- painel administrativo em `admin/`;
- Apps Script completo em `backend_apps_script/`;
- cópia técnica do complemento em `backend/`.

## Instalação

1. Publique todos os arquivos do frontend no GitHub Pages.
2. Substitua integralmente os três arquivos de `backend_apps_script/` no projeto Apps Script.
3. Teste a implantação `/dev` e confirme `packageVersion: 1.9.7`.
4. Gere nova versão da implantação `/exec`.
5. Abra o frontend com `?v=1.9.7` e atualize o PWA.

## Regra das avarias

Avarias com situação `PENDENTE` ou `EM MANUTENÇÃO` permanecem visíveis na identificação, no item correspondente e no resumo. A baixa continua exclusiva do painel administrativo.
