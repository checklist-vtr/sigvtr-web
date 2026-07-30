# Instalação — SIGVTR v1.9.2

## 1. Publicação do frontend

Substitua todo o conteúdo publicado no GitHub Pages pelos arquivos desta versão. Não copie somente `index.html`.

Confirme especialmente a publicação destes arquivos:

- `index.html`
- `css/style.css`
- `js/app.js`
- `sw.js`
- `manifest.json`
- `assets/logo/brasao-20bpm-oficial.webp`

## 2. Limpeza da versão antiga no aparelho

Após a publicação:

1. Feche todas as abas do SIGVTR.
2. Abra novamente o endereço acrescentando `?v=1.9.2` ao final.
3. No navegador, faça uma atualização forçada.
4. Caso o aplicativo esteja instalado como PWA, remova o atalho antigo e instale novamente.

## 3. Conferência visual

Na barra superior deve aparecer `v1.9.2`.

Na identificação deve existir somente:

`Foto do painel: odômetro e combustível`

Se aparecerem dois campos de foto ou a versão exibida não for `v1.9.2`, o navegador ainda está carregando arquivos antigos ou o repositório não foi substituído por completo.

## 4. Backend

Substitua integralmente os três arquivos da pasta `backend_apps_script` e publique uma nova versão da implantação Apps Script.
