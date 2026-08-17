# ATUALIZAÇÃO — Relatórios 2.3 / Modernização visual

## Objetivo
Modernizar a página de Relatórios com foco em **legibilidade, acessibilidade e uso em telas diferentes**, mantendo velocidade e compatibilidade.

## Arquivos funcionais alterados
- `admin/relatorios.html`
- `admin/assets/css/relatorios.css`

## Principais mudanças
- fonte base maior;
- títulos e subtítulos mais legíveis;
- campos, botões e checkboxes com áreas de interação maiores;
- cards do Resumo da Frota com números mais destacados;
- tabela com fonte e altura de linha maiores;
- foco visível para teclado;
- melhor organização em celular/tablet;
- ajustes de impressão/PDF;
- respeito à preferência do sistema por redução de movimento.

## O que NÃO foi alterado
Não houve alteração de backend, Apps Script, APIs, regras de relatório, Assistente IA, filtros, dados, exportação CSV ou lógica de negócio. Portanto, **esta atualização visual não exige nova implantação do Google Apps Script**.

## Implantação
No Git/Navegador, publicar os arquivos de frontend alterados. Como o CSS recebeu nova versão no query string, o navegador/PWA tende a buscar a folha de estilos atualizada sem depender do cache antigo.

## Commit sugerido
**Título:** `Moderniza visual dos Relatórios com foco em acessibilidade`

**Descrição:** `Aumenta tipografia, melhora cards, filtros, seletores e tabela da página Relatórios, com refinamentos responsivos e de impressão, sem alterar backend ou regras de negócio.`

---

# ATUALIZAÇÃO — Relatórios 2.2 / Assistente IA

## Cartões relacionados às viaturas nos relatórios

A coluna opcional **Cartões vinculados** foi adicionada aos relatórios:

- Checklists / Relatório operacional;
- Frota / Viaturas;
- Combustível;
- Quilometragem / Revisões.

O vínculo utiliza os dados reais do módulo `CARTOES`, priorizando `ID_VTR` e usando o prefixo como compatibilidade. Quando houver mais de um cartão associado, eles aparecem no mesmo campo com número, tipo e situação.

O relatório específico **Cartões** continua disponível e o **Relatório Personalizado** mantém suas colunas próprias de cartão.

## Assistente SIGVTR IA

O Assistente passa a reutilizar as consultas somente leitura do **Relatórios 2.x**. A categoria da pergunta determina a consulta usada:

- Frota → `FROTA`;
- Cartões → `CARTOES`;
- Checklists → `CHECKLISTS`;
- Combustível → `COMBUSTIVEL`;
- Avarias → `AVARIAS`;
- Quilometragem/manutenção → `QUILOMETRAGEM`.

Perguntas gerais recebem uma consolidação limitada desses relatórios. Perguntas sobre uma viatura específica também podem combinar histórico, situação cadastral e cartões vinculados. A IA continua **somente leitura** e não altera nenhum registro do SIGVTR.

### Arquivos alterados

- `backend/Painel_Administrativo.gs`
- `backend/Assistente_IA.gs`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

### Implantação

No Google Apps Script, substituir **Painel_Administrativo.gs** e **Assistente_IA.gs** e publicar uma nova versão do Web App. No Git/Navegador, atualizar os arquivos do projeto e validar os testes abaixo antes do commit definitivo.

### Testes recomendados

1. Gerar Checklists marcando `Prefixo`, `Placa` e `Cartões vinculados`.
2. Gerar Frota e conferir o cartão de uma VTR com cartão titular cadastrado.
3. Gerar Combustível e Quilometragem/Revisões com a coluna `Cartões vinculados`.
4. Perguntar ao Assistente: `Quantas viaturas estão indisponíveis?`.
5. Perguntar: `Quais viaturas estão baixadas e quais possuem reserva?`.
6. Perguntar: `Qual é a data do status da viatura 50-XXXX?` usando um prefixo real.
7. Perguntar: `Qual cartão está vinculado à viatura 50-XXXX?`.
8. Perguntar: `Quais cartões reserva estão cadastrados?`.
9. Perguntar: `Quais viaturas estão com revisão vencida?`.
10. Confirmar que o Assistente não altera status, cartões, avarias ou qualquer outro dado.

---

# ATUALIZAÇÃO — Relatórios 2.1.1

## Resumo da Frota — status temporários

O resumo do relatório **Frota / Viaturas** agora contabiliza também:

- **Indisponíveis** — viaturas com status `INDISPONIVEL`, incluindo afastamentos temporários como viagens;
- **Em manutenção** — viaturas com status `MANUTENCAO`.

A observação administrativa continua livre para detalhar o motivo, por exemplo `Em viagem até 22/08/2026`. A **Data do Status** permanece sendo atualizada quando há mudança efetiva do status.

### Arquivos alterados

- `backend/Painel_Administrativo.gs`
- `admin/assets/js/relatorios.js`
- `admin/assets/css/relatorios.css`
- `admin/relatorios.html`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

### Implantação

Substituir `Painel_Administrativo.gs` no Google Apps Script e publicar uma nova versão do Web App. Atualizar no Git/Navegador os arquivos administrativos alterados.

---

## Entrega 06 — Correção definitiva do tipo Fiscal e cache administrativo

