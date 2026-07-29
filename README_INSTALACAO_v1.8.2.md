# SIGVTR v1.8.2 — Instalação segura

## 1. Backup

Antes de alterar, faça uma cópia da pasta publicada e copie o conteúdo atual dos três arquivos do Apps Script para arquivos de segurança.

## 2. Backend — Google Apps Script

Substitua integralmente o conteúdo dos arquivos pelo conteúdo da pasta `backend_apps_script/`:

1. `Código.gs`
2. `Complemento_Mobile_v4.gs`
3. `Avarias_Pendentes.gs`

Em cada arquivo: `Ctrl+A` → colar o conteúdo completo → `Ctrl+S`.

Confirme pela busca geral:

- `function doGet` — somente em `Código.gs`.
- `function doPost` — somente em `Complemento_Mobile_v4.gs`.

### Sincronizar a frota fixa

No seletor de funções do Apps Script, escolha `sincronizarFrotaFixa` e clique em **Executar** uma única vez.

A função:

- cadastra somente prefixos ausentes de `50-2001` a `50-2021`;
- não apaga registros;
- não altera viaturas já cadastradas;
- não duplica prefixos existentes.

Na primeira execução, o Google poderá solicitar autorização.

### Teste pela implantação de desenvolvimento

Abra a URL `/dev` sem parâmetros. Deve retornar `packageVersion: 1.8.2`.

Depois teste:

`URL_DEV?action=avariasPendentes&prefixo=50-2021`

O retorno esperado é uma lista ou `{"success":true,"avarias":[]}`.

### Publicação

Após os testes:

`Implantar` → `Gerenciar implantações` → editar a implantação atual → `Nova versão` → descrição `SIGVTR Backend v1.8.2` → `Implantar`.

Mantenha a URL `/exec` já usada no frontend.

## 3. Frontend

Substitua o projeto publicado pelos arquivos completos deste pacote. O diretório `admin/` foi preservado.

O Service Worker usa o cache `sigvtr-mobile-v182`.

Depois de publicar no GitHub Pages:

1. abra o sistema;
2. pressione `Ctrl+Shift+R` no computador;
3. no celular, use o botão **Fechar e atualizar**;
4. se necessário, remova e reinstale o PWA.

## 4. Regras de entrada

- Frota fixa: seleção entre `50-2001` e `50-2021`.
- Outro prefixo: apenas números, preservando zeros iniciais.
- Condutor: letras e espaços.
- RG: apenas números.
- KM: apenas números inteiros.
- Equipe: letras, números e espaços.
- Descrição de alteração: letras, números e pontuação operacional limitada.

As mesmas regras são verificadas novamente no backend.

## 5. Viaturas externas

Ao enviar um checklist com `Outro prefixo`, o backend:

- procura o prefixo numérico na aba `VIATURAS`;
- reutiliza o cadastro quando já existe;
- cria um cadastro provisório quando não existe;
- classifica o registro como `VIATURA EXTERNA / RESERVA` quando as colunas correspondentes existirem.

## 6. Teste mínimo

Faça dois testes:

1. frota fixa, por exemplo `50-2021`;
2. viatura externa, por exemplo `041`.

Confirme registros em `VIATURAS`, `RETIRADAS`, `FOTOS`, `LOGS` e, quando aplicável, `AVARIAS` e `EVENTOS`.
