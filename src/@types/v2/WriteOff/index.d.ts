// src/@types/v2/WriteOff/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo COMPARTILHADO de Baixa Manual (WriteOff) — TASK-FE-036-330,
// ONDA 3 sub-onda 3a. Consumido tanto por Contas a Receber (`segment:
// 'incomes'`, TASK-FE-036-333) quanto pela fatia irmã de Contas a Pagar
// (`segment: 'expenses'`, ainda não fatiada). NÃO DUPLICAR — qualquer tela
// que precise de baixa manual importa DESTE arquivo, nunca copia os tipos
// para dentro de `@types/v2/Incomes`/`@types/v2/Financeiro/Expenses`.
//
// Contrato REAL confirmado por leitura direta do backend (`GB.Cerne.Api`,
// TASK-036-GB-02, `🔬 [PARA TESTE]`) — NÃO é o contrato legado:
//   GET  /api/v1/{incomes,expenses}/{uuid}/writeoffs → data: WriteOffListItem[]
//        (envelope `ApiResponse::success`, SEM paginação, `meta: null`) — só
//        baixas ATIVAS (`canceled_at IS NULL`), o backend já filtra.
//   POST /api/v1/{incomes,expenses}/{uuid}/writeoffs → payload WriteOffPayload
//        (`writeoff_type='M'` fixo, sempre bancária — sem campo de UI).
//        `ManualWriteOffIncomeRequest`/`ManualWriteOffExpenseRequest` são
//        IDÊNTICAS campo a campo (mirror 1:1). `reason_uuid` SAIU do payload
//        (`TASK-036-GB-06`) — motivo resolvido no servidor.
//   GET  /api/v1/{incomes,expenses}/{uuid}/writeoffs/suggested-categories →
//        data: SuggestedWriteOffCategory[] (`TASK-036-GB-06`) — rateio
//        sugerido do título para pré-preencher o form, com `*_description`.
//   PUT  /api/v1/writeoffs/{uuid}/cancel → sem payload, sem segment (a API
//        resolve a permissão dinamicamente pelo dono da baixa,
//        `CancelWriteOffRequest::authorize()`), resposta 204 sem corpo.
//
// `net_value` NUNCA é campo de `WriteOffPayload` — é calculado no servidor
// (`amount - discount + penalty + interest + increase`,
// `ManualWriteOffIncomeAction`/`ManualWriteOffExpenseAction`). O front só
// replica a MESMA fórmula como PREVIEW local (Tarefa 331), nunca envia o
// campo no corpo do POST.
//
// `categories[].value` é o valor JÁ CALCULADO da linha (dinheiro) — campo-
// -fonte do rateio da baixa, DIFERENTE de `IncomeApportionmentForm.percentage`
// (rateio do TÍTULO, que usa percentual como fonte). O backend só valida
// `SUM(categories[].value) == net_value` (tolerância `0.01`,
// `ManualWriteOffData`/`WriteOffCategoryRowData`), nunca redistribui.
//
// Divergência de serialização JÁ CONFIRMADA entre os 2 endpoints de criação
// (Income usa `JSON_PRESERVE_ZERO_FRACTION` no `storeWriteoff`, Expense não)
// — o parsing do front NUNCA deve assumir que campos numéricos vêm sempre
// com casas decimais; usar `Number(...)` ao consumir, nunca comparação de
// string.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// SEGMENTO — a única diferença entre Income/Expense é o path da URL
// ============================================

export type WriteOffSegment = 'incomes' | 'expenses';

// ============================================
// CONTRAPARTIDA DA BAIXA INDIVIDUAL — `TASK-036-GB-07`/`08`, mirror 1:1
// `App\Enums\WriteOffCounterpartType` (backend). NÃO confundir com
// `WriteOffBatchForm.writeoff_type` (modalidade do LOTE — `'M'`
// Separado/`'U'` Único, campo DIFERENTE, mesmo nome de campo por herança do
// legado, universo de valores distinto). `M`/`B` disponíveis nos 2
// segmentos; `D`/`I`/`C` só `expenses` (CaP); `E` só `incomes` (CaR) —
// mirror `WriteOffCounterpartType::availableForExpenses()`/
// `availableForIncomes()`.
// ============================================

export type WriteOffCounterpartType = 'M' | 'B' | 'D' | 'I' | 'E' | 'C';