- Corrigido o payload do Checklist do Fiscal para enviar explicitamente `tipoChecklist: "FISCAL"`.
- Pesquisa Global, Dashboard, Checklists e Histórico passam a resolver o tipo por `Tipo Checklist`, `Tipo_Retirada` ou `ITENS_JSON`.
- Atualizado o Service Worker administrativo para liberar a tela nova de revisão preventiva em Viaturas.
- Checklist do Condutor permanece inalterado.

# ATUALIZAÇÃO — v1.19.4-RC1

## Entrega 05 — Controle administrativo de revisão

No módulo **Viaturas**, abra **Editar cadastro** para definir ou alterar:

- Próxima revisão (km);
- Alerta antecipado (km), por exemplo, alterar de 1.000 para 200.

No prontuário da viatura, o botão **Registrar revisão realizada** encerra o ciclo anterior, resolve os alertas vinculados e exige a configuração da próxima revisão.

Fluxo adotado:

1. PROGRAMADA: fora da faixa de alerta;
2. ALERTA: entrou na antecedência configurada;
3. ATINGIDA: KM atual igual ao KM da revisão;
4. VENCIDA: KM atual maior que o KM da revisão e permanece assim até a baixa administrativa.

Não foram criados níveis adicionais.

# ATUALIZAÇÃO — v1.19.2-RC1

## Branch 02 — Checklist do Fiscal — Entrega 03

Esta entrega corrige a ausência dos registros do Fiscal na Pesquisa Global e consolida a identificação da origem das avarias. O backend agora identifica o tipo de checklist de forma retrocompatível usando a coluna `Tipo Checklist`, o campo `Tipo_Retirada` ou o conteúdo de `ITENS_JSON`.

### Arquivos alterados

- `backend/Painel_Administrativo.gs`
- `admin/assets/js/avarias.js`
- `admin/sw.js`
- `README.md`
- `CHANGELOG.md`
- `ATUALIZACAO.md`

### Apps Script

Substituir somente `Painel_Administrativo.gs` e publicar uma nova versão com o título: `SIGVTR v1.19.2-RC1 — Branch 02 — Checklist do Fiscal — Entrega 03`.

# ATUALIZAÇÃO — SIGVTR 1.19.1-RC1

## Branch 02 — Checklist do Fiscal — Entrega 02

### Situação

A Entrega 01 foi validada operacionalmente. O Checklist do Fiscal envia registros, fotografias e avarias utilizando a mesma arquitetura do Checklist do Condutor.

### Implementado nesta entrega

- filtro Todos/Condutor/Fiscal no módulo Checklists;
- filtro processado pelo backend, sem uso de dados locais como fonte principal;
- Pesquisa Global preparada para localizar `FISCAL`, `CONDUTOR`, `Fiscal` e `Condutor`;
- links da Pesquisa Global abrem o módulo Checklists com o tipo correspondente;
- novos alertas armazenam `Tipo Checklist`;
- linha do tempo administrativa identifica a origem do checklist;
- compatibilidade retroativa preservada para registros antigos;
- cache do Painel Administrativo atualizado para a nova versão.

### Arquivos do Condutor

Os arquivos `index.html`, `css/style.css`, `js/app.js`, `manifest.json` e `sw.js` da raiz não foram alterados.

### Próxima etapa

Validar os filtros e a Pesquisa Global em ambiente publicado. Após aprovação, revisar a apresentação da origem nas avarias e consolidar os testes finais multiplataforma da Branch 02.


## Entrega 07 — Correção estrutural Fiscal e Viaturas

- O Checklist do Fiscal passa a usar a rota exclusiva `salvarChecklistFiscal`.
- O backend força `FISCAL` nessa rota, independentemente do nome, RG ou função anterior do militar.
- A resposta do backend informa `tipoChecklist` e `backendVersion` para diagnóstico.
- A tela de Viaturas injeta os campos de revisão pelo JavaScript quando uma cópia HTML antiga estiver em cache.
- Cache Fiscal e Administrativo atualizado para v1.19.6-RC1.


## Atualização — Relatórios 2.1
- Adicionado resumo dinâmico da frota com totais de VTRs, ativas, baixadas, reservas e baixadas com/sem reserva disponibilizada.
- Adicionado campo **Data do Status** à estrutura de VIATURAS, preenchido automaticamente quando o status é alterado.
- Registros históricos sem data permanecem sem data informada; nenhuma data retroativa é inventada.
- Data do Status disponível nos relatórios Frota e Personalizado.


## Relatórios 2.3.1 — Refinamento visual e fluxo de exportação
- Reposiciona **Exportar CSV** e **Imprimir / Salvar PDF** junto ao botão **Gerar relatório**, acompanhando o fluxo natural de uso.
- Mantém CSV e PDF desabilitados até existir um relatório gerado.
- Reduz a dominância visual das ações de exportação no cabeçalho.
- Compacta discretamente o bloco de Relatórios rápidos em telas amplas.
- Adiciona impressão adaptativa: até 5 colunas usa A4 retrato e fonte maior; de 6 a 8 colunas usa A4 paisagem com densidade média; acima de 8 colunas usa A4 paisagem compacta.
- Nenhuma API, regra de negócio ou backend foi alterado nesta etapa.
