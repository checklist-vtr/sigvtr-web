# ATUALIZAÇÃO

## Versões

- Painel Administrativo: **1.13.7-rc1**
- Backend Apps Script: **1.9.18**
- Checklist do Condutor: **1.10.3**

## Objetivo

Melhorar o tempo de recebimento dos alertas, liberar corretamente o som no navegador e acelerar consultas repetidas da Pesquisa Global.

## Frontend alterado

- `admin/assets/js/admin.js`
- `admin/assets/js/api.js`
- `admin/sw.js`
- páginas administrativas com atualização de versão do cache

## Backend alterado

- `Código.gs`
- `Complemento_Mobile_v4.gs`
- `Painel_Administrativo.gs`

## Publicação

1. Substituir a pasta `admin/` completa.
2. Substituir os três arquivos do backend indicados acima.
3. Criar nova versão da implantação do Apps Script.
4. Fazer commit e Push no GitHub Desktop.
5. Aguardar o GitHub Pages e usar **Esvaziar cache e recarregamento forçado**.

## Testes

- Clicar em **Ativar som** e confirmar o sinal de teste.
- Manter o Dashboard aberto e enviar um checklist.
- Confirmar o modal e o som em até aproximadamente 10 segundos.
- Alternar para outra aba e retornar; a consulta deve ocorrer imediatamente.
- Executar duas pesquisas seguidas e comparar o tempo da primeira com a segunda.

Não limpar o banco durante esta rodada de testes.
