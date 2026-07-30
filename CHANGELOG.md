# CHANGELOG

## 1.9.10

- Separado o tratamento de avarias conhecidas do registro de novas alterações no mesmo item.
- Quando existe avaria pendente, os botões passam a mostrar “Nenhuma outra alteração” e “Sim, outra alteração...”.
- Incluída pergunta contextual para Lataria, Vidros, Iluminação, Pneus e demais itens.
- Mantida a obrigatoriedade de confirmar individualmente cada avaria conhecida.
- Uma nova avaria somente é criada quando o condutor informa expressamente outra alteração, com descrição e fotografia.
- Atualizado o cache PWA para a versão 1.9.10.

## 1.9.9

- Corrigida ausência da função `submit` no frontend.
- Adicionado `preventDefault` imediato no envio do formulário.
- Adicionados bloqueio de duplo envio, timeout e tratamento de resposta inválida.
- O formulário permanece preenchido quando o backend não confirma o registro.
- Sucesso exibido somente com ID e protocolo válidos.
- Resumo passa a informar que novas avarias serão pendentes após a conclusão.
- Resposta do backend inclui quantidade e itens das novas avarias.
- Adicionada proteção de idempotência por identificador de requisição.
- Reforçada a prevenção de avarias duplicadas já pendentes na planilha.
- Cache PWA alterado para `sigvtr-mobile-v199`.

## 1.9.8

- Corrigidos os botões de confirmação de legibilidade das fotografias.
- Adicionado suporte a clique, toque, Enter e Escape no modal.

## 1.9.7

- Navegação por etapas.
- Exibição persistente de avarias.
- Resumo com Posto/Graduação e avarias registradas.
