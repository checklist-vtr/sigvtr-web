# Controle da Guarda — Roteiro de Testes Finais v0.8.0

Este roteiro valida segurança, concorrência, sessão, QR, cache e continuidade operacional sem alterar as regras já aprovadas.

## 1. Sessão
- Login com conta funcional GUARDA.
- Confirmar acesso exclusivo a `/controle-da-guarda/`.
- Deixar a tela sem interação por 30 minutos e confirmar retorno ao login.
- Confirmar que o polling do QR não renova a sessão por si só.

## 2. Retirada e duplo clique
- Selecionar uma VTR e um militar.
- Clicar rapidamente duas vezes em Gerar QR.
- Confirmar que existe apenas uma movimentação aberta para a VTR.
- Abrir o QR em um segundo aparelho e confirmar o KM.
- Reutilizar o mesmo QR: deve retornar QR já utilizado.

## 3. Token e expiração
- Gerar novo QR para uma movimentação ainda pendente e confirmar que o token anterior fica inválido.
- Validar que o QR contém apenas token opaco, sem CPF/RG/KM.
- Confirmar que, após a página abrir, o token é removido da barra de endereço.
- Validar expiração após 10 minutos.

## 4. Devolução e concorrência
- Iniciar devolução e tentar acioná-la simultaneamente em duas telas.
- Confirmar que apenas a mesma movimentação é utilizada e que novo QR invalida o anterior.
- Confirmar KM final em dois aparelhos quase simultaneamente; apenas uma confirmação deve ser aceita.

## 5. Turnos
- Abrir novo turno sem encerrar o anterior.
- Confirmar que o anterior fica pendente e o novo permanece operacional.
- Confirmar que VTRs ainda em uso são herdadas automaticamente.
- Encerrar pendente como Comandante: sem motivo obrigatório.
- Encerrar outro pendente como Não Comandante: motivo obrigatório.

## 6. VTR Outros
- Usar prefixo com zero à esquerda (ex.: 025).
- Confirmar preservação de prefixo, placa e KM.
- Em novo serviço, pesquisar 025 e confirmar sugestão pelo histórico.

## 7. PDF e Admin
- Fechar turno com múltiplas VTRs em uso.
- Confirmar que todas aparecem no PDF.
- Confirmar nome `controle-da-guarda_DD-MM-AAAA_HH-mm.pdf`.
- Em Admin > Relatórios > Controle da Guarda, baixar e regenerar o PDF.

## 8. PWA/cache e rede
- Confirmar que `/controle-da-guarda/` e `/controle-da-guarda/confirmar/` não são servidos pelo cache do service worker.
- Reabrir um QR já consumido e confirmar que nenhuma tela antiga válida reaparece por cache.
- Simular falha de rede: a interface deve informar erro, sem criar confirmação local/offline.

## Critério de conclusão
A versão pode ser promovida para v1.0 quando todos os testes acima passarem sem duplicidade de movimentação, reutilização de token, exposição de dados indevida, regressão de sessão ou inconsistência entre painel/PDF.
