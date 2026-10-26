# Auditoria das 5 Leis do DS nas mudanças do redesign

Fonte: `cerne/CLAUDE.md`. Auditado em 2026-10-26 (só o que foi criado/alterado neste trabalho; o legado do front fica para as ondas seguintes).

| Lei | Situação | Detalhe |
|---|---|---|
| 1 · Component-First | **Atende** | Tudo novo está em `src/components/ui/`; as telas só compõem. |
| 2 · Fonte única / propagação | **Atende** | Mudanças feitas no tema/recipe/kit e herdadas pelas telas (ex.: Button, Input, Pagination, StepFooter). |
| 3 · Tokenização | **Parcial → corrigido em parte** | Cores soltas do painel de resumo e do valor "adicional" viraram tokens semânticos (`summary*`, `addonText`). Sobram: `rgba()` de superfícies translúcidas no `SummaryPanel`/`PlanCompareStrip`, tamanhos de fonte em px (5 usos) e `Login` (hex da marca no formulário, herdado do legado). Fonte **Outfit**: não verificada no front. |
| 4 · Commits | **Parcial** | Commits atômicos por funcionalidade, sem push. Falta conferir o formato de mensagem exigido pela lei. |
| 5 · Tokens W3C DTCG | **Não atende** | O front não tem `tokens/tokens.json`. Os tokens vivem em `src/styles/theme/` (Chakra). Exportar para DTCG é uma tarefa própria. |

## Pendências
1. Trocar os `rgba()` restantes por tokens (ou `alpha` do tema) e os px de fonte pela escala.
2. Conferir a fonte Outfit no `index.html`/tema do front.
3. Decidir se o front gera `tokens/tokens.json` (Lei 5) a partir do tema Chakra.
4. Tokenizar as cores do Login legado.
