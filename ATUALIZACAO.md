# ATUALIZAÇÃO — ETAPA 3 — HISTÓRICO POR VIATURA

## Versão
1.14.0 — 04/08/2026

## Arquivos alterados
- `admin/historico-viatura.html`
- `admin/assets/js/historico-viatura.js`
- `admin/assets/css/prontuario.css`
- `admin/assets/js/api.js`
- `admin/sw.js` e referências de versão do painel
- `Painel_Administrativo.gs`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

## Publicação
1. No GitHub Desktop, criar ou selecionar `feature/painel-administrativo-v1`.
2. Substituir os arquivos do frontend pelos arquivos deste pacote.
3. No Apps Script, substituir apenas o conteúdo de `Painel_Administrativo.gs`. Os demais `.gs` foram incluídos como referência íntegra.
4. Salvar e criar uma **nova implantação** do aplicativo da Web.
5. Confirmar que a URL da implantação permanece configurada em `admin/assets/js/api.js`.
6. Fazer commit e push pelo GitHub Desktop.
7. Aguardar a publicação do GitHub Pages.
8. Abrir o painel, esvaziar o cache do site e usar recarregamento forçado (`Ctrl+F5`).

## Testes obrigatórios
1. Pesquisar um prefixo com checklists existentes.
2. Validar dados cadastrais e KM atual.
3. Conferir ordem e diferença do histórico de KM.
4. Abrir as abas Checklists, Avarias, Fotos, Eventos e Linha do tempo.
5. Aplicar filtros de data e tipo.
6. Abrir detalhes de checklist e avaria.
7. Abrir uma foto no Google Drive.
8. Usar “Exportar PDF” e salvar a impressão como PDF.
9. Testar prefixo inexistente e indisponibilidade temporária da API.
10. Confirmar Dashboard, Alertas, Pesquisa Global e Checklist do Condutor sem regressões.

## Commit

### Summary
`feat(admin): concluir prontuário completo por viatura`

### Description
`Implementa a Etapa 3 do Painel Administrativo com prontuário completo por viatura, histórico detalhado de quilometragem, checklists, avarias, fotos, eventos, alertas, linha do tempo, filtros por período e tipo, detalhamento em modal e exportação em PDF. Amplia a rota adminHistoricoViatura sem criar novos doGet ou doPost, preserva a planilha, o Drive, o banco atual e todas as funcionalidades existentes. Atualiza cache, documentação e versão do painel para 1.14.0.`

## Próxima etapa
ETAPA 4 — Checklists: lista completa, filtros avançados, pesquisa, visualização, fotos, detalhamento e exportação.
