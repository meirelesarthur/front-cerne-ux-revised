# Conciliação bancária (Importação OFX) — Proposta de UX

- **Rota:** `/financeiro/ofx/:uuid/conciliacao` · **Código:** `src/pages/Financeiro/OfxImport/Reconciliation/`
- **Protótipo interativo:** [`propostas/conciliacao-ofx/prototype.html`](../propostas/conciliacao-ofx/prototype.html)
  (servir com `node C:\Users\Arthur\devdb\static.mjs docs/ux/propostas 5195` → http://localhost:5195/conciliacao-ofx/prototype.html)
- **Status:** proposta (nada implementado no front ainda) · **Data:** 2026-10-23

## 1. Diagnóstico da tela atual

Observado nos dois prints (lista + modal "Novo Movimento") e em `OfxReconciliationTab.tsx` / `NewMovementModal.tsx` (772 linhas):

| # | Problema | Efeito para o usuário |
|---|----------|----------------------|
| 1 | Todas as linhas aparecem iguais: badge "Pendente" + dois botões idênticos ("Vincular título" / "Criar movimento") | O usuário precisa **decidir do zero em cada linha**; o sistema não diz o que provavelmente é |
| 2 | O backend já devolve `matched_movement_uuid`, mas a tela não mostra *o que* foi casado nem *por quê* | Falta confiança: "Aplicar Conciliação" confirma às cegas |
| 3 | Os cartões de topo mostram só **contagens** (3 / 0 / 3 / 0%) | Não responde "quanto falta, em R$, e fecha com o extrato?" |
| 4 | "Aplicar Conciliação" (canto superior) é uma ação global ambígua | Não fica claro o que será aplicado nem se dá para voltar |
| 5 | "Criar movimento" abre um **modal de ~12 campos** + Rateio (Categoria, Centro de custo, Conta contábil, Valor, %) + 3 botões de ícone idênticos (impressora) + "Dedutível" | Alto esforço cognitivo; perde-se o contexto da lista; ícones sem rótulo |
| 6 | Vincular título abre **outro modal** (`WriteoffExpenseModal` / `WriteoffIncomeModal`) | Dois fluxos paralelos para o mesmo objetivo (explicar a linha do banco) |
| 7 | Sem fila de trabalho: não há "o que fazer primeiro", filtros por estado, nem ação em lote | Reconciliar 200 linhas = 200 aberturas de modal |
| 8 | Sem atalhos de teclado nem "desfazer" imediato | Erro obriga a ir a "Desconciliar" depois |
| 9 | Sem regras aprendidas: tarifa/combustível/transferência são classificados do zero todo mês | Retrabalho recorrente |

## 2. Referências pesquisadas

| Produto | O que aproveitar | Fonte |
|---------|------------------|-------|
| **Xero** | Cada linha do banco tem 4 saídas — **Match / Create / Transfer / Discuss**; sugestão destacada em verde; "Find & Match" para buscar outro; recibo que paga vários títulos; regras ("bank rules") preenchem lançamentos recorrentes | [Fit Small Business](https://fitsmallbusiness.com/connect-and-reconcile-bank-account-xero/), [Marc Andrews](https://marcandrews.com/xero-bank-reconciliation-tutorial-uk-step-by-step-guide/), [Numeric](https://www.numeric.io/blog/how-to-reconcile-in-xero) |
| **QuickBooks Online** | Caixa de entrada **"For review"** com filtro "Recognized"; badge **"Rule"** mostrando o que veio de regra; ações em lote; **auto-add** só para regras validadas (começar por aluguel/combustível) | [Intuit — bank rules](https://quickbooks.intuit.com/learn-support/en-za/help-article/banking/set-bank-rules-categorize-online-banking-online/L0mjJl0nD_ZA_en_ZA), [auto-add](https://quickbooks.intuit.com/au/blog/product-update/banking-rules-update-new-auto-add-bank-rules) |
| **Conta Azul** | Importa OFX/integração, **sugere** o lançamento e o usuário só **"Conciliar"**; baixa automática do contas a pagar/receber | [Tutorial oficial](https://contaazul.com/tutoriais/como-fazer-conciliacao-bancaria-na-conta-azul), [Funcionalidade](https://contaazul.com/funcionalidades/conciliacao-bancaria) |
| **Omie** | Conciliação automática exige coincidência de CNPJ/CPF, valor, data, conta e tipo; sem coincidência exata → **"Buscar"** ou cadastrar novo | [Ajuda Omie](https://ajuda.omie.com.br/pt-BR/articles/2495094-conciliacao-bancaria-com-o-extrato-do-banco-integrado-ao-omie) |
| **Sage / ERPNext (guias de UI de bank feeds)** | Visão lado a lado; **score de confiança 0–100** ponderando valor, data e parte; limiares configuráveis; divisão (split) com soma exata; ação em lote por limiar; atalhos de teclado; trilha de auditoria | [Sage bank feeds UI](https://www.cleverence.com/articles/sage-dev-documentation/bank-feeds-ui-sage-developer-4927/), [ERPNext Smart Bank Reconciliation](https://ecosire.com/apps/erpnext/erpnext-smart-bank-reconciliation) |

Ressalvas: parte das fontes é material do próprio fornecedor ou guia de desenvolvedor; não encontrei estudo de usabilidade independente. Tratar como **padrões a validar**, não como norma.

## 3. Princípios da proposta

1. **Sugestão primeiro, decisão depois.** Cada linha chega com a melhor hipótese; o caminho feliz é **um clique** (Confirmar).
2. **Fila de trabalho, não lista plana.** Abas por estado: *Para revisar · Sugestões prontas · Sem correspondência · Conciliadas*.
3. **Mestre–detalhe na mesma tela.** Sem modais: o painel da direita resolve a linha selecionada.
4. **Uma pergunta por vez, progressivamente.** Vincular → Criar → Transferência no mesmo painel; campos avançados (juros, documento, dedutível) recolhidos.
5. **Confiança explicada.** Score em faixas + motivos ("Valor igual", "Mesmo fornecedor", "Vence na data").
6. **Aprender com o usuário.** "Lembrar para transações parecidas" cria **regra**; linhas seguintes chegam pré-preenchidas com o selo "Regra".
7. **Tudo é reversível.** Toast com **Desfazer** (e Ctrl+Z); lote também desfaz.
8. **Números em R$ e fechamento visível.** Saldo do extrato, entradas/saídas a conciliar e **diferença a explicar** que zera ao terminar.
9. **Teclado para volume.** `J/K` navega, `Enter` confirma, `C/V/T` trocam o modo, `/` busca.

## 4. Proposta (resumo da tela)

```
┌ Conciliação bancária · BB · Conta Livro Caixa PF · OFX 01–12/10 ───────── ◔ 3 de 8   [Salvar e sair] [Concluir] ┐
│ Saldo do extrato │ Entradas a conciliar │ Saídas a conciliar │ Diferença a explicar (zera ao terminar)         │
├───────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┤
│ [Para revisar 8][Sugestões prontas 3]         │ TED RECEBIDA – CLIENTE TESTE LTDA            + R$ 5.000,00 │
│ [Sem correspondência 5][Conciliadas 0]        │ ( Vincular a título | Criar lançamento | Transferência )    │
│ 🔍 Buscar…                 [Selecionar visíveis]│ ◉ Venda de soja — Cliente Teste Ltda        98%  ▓▓▓▓▓▓▓░ │
│ ☐ ↗ TED RECEBIDA…  [Sugestão 98%]  +5.000 [✓]  │    ✓ Valor igual ✓ Mesmo cliente ✓ Vence na data            │
│ ☐ ↘ PAGTO BOLETO…  [Sugestão 97%]  −1.250 [✓]  │ [Buscar outro título…]                                      │
│ ☐ ↘ TARIFA…        [Regra: Tarifas bancárias]  │        [Criar lançamento em vez disso] [Confirmar vínculo ⏎]│
│ ☐ ↗ PIX COOPERATIVA [Sugestão 91% · 2 títulos] │                                                             │
└───────────────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
 J K navegar · Enter confirmar · C criar · V vincular · T transferência · Ctrl+Z desfazer · / buscar
```

### 4.1 Fluxos

| Cenário | Hoje | Proposta |
|---------|------|----------|
| Linha com sugestão forte (≥90%) | Abrir modal "Vincular título", procurar, baixar | Botão **Confirmar** na própria linha (ou `Enter`) |
| Várias sugestões prontas | Uma a uma | Marcar → **Confirmar sugestões (N)** em lote, com Desfazer |
| Pagamento que quita vários títulos | Modal de baixa com seleção manual | Sugestão "2 títulos somam o valor" já montada; soma precisa fechar |
| Sem título (tarifa, combustível) | Modal de 12 campos + rateio | Aba **Criar lançamento** com 4 campos essenciais, **pré-preenchida por regra**; rateio só se ligar o toggle, com "faltam R$ X" ao vivo |
| Transferência entre contas | Criar movimento manual | Aba **Transferência** (detecta a contrapartida na outra conta) |
| Erro | Ir em "Desconciliar" | **Desfazer** no toast / `Ctrl+Z` / botão na aba Conciliadas |
| Fechar o mês | "Aplicar Conciliação" global | **Concluir conciliação** só habilita com 0 pendentes (diferença = R$ 0,00) |

### 4.2 Estados a tratar (checklist do DS)
Vazio ("Nada conciliado ainda"), tudo concluído (✓ Extrato totalmente conciliado), sem sugestão, carregando (Skeleton), erro com retry, esparso (1–3 linhas) e denso (+500: paginação/virtualização), tema claro e GBMode, foco/teclado, mobile (painel vira tela cheia ao tocar na linha).

## 5. O que já existe × o que o backend precisa entregar

| Necessidade | Situação |
|-------------|----------|
| Lista de itens do extrato, `reconciled`, `matched_movement_uuid`, progresso, `pending_investments` | **Já existe** (`getOfxReconciliationPreview`) |
| Vincular título (baixa), criar movimento com rateio, desconciliar | **Já existe** (modais atuais — reaproveitar a lógica/Yup, trocar só a casca) |
| **Lista de candidatos por linha** com `score` e `reasons[]` (valor, data, parte, soma de títulos) | **Falta** — hoje só há 1 casamento. Contrato sugerido: `items[].candidates[] { type:'title'|'multi', ids[], score, reasons[] }` |
| **Regras de conciliação** (descrição contém → categoria/CC/pessoa) + `rule` aplicada no item | **Falta** — CRUD simples + campo `suggested_rule` no item |
| **Confirmação em lote** por uuid(s) | **Falta** — `POST …/conciliacao/confirm { items:[…] }` com resultado por linha |
| Contrapartida de transferência | **Falta** (nice-to-have) |
| Saldo do extrato / saldo no sistema / diferença | Parcial — OFX traz saldo final; cálculo da diferença pode ser no front se vier o saldo do sistema |
| Trilha de auditoria (quem confirmou, com qual score) | **Falta** — recomendável |

## 6. Componentização (Lei do projeto: tudo é componente)

Evoluir `ReconciliationWorkspace` do DS (hoje 2 colunas simples) em peças do kit, reutilizáveis por outras conciliações (contas a pagar/receber, cartão):

| Componente (novo, `src/components/ui/`) | Responsabilidade |
|---|---|
| `ReconciliationWorkspace` | Casca mestre–detalhe + abas + barra de progresso/resumo |
| `ReconciliationRow` | Linha do extrato: ícone, descrição, data, valor, chip de estado, ação rápida |
| `MatchCandidateCard` | Candidato com score (faixa), motivos e seleção |
| `ConfidenceMeter` | Barra/percentual por faixa (alta ≥90, média 60–89) |
| `ReconcileActionPanel` | Segmentos Vincular · Criar · Transferência |
| `QuickCreateForm` + `SplitEditor` | Criação com 4 campos + rateio com saldo restante |
| `BulkActionBar` (já existe no DS) | Confirmar sugestões em lote |
| `UndoToast` (sobre `Toast`) | Desfazer 6 s |
| `KeyboardHints` | Rodapé de atalhos |

Reuso do que já está no front: `NewMovementModal` (regras de cascata e Yup do rateio) vira o **conteúdo** de `QuickCreateForm`/`SplitEditor`; `WriteoffExpenseModal/IncomeModal` viram conteúdo da aba Vincular.

## 7. Plano de entrega sugerido

| Fase | Entrega | Depende de backend? |
|------|---------|--------------------|
| 1 | Casca nova (mestre–detalhe, abas, resumo em R$, progresso) usando os dados atuais; ação rápida **Confirmar** quando já há `matched_movement` | Não |
| 2 | Painel com abas Vincular/Criar/Transferência substituindo os 2 modais; rateio com saldo ao vivo; Desfazer | Não |
| 3 | Candidatos com score + motivos; lote por limiar | Sim (candidatos, confirm em lote) |
| 4 | Regras ("lembrar para parecidas"), selo *Regra*, auto-add opcional por regra validada | Sim (regras) |
| 5 | Atalhos, auditoria visível, transferência com contrapartida | Parcial |

## 8. Métricas para validar (antes/depois)
Tempo por linha conciliada · % de linhas conciliadas com 1 clique · taxa de sugestões desfeitas (falso-positivo) · nº de campos preenchidos manualmente por linha · linhas por sessão.

## 9. Decisões em aberto
1. Limiar de "sugestão pronta" (proposto 90%) — fixo ou configurável por contratante?
2. Auto-add por regra: liga por padrão ou só após N confirmações da mesma regra?
3. Quem pode **Concluir** o mês e reabrir (permissão `import_ofx_edit` basta?).
4. A diferença exibida considera o saldo contábil do sistema (precisa de endpoint) ou só o líquido dos pendentes (como no protótipo)?

## Registro de edições

### UX-conciliacao-002 · Fase 2 · Painel inline (Vincular / Criar / Transferência), rateio ao vivo e Desfazer — 2026-10-23
- **Status:** implementada (validada no navegador) · **Impacto Dev:** só front; **mudança em componente compartilhado** (`MovementAllocationEditor`, também usado em Mov. Caixa/Bancário)
- **O que mudou:** os modais *Novo Movimento* e *Baixa de título* viraram **painel inline** ao lado da lista, com seletor `Vincular a título · Criar lançamento · Transferência`. A lógica/validação é a mesma dos modais (mesmos formulários, variante `panel` via `FormSurface`); **Transferência** abre o mesmo formulário com Tp. Categoria = T. Sugestão pronta: *Confirmar sugestões* ou *Vincular a outro título*.
- **Rateio ao vivo:** `RemainingBalance` mostra `Rateado R$ X / R$ Y` e **Faltam / Passou / Fechou** a cada edição; o alerta antigo ("a soma diverge… −R$ 39,90") foi removido. Os 3 botões de impressão idênticos ganharam ícones distintos (categoria, plano de contas, rateio).
- **Desfazer:** *Confirmar sugestões* mostra toast com **Desfazer** (9 s), que desconcilia os movimentos recém-aplicados. Para vínculo/criação ainda não há desfazer em toast (hoje: aba Conciliadas → Desconciliar).
- **Componentes novos (kit):** `FormSurface` (modal ou painel), `SegmentedControl`, `RemainingBalance`. `ReconciliationDetailPanel` ganhou `actions` separado de `children`.
- **Mantido em diálogo:** a baixa em lote final (`WriteOffBatchModal`, compartilhado com Contas a Pagar/Receber) e o cadastro rápido de cliente/fornecedor.
- **i18n:** `reconciliation.workspace.panel` e `movements…allocations.{remaining,over,balanced}Label` (PT-BR/EN-US/ES-ES).
- **Pendente (fases 3–5):** candidatos com score, regras, desfazer de vínculo/criação, lote por limiar.
### UX-conciliacao-001 · Fase 1 · Casca mestre–detalhe, abas, resumo em R$ e Confirmar — 2026-10-23
- **Status:** implementada (validada no navegador com dados de dev) · **Impacto Dev:** só front; sem mudança de contrato
- **O que mudou:** a lista plana de cartões virou workspace: resumo (entradas/saídas a conciliar e já conciliado em R$ + anel de progresso), abas *Para revisar · Sugestões prontas · Sem correspondência · Conciliadas* com contagem, lista com selo de estado e painel de detalhe (situação + ações). Busca, `J/K` e `/` funcionam. Sugestões prontas têm **Confirmar** na linha e **Confirmar sugestões (N)** na aba.
- **Limitação do backend (importante):** o `POST …/reconciliation` aplica **todas** as linhas casadas; não há confirmação por linha. Por isso "Confirmar" abre um diálogo que explica isso e o botão fala em *sugestões* (plural). Pedido ao backend: confirmar por `fit_id`/lote (fase 3).
- **Mantido da tela antiga:** modais de vincular título e criar movimento (fase 2 troca por painel), banner de aplicações em lote, Desconciliar, permissões.
- **Componentes novos (kit):** `ui/ReconciliationWorkspace`, `ReconciliationSummary`, `ReconciliationRow`, `ReconciliationDetailPanel`, `QueueTabs`, `ProgressRing`. `FormContainer` ganhou a prop `fullBleed`.
- **i18n:** novo bloco `ofxImports.ofxImport.reconciliation.workspace` (PT-BR/EN-US/ES-ES).
- **Como validar:** subir a API local (`scripts/dev-db`) e abrir `/financeiro/ofx/f0000020-0000-4000-8000-000000000001/conciliacao` (dados sintéticos com estado em memória; reiniciar a API reseta).
- **Pendente (fases 2–5):** painel com abas Vincular/Criar/Transferência, candidatos com score, regras, desfazer em toast, lote por limiar, auditoria.