// Option de contrapartida — mirror `WriteOffAdvanceOptionResource`
// (`uuid`+`label`+`balance`), reusado por TODOS os `*-options` sub-recurso
// do título (`advance-options`/`nfe-options`/`income-options`/
// `expense-options`/`card-bill-options`) e por `advance-titles` (2º nível
// da cascata do LOTE, mesmo Resource no backend). `balance` guardado JUNTO
// da option escolhida (RHF) — evita round-trip extra para o `InputReadOnly`
// de saldo (mirror `titleBalance` já usado em outros pontos do módulo).
export interface WriteOffCounterpartOption extends Option<string> {
  balance: number;
}

// ============================================
// API — itens crus dos sub-recursos `*-options`/`advance-titles` (mirror
// `WriteOffAdvanceOptionResource`/`WriteOffNfeOptionResource`: `uuid`+
// `label`+`balance`). `WriteOffAdvancePartyOption` é o item de
// `advance-parties` (1º nível da cascata do LOTE, mirror
// `ProviderOptionResource`/`ClientOptionResource`) — SEM `balance` (o saldo
// é por TÍTULO, não por Fornecedor/Cliente).
// ============================================

export interface WriteOffCounterpartOptionItem {
  uuid: string;
  label: string;
  balance: number;
}

export interface WriteOffAdvancePartyOption {
  uuid: string;
  label: string;
}

// ============================================
// LEITURA — GET /{segment}/{uuid}/writeoffs (mirror 1:1 `WriteOffResource`)
// ============================================

export interface WriteOffAccountRef {
  uuid: string;
  description: string;
}

export interface WriteOffReasonRef {
  uuid: string;
  description: string;
}

export interface WriteOffListItem {
  uuid: string;
  amount: number;
  discount: number;
  penalty: number;
  interest: number;
  increase: number;
  /** Calculado no servidor — NUNCA recalcular no cliente a partir deste valor de leitura. */
  net_value: number;
  date_movement: string;
  /** Sempre `'M'` nesta fatia (baixa manual) — tipos B/D/I/E/C do legado não existem na API migrada. */
  writeoff_type: string;
  /** `null` = baixa ATIVA. O `GET` já filtra por ativas — este campo é só leitura/diagnóstico. */
  canceled_at: string | null;
  note: string | null;
  /** Eager-loaded pelo `WriteOffRepository::activeForIncome/activeForExpense` — sempre presente na listagem. */
  account: WriteOffAccountRef | null;
  reason: WriteOffReasonRef | null;
}

// ============================================
// ENVELOPE — ApiResponse::success (SEM paginação, `meta: null` sempre)
// ============================================

