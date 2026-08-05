# Atualização — SIGVTR v1.17.0-RC1

## Finalidade
Versão candidata para início do piloto operacional com condutores do 20º BPM.

## Frontend
Substituir todo o conteúdo do frontend pela pasta consolidada desta entrega, pois a atualização uniformiza referências de versão e caches em múltiplas páginas.

## Backend
Substituir o conteúdo dos cinco arquivos existentes no Apps Script:

- `Código.gs`
- `Complemento_Mobile_v4.gs`
- `Avarias_Pendentes.gs`
- `Painel_Administrativo.gs`
- `Arquivamento_Dados.gs`

Não criar arquivos duplicados. Não executar rotinas de limpeza.

## Implantação
Editar a implantação Web App existente, selecionar **Nova versão** e usar a descrição:

`SIGVTR v1.17.0-RC1 — Piloto Operacional`

Manter a mesma URL `/exec` e as mesmas permissões.

## Git

### Summary
`chore(release): consolidar piloto operacional v1.17.0-rc1`

### Description
`Consolida o SIGVTR para o piloto operacional com condutores, uniformiza versões e caches do Checklist do Condutor e do Painel Administrativo, preserva os fluxos de checklists, fotos, alertas, histórico e avarias, consolida o backend como pacote 1.9.21 e adiciona roteiro e ficha de testes. Mantém um único doGet, um único doPost, a mesma planilha, o mesmo Google Drive e nenhuma limpeza automática da base.`

## Teste mínimo antes da liberação
1. Enviar um checklist sem alteração.
2. Enviar um checklist com avaria e cinco fotos.
3. Confirmar protocolo no celular.
4. Confirmar modal e som no painel.
5. Conferir checklist, fotos, avaria e Histórico por Viatura.
6. Verificar ausência de duplicidade.

## Cache
Depois do GitHub Pages e da implantação:
1. Abrir DevTools.
2. Em Aplicativo, remover os Service Workers.
3. Limpar os dados do site.
4. Fechar e reabrir as páginas.
5. Usar `Ctrl + Shift + R`.
