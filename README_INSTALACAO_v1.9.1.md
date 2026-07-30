# SIGVTR v1.9.1 — Instalação

## 1. Frontend

Publique todos os arquivos do pacote no repositório do GitHub Pages, preservando a estrutura de pastas. Não publique somente `index.html`.

Após a publicação, faça uma atualização forçada no navegador. No celular, feche o aplicativo instalado e abra novamente para que o Service Worker `sigvtr-mobile-v191` substitua o cache anterior.

## 2. Apps Script

Substitua integralmente os arquivos da pasta `backend_apps_script`:

- `Código.gs`
- `Complemento_Mobile_v4.gs`
- `Avarias_Pendentes.gs`

Salve e teste pela URL `/dev`. O status deve informar `packageVersion: 1.9.1`.

Depois, crie uma nova versão da implantação atual, preservando a mesma URL `/exec`.

## 3. Alteração do contrato de fotos

O backend agora espera uma única foto inicial com o tipo `painel_inicial`, contendo simultaneamente o odômetro e o indicador de combustível. As quatro fotos finais continuam obrigatórias.

## 4. Teste mínimo

1. Tire uma foto ruim e selecione “Não, tirar outra”.
2. Tire uma foto legível contendo KM e combustível.
3. Confirme a foto.
4. Complete o checklist e pressione enviar uma única vez.
5. Confirme que o modal permanece visível até a resposta e que o protocolo é exibido.
