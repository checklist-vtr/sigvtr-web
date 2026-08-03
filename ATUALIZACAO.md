# ATUALIZAÇÃO — v1.10.2

## Arquivos alterados

### Frontend do Checklist
- `js/app.js`
- `sw.js`

### Painel Administrativo
- `admin/assets/js/admin.js`
- `admin/assets/css/admin.css`
- arquivos HTML com referências de versão atualizadas
- `admin/sw.js`

### Backend
- `backend/Complemento_Mobile_v4.gs`
- `backend/Código.gs` e demais arquivos com identificação da versão atualizada

## Implantação
1. Substitua os arquivos do backend no Apps Script.
2. Salve e publique uma nova versão da implantação existente.
3. Substitua o frontend completo ou, no mínimo, os arquivos indicados acima.
4. Abra o Checklist e o Painel com `?v=1.10.2`.
5. Faça atualização forçada e confirme o novo cache.

## Testes mínimos
- Registrar alteração em “Outras alterações externas”.
- Registrar alteração em “Outras alterações internas”.
- Confirmar foto obrigatória e criação da avaria.
- Manter o Dashboard aberto e enviar checklist para validar o modal central.
- Validar as cores para checklist, avaria e revisão.

# ATUALIZAÇÃO — v1.10.2

## 1. Apps Script

Substitua os três arquivos existentes e adicione `Painel_Administrativo.gs`.

Execute manualmente:

```javascript
configurarSistema()
```

Autorize as permissões solicitadas e confirme a criação das abas `ALERTAS` e `REVISOES`.

Depois acesse **Implantar > Gerenciar implantações > Editar**, selecione **Nova versão** e publique.

## 2. Frontend

Substitua integralmente os arquivos do repositório web. Confirme em `admin/assets/js/api.js` se a URL corresponde à implantação ativa.

## 3. Homologação

- Enviar checklist sem alteração.
- Enviar checklist com nova avaria.
- Confirmar alertas na planilha e no painel.
- Alterar o status de um alerta.
- Abrir o WhatsApp Web com a mensagem preenchida.
- Pesquisar o prefixo da viatura e conferir a linha do tempo.

## Observação

O clique em **Compartilhar no WhatsApp** registra o status `ENCAMINHADO`, indicando que o encaminhamento foi iniciado. O SIGVTR não confirma envio, entrega ou leitura da mensagem.

## Atualização v1.10.2
1. Substitua `Código.gs` e `Painel_Administrativo.gs` no Apps Script e publique nova versão.
2. Substitua a pasta `admin` completa no frontend.
3. Abra o painel com `?v=1.10.2` e atualize com Ctrl+F5.
4. O painel conservará o último conteúdo carregado quando a conexão falhar temporariamente.
5. O Dashboard consulta novos alertas a cada 20 segundos enquanto estiver aberto.