export interface WriteOffsListEnvelope {
  success: boolean;
  message: string;
  data: WriteOffListItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// ESCRITA — POST /{segment}/{uuid}/writeoffs (mirror 1:1
// `ManualWriteOffIncomeRequest`/`ManualWriteOffExpenseRequest`, IDÊNTICAS)
// ============================================

export interface WriteOffCategoryPayload {
  category_uuid: string;
  center_uuid: string;
  /** Valor JÁ CALCULADO da linha (dinheiro) — NUNCA percentual. */
  value: number;
  plan_account_uuid?: string | null;
  harvest_uuid?: string | null;
}

export interface WriteOffPayload {
  /** SEMPRE enviado (`TASK-036-GB-07`) — universo por segmento, `Rule::in` do backend. */
  writeoff_type: WriteOffCounterpartType;
  /** `required_if:writeoff_type,M` — omitido (`undefined`) para os demais tipos. */
  account_uuid?: string;
  /** `required_if:writeoff_type,M` — omitido (`undefined`) para os demais tipos. */
  movement_date?: string;
  /** `required_if:writeoff_type,B` — título de ADIANTAMENTO do MESMO segmento. */
  related_title_uuid?: string;
  /** `required_if:writeoff_type,D` — só `segment='expenses'` (CaP). */
  nfe_uuid?: string;
  /** `required_if:writeoff_type,I` — só `segment='expenses'` (CaP). */
  external_income_uuid?: string;
  /** `required_if:writeoff_type,E` — só `segment='incomes'` (CaR). */
  external_expense_uuid?: string;
  /** `required_if:writeoff_type,C` — só `segment='expenses'` (CaP). */
  card_bill_uuid?: string;
  amount: number;
  discount?: number;
  penalty?: number;
  interest?: number;
  increase?: number;
  note?: string | null;
  categories: WriteOffCategoryPayload[];
}

// ============================================
// LEITURA — GET /{segment}/{uuid}/writeoffs/suggested-categories
// (`TASK-036-GB-06`, mirror 1:1 `SuggestedWriteOffCategoryData`). DTO IRMÃO
// de `WriteOffCategoryPayload` — mesmos campos de FK + `value` já calculado
// (rateio sugerido pelo servidor sobre o `balance` ATUAL do título), mas com
// os `*_description` que a escrita nunca teve motivo de carregar. Usado SÓ
// para pré-preencher `WriteOffCreateModal` sem round-trip extra — NUNCA
// enviado de volta ao servidor (o payload de escrita continua
// `WriteOffCategoryPayload`).
// ============================================

export interface SuggestedWriteOffCategory {
  category_uuid: string;
  category_description: string | null;
  center_uuid: string;
  center_description: string | null;
  /** Valor JÁ CALCULADO (dinheiro) sobre o saldo ATUAL do título — NUNCA percentual. */
  value: number;
  plan_account_uuid?: string | null;
  plan_account_description?: string | null;
  harvest_uuid?: string | null;
  harvest_description?: string | null;
}

// ============================================
// REACT HOOK FORM (shape RHF, mirror `IncomeForm` — `Option<string>` nos
// selects) — consumido por `WriteOffCreateModal` (Tarefa 331).
// `reason_uuid` SAIU do form (`TASK-036-GB-06`) — motivo resolvido no
// servidor (`LowReasonRepositoryInterface::findDefault()`), nunca mais
// escolhido pelo usuário.
// ============================================

export interface WriteOffCategoryForm {
  category_uuid: Option<string> | null;
  center_uuid: Option<string> | null;
  plan_account_uuid: Option<string> | null;
  /** Valor JÁ CALCULADO da linha — campo-fonte do payload (NÃO percentual). */
  value: number | null;
}

export interface WriteOffForm {
  /** `TASK-036-GB-07` — Select estático das 6 opções (filtrado por segmento na tela). */
  writeoff_type: WriteOffCounterpartType | null;
  account_uuid: Option<string> | null;
  movement_date: string | null;
  /** Só `writeoff_type==='B'` — Título de Adiantamento (mesmo segmento). */
  related_title_uuid: WriteOffCounterpartOption | null;
  /** Só `writeoff_type==='D'` — NFe de Devolução (`segment==='expenses'`). */
  nfe_uuid: WriteOffCounterpartOption | null;
  /** Só `writeoff_type==='I'` — Conta a Receber cruzada (`segment==='expenses'`). */
  external_income_uuid: WriteOffCounterpartOption | null;
  /** Só `writeoff_type==='E'` — Conta a Pagar cruzada (`segment==='incomes'`). */
  external_expense_uuid: WriteOffCounterpartOption | null;
  /** Só `writeoff_type==='C'` — Fatura (`segment==='expenses'`). */
  card_bill_uuid: WriteOffCounterpartOption | null;
  amount: number | null;
  discount: number | null;
  penalty: number | null;
  interest: number | null;
  increase: number | null;
  note: string;
  categories: WriteOffCategoryForm[];
}

// ============================================
// ESCRITA EM LOTE — POST /writeoffs/batch (TASK-FE-036-334 + correção
// `GAP-036-114`/`TASK-FE-036-343` v2.0, RE-ESCOPO A3). Mirror do backend
// `TASK-036-GB-05` v2.0 (`BatchWriteOffAction`/`BatchWriteOffData`/
// `BatchWriteOffRequest`, `🔬 [PARA TESTE]`): 1 chamada só, ATÔMICA
// (`DB::transaction`, rollback do LOTE INTEIRO se qualquer linha falhar).
//
// `reason_uuid` SAIU (motivo resolvido no servidor,
// `LowReasonRepositoryInterface::findDefaultForBatch()`) — NUNCA reintroduzir
// neste payload. `rows[].categories` TAMBÉM SAIU (rateio derivado no
// servidor, `DeriveProportionalCategoriesAction`) — `rows[].discount` é o
// ÚNICO encargo por linha; `penalty`/`interest`/`increase` são AGREGADOS do
// LOTE (só relevantes no modo Único, `writeoff_type==='U'`), NUNCA por linha.
//
// 3 MODOS do lote (`banking_movement`):
//   - `true` + `writeoff_type='M'` (Separado): `account_uuid` obrigatório,
//     `related_title_uuid`/`penalty`/`interest`/`increase` ausentes.
//   - `true` + `writeoff_type='U'` (Único): idem + `penalty`/`interest`/
//     `increase` agregados do lote (opcionais).
//   - `false` (Baixa Cruzada): `related_title_uuid` obrigatório (MESMO
//     segmento do lote); `account_uuid`/`writeoff_type` ausentes/ignorados.
//
// `note` (Histórico) + `description`/`file` (Documentos, reaproveita
// `TASK-036-GB-04`) são NOVOS no nível do LOTE — `net_value` da linha
// permanece SEMPRE `amount - discount` (`calculateBatchWriteOffRowNetValue`,
// inalterada), NUNCA `calculateWriteOffNetValue`/`WriteOffForm` (baixa
// individual).
// ============================================

export interface WriteOffBatchRowPayload {
  title_uuid: string;
  amount: number;
  discount?: number;
}

export interface WriteOffBatchPayload {
  segment: WriteOffSegment;
  /** `true` = Movimento Bancário (Separado/Único); `false` = Baixa Cruzada. */
  banking_movement: boolean;
  movement_date: string;
  rows: WriteOffBatchRowPayload[];
  /** Obrigatório quando `banking_movement === true`; ignorado/ausente na Baixa Cruzada. */
  account_uuid?: string | null;
  /** Obrigatório quando `banking_movement === false` — título de ADIANTAMENTO do MESMO segmento. */
  related_title_uuid?: string | null;
  /** Obrigatório quando `banking_movement === true` (`'M'` Separado | `'U'` Único). */
  writeoff_type?: 'M' | 'U' | null;
  /** Encargos AGREGADOS do lote — só enviados/relevantes quando `writeoff_type === 'U'`. */
  penalty?: number;
  interest?: number;
  increase?: number;
  note?: string | null;
  description?: string | null;
  file?: File | null;
  /** TASK-MES-FE-06 (execução 044, Meses Conciliados) — extensão ADITIVA e
   *  OPCIONAL: marca `is_reconciled=true` no `Movement` gerado pela baixa
   *  quando o lote se origina do fluxo de Conciliação OFX
   *  (`CONTRATO-API-MESES §3.4`). Ausente/`undefined` preserva 100% do
   *  comportamento atual para `ContasAPagar`/`Incomes` (nenhum dos dois
   *  consumidores existentes passa este campo). */
  is_reconciled?: boolean;
}

// ============================================
// REACT HOOK FORM (shape RHF do lote) — consumido por `WriteOffBatchModal`
// (Tarefa 335/343). `categories` REMOVIDO (Achado A1) — rateio contábil não
// existe mais no form do lote.
// ============================================

export interface WriteOffBatchRowForm {
  /** Identificação da linha — NUNCA editável, só exibição (título já selecionado pelo consumidor). */
  title_uuid: string;
  title_number: string;
  /** Saldo do título recebido do consumidor — só referência visual, não é enviado ao payload. */
  title_balance: number;
  amount: number | null;
  discount: number | null;
}

export interface WriteOffBatchForm {
  /** Plain `boolean` (não `Option`) — mirror `control_stock`/`ProdutoEstoqueFinanceiroTab`, Select estático converte na borda. */
  banking_movement: boolean;
  account_uuid: Option<string> | null;
  /**
   * `TASK-036-GB-09` — 1º nível da cascata da Baixa Cruzada (Fornecedor c/
   * Saldo em `expenses` | Cliente c/ Saldo em `incomes`). Campo 100%
   * CLIENT-SIDE — NUNCA vai ao `WriteOffBatchPayload`, só reduz as opções
   * do nível 2 (`related_title_uuid`).
   */
  advance_party_uuid: Option<string> | null;
  /**
   * 2º nível da cascata — este SIM vai ao payload (só o `.value`). Tipado
   * como `WriteOffCounterpartOption` (não `Option<string>` puro) para
   * carregar `.balance` junto da option escolhida — alimenta o
   * `InputReadOnly` de saldo e a guarda de saldo (§3 do handshake) sem
   * round-trip extra.
   */
  related_title_uuid: WriteOffCounterpartOption | null;
  /** Plain string (não `Option`) — Select estático converte na borda, mirror `banking_movement`. */
  writeoff_type: 'M' | 'U' | null;
  movement_date: string | null;
  penalty: number | null;
  interest: number | null;
  increase: number | null;
  note: string;
  description: string;
  file: File | null;
  rows: WriteOffBatchRowForm[];
}
