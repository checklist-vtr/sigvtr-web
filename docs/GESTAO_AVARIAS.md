# Gestão de Avarias — SIGVTR

## Versão 1.16.0 — Etapa 5

A Gestão de Avarias acompanha permanentemente o ciclo de vida das ocorrências:

`PENDENTE → EM MANUTENÇÃO → RESOLVIDA → ARQUIVADA`

A situação `EXCLUÍDA` representa exclusão lógica administrativa. O registro não é apagado da planilha e a ação permanece registrada em LOGS.

## Funcionalidades

- indicadores de abertas, pendentes, em manutenção, resolvidas e arquivadas;
- pesquisa e filtros por situação, viatura e período;
- paginação de 20, 50 ou 100 registros;
- prontuário individual da avaria;
- fotos do checklist que originou a ocorrência;
- linha do tempo administrativa;
- responsável e observação administrativa;
- mudança de situação;
- resolução, arquivamento e exclusão lógica;
- exportação da lista e da ocorrência individual;
- auditoria no arquivo LOGS.

## Persistência

Nenhuma operação administrativa exclui fisicamente a avaria. As colunas administrativas são criadas apenas quando ainda não existirem na aba AVARIAS.
