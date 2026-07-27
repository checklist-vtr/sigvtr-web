# SIGVTR v4 — Teste 2

Atualização preparada para o segundo teste controlado.

## Alterações

- campo exclusivo **Condutor** na primeira etapa;
- cinco fotos obrigatórias: frontal, traseira, lado esquerdo, lado direito e odômetro;
- imagens reduzidas para até 1280 px, qualidade 68%, melhorando o envio em celulares antigos;
- rodapé com e-mail clicável e horário de atendimento;
- cache atualizado para `sigvtr-mobile-v5`;
- backend atualizado para validar cinco fotos e gravar o nome do condutor.

## Frontend

Substitua no repositório:

- `index.html`
- `css/style.css`
- `js/app.js`
- `sw.js`

Faça commit e push.

## Apps Script

Substitua o conteúdo do arquivo `Complemento_Mobile_v3.gs` pelo conteúdo de:

`backend/Complemento_Mobile_v4.gs`

Depois:

1. Salve o projeto.
2. Vá a **Implantar > Gerenciar implantações**.
3. Edite a implantação ativa.
4. Selecione **Nova versão**.
5. Mantenha **Executar como: Eu**.
6. Mantenha **Quem pode acessar: Qualquer pessoa**.
7. Clique em **Implantar**.

A URL `/exec` pode permanecer igual.
