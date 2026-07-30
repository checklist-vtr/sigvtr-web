# Atualização para v1.9.11

## 1. Apps Script

1. Faça uma cópia de segurança do projeto atual.
2. Substitua integralmente `Código.gs`, `Complemento_Mobile_v4.gs` e `Avarias_Pendentes.gs` pelos arquivos da pasta `backend/`.
3. Confirme que existe somente um `doGet` e um `doPost` em todo o projeto.
4. Salve e crie uma nova implantação do tipo Aplicativo da Web.
5. Execute como proprietário e permita acesso conforme a política do 20º BPM.
6. Atualize `API_URL` em `js/app.js` somente se a URL da implantação mudar.

## 2. GitHub Pages

1. Substitua os arquivos do frontend.
2. Publique a branch do Checklist do Condutor.
3. Abra a URL com `?v=1.9.11`.
4. No Android, feche completamente a PWA e abra novamente. Caso persista versão antiga, remova o atalho e instale novamente.

## 3. Teste obrigatório

1. Envie um checklist sem alteração e confirme ID/protocolo na aba RETIRADAS.
2. Envie um checklist com uma alteração e confirme a nova linha PENDENTE em AVARIAS.
3. Confirme que o resumo avisa que a nova avaria ficará pendente.
4. Simule perda de conexão durante o envio: o formulário deve permanecer preenchido.
5. Toque duas vezes em Enviar: deve ocorrer apenas uma tentativa ativa.
6. Repita a tentativa após timeout e confirme que o identificador de requisição evita duplicidade quando o primeiro registro já tiver sido concluído.

7. Selecione uma viatura com avaria pendente e confirme que o item exibe a pergunta sobre outra alteração.
8. Marque `NENHUMA OUTRA ALTERAÇÃO` e confirme que nenhuma nova descrição ou foto é exigida.
9. Marque `SIM, OUTRA ALTERAÇÃO...` e confirme que descrição e fotografia passam a ser obrigatórias.
10. Envie o checklist e confirme que a avaria conhecida não foi duplicada; somente a outra alteração deve gerar nova linha em AVARIAS.
