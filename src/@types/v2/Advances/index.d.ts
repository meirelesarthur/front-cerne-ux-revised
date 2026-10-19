// src/@types/v2/Advances/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ADIANTAMENTO SALARIAL (Advance) — API v1 do backend
// Laravel GB.Cerne. TASK-FE-adiant-salarial (97-Esteiras/034) — CRUD núcleo
// (create/edit/list/detalhe). TASK-FE-FINANCEIRO-adiant (97-Esteiras/034,
// D2-REV) ESTENDE com a dimensão financeira ("Gerar Financeiro" —
// has_financial + parcelas financeiras + rateio por categoria), revertendo a
// D2 original (financeiro fora de escopo).
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /advances              → data: Advance[] + meta (paginação real)
//   GET    /advances/{uuid}       → data: Advance
//   POST   /advances              → payload AdvancePayload (201)
//   PUT    /advances/{uuid}       → payload AdvancePayload — FULL REPLACE,
//                                   os 5 campos núcleo são `required`
//                                   (FE-FORM-MODE); financeiro também
//                                   full-replace quando `has_financial`.
//   DELETE /advances/{uuid}       → 204 soft delete
//
// Fonte: FID-G3F-frontend-adiant-salarial.md §3 + FID-G3F-frontend-
// financeiro-adiant.md §3/§5 + AdvanceResource/AdvanceData/AdvanceRequest
// reais (app/Http/Resources/V1/AdvanceResource.php, app/Data/Advance/
// AdvanceData.php, app/Http/Requests/Api/V1/AdvanceRequest.php).
//
// Advance NÃO tem `code` (sem GenerateCode/advisory-lock, ao contrário de
// ProductionCycle) — confirmado no `AdvanceResource` real. `farm_id`/`code`/
// criador NUNCA aparecem no payload (server-derived).
//
// ---- Bloco financeiro — LEITURA (GAP-ADV-02, CONFIRMADO no código real) ----
// A `AdvanceResource::toArray()` (lido em 2026-08-16) ecoa o HEADER
// financeiro completo (reconstruído do `Expense` representativo,
// `$expenses->first()`) para fechar o round-trip do EDIT: `financial.type`
// ({uuid,description}), `financial.provider`/`financial.proprietary`
// ({uuid,name}|null), `financial.number`, `financial.note`,
// `financial.fiscal_document`. Também ecoa `financial.installments[]`
// ({due_date,value} — write-shape 1:1) e `financial.categories[]` (rateio
// JÁ AGREGADO por categoria/centro pelo servidor, valor ABSOLUTO — não é
// mais preciso agregar no client a partir de `expenses[]`). `financial.
// expenses[]` continua vindo à parte (rateio POR PARCELA, mantido para
// display). SÓ `has_input`/`input_date`/`input_value` NÃO voltam — nunca
// foram persistidos (`GenerateAdvanceExpensesAction` só usa header+
// installments+categories; esses 3 campos só alimentam o gerador
// client-side na CRIAÇÃO) — no EDIT ficam neutros (`has_input=false`,
// sem aviso de bloqueio, não é mais um gap). Ver `advance-financial-
// hydrate.ts` (adaptador read→form).
// -----------------------------------------------------------------------------

// ============================================
// RELAÇÕES (whenLoaded — sempre {uuid,...})
// ============================================

export interface AdvanceEmployeeRef {
  uuid: string;
  name: string | null;
}

export interface AdvanceEventRef {
  uuid: string;
  name: string;
}

// ============================================
// INSTALLMENT (linha de parcela — wire-level)
// ============================================

export interface Installment {
  /** ISO 'YYYY-MM' — mês da parcela (sem remap, backend valida/persiste como está). */
  month: string;
  value: number;
}

// ============================================
// ADVANCE (resposta da API)
// ============================================

export interface Advance {
  uuid: string;
  /** 'YYYY-MM-DD' (Resource expõe `date.toDateString()`). */
  date: string;
  /** Cast `decimal:2` no Model, exposto como string pelo Resource — sempre
   *  convertido para `number` no client antes de popular o form/exibir. */
  amount: string | number;
  installments: Installment[];
  employee?: AdvanceEmployeeRef;
  event?: AdvanceEventRef;
  /** Dimensão financeira (D2-REV). `financial` só vem preenchido quando há
   *  >=1 Expense gerado — ver `AdvanceFinancialRead` (LEITURA — header +
   *  installments/categories ecoados desde GAP-ADV-02). */
  has_financial: boolean;
  financial?: AdvanceFinancialRead;
  created_at: string;
  updated_at: string;
}

export type AdvanceListItem = Advance;
export type AdvanceDetail = Advance;

// ============================================
// FINANCEIRO — LEITURA (AdvanceResource::toArray()/aggregatedCategories(),
// GAP-ADV-02 — header + write-shape agregado CONFIRMADOS no código real)
// ============================================

export interface AdvanceFinancialExpenseCategoryRead {
  category: { uuid: string; description: string };
  center: { uuid: string; description: string } | null;
  /** Proporcional por parcela (rateio POR PARCELA, display). Para o rateio
   *  ABSOLUTO agregado, ver `AdvanceFinancialRead.categories` (já vem
   *  agregado pelo servidor — não recalcular no client). */
  value: string | number;
}

export interface AdvanceFinancialExpenseRead {
  code: string | null;
  /** 'YYYY-MM-DD'. */
  due_date: string;
  amount: string | number;
  balance: string | number;
  installment: number;
  categories: AdvanceFinancialExpenseCategoryRead[];
}

export interface AdvanceFinancialHeaderTypeRef {
  uuid: string;
  description: string;
}

/** Shape de `financial.provider`/`financial.proprietary` — resolvidos por
 *  lookup em lote na Resource (`providerRow()`/`proprietaryRow()`, tabelas
 *  legadas via `DB::table` + join em `people`). */
export interface AdvanceFinancialHeaderPartyRef {
  uuid: string;
  name: string;
}

export interface AdvanceFinancialReadInstallment {
  /** 'YYYY-MM-DD' — `$expense->due_date->toDateString()`. */
  due_date: string;
  /** `(string) $expense->amount` — valor da parcela (não `balance`). */
  value: string | number;
}

/** Rateio JÁ AGREGADO por categoria/centro pelo servidor
 *  (`aggregatedCategories()`) — valor ABSOLUTO, pronto para reidratar o
 *  form 1:1 (NÃO reagregar a partir de `expenses[]` no client). */
export interface AdvanceFinancialReadCategory {
  category: { uuid: string; description: string };
  center: { uuid: string; description: string } | null;
  value: string | number;
}

/** Bloco financeiro devolvido na LEITURA (`GET /advances/{uuid}`) — só
 *  aparece quando há >=1 `Expense` vinculado (`has_financial=true`).
 *  Header (`type`/`provider`/`proprietary`/`number`/`note`/
 *  `fiscal_document`) ecoado desde GAP-ADV-02 (confirmado em
 *  `AdvanceResource::toArray()`, 2026-08-16) — fecha o round-trip do EDIT.
 *  `has_input`/`input_date`/`input_value` NUNCA voltam (nunca persistidos —
 *  só alimentam o gerador client-side na criação; ver `advance-financial-
 *  hydrate.ts`). */
export interface AdvanceFinancialRead {
  type: AdvanceFinancialHeaderTypeRef | null;
  provider: AdvanceFinancialHeaderPartyRef | null;
  proprietary: AdvanceFinancialHeaderPartyRef | null;
  number: string | null;
  note: string | null;
  /** Coluna Postgres `boolean` (`expenses.fiscal_document`) SEM cast
   *  Eloquent explícito no Model (`Expense::casts()` não a lista) —
   *  serializa como `boolean` nativo no JSON. Hidratação normaliza para
   *  `'0'|'1'` (`advance-financial-hydrate.ts`, tolera também string por
   *  robustez). */
  fiscal_document: boolean | '0' | '1';
  installments: AdvanceFinancialReadInstallment[];
  categories: AdvanceFinancialReadCategory[];
  /** Rateio POR PARCELA (display), mantido inalterado. */
  expenses: AdvanceFinancialExpenseRead[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface AdvancesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface AdvancesListEnvelope {
  success: boolean;
  message: string;
  data: Advance[];
  errors: Record<string, string[]> | null;
  meta: AdvancesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (payload wire-level — AdvanceData/AdvanceRequest)
// ============================================

export interface AdvancePayload {
  employee_uuid: string;
  event_uuid: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  amount: number;
  installments: Installment[];
  /** D2-REV — "Gerar Financeiro". `financial` só é enviado quando `true`. */
  has_financial: boolean;
  financial?: AdvanceFinancialPayload;
  // NUNCA no payload: code (Advance não tem), farm_id (R4), user/criador (R7).
}

// ============================================
// FINANCEIRO — ESCRITA (POST/PUT, AdvanceRequest::rules(), D2-REV)
// ============================================

export interface AdvanceFinancialInstallment {
  /** 'YYYY-MM-DD' — vencimento da conta a pagar (cronograma financeiro,
   *  distinto do `month` do núcleo). */
  due_date: string;
  value: number;
}

export interface AdvanceFinancialCategory {
  category_uuid: string;
  /** ABSOLUTO (não percentual) — o servidor distribui proporcionalmente por
   *  parcela ao gerar os `Expense`. */
  value: number;
  center_uuid: string;
  // plan_account/plan_account_uuid NUNCA enviado (DEC-FIN-B).
}

export interface AdvanceFinancialPayload {
  type_uuid: string;
  provider_uuid?: string | null;
  proprietary_uuid?: string | null;
  number?: string | null;
  note?: string | null;
  /** '1' = Sim (default), '0' = Não. */
  fiscal_document: '0' | '1';
  has_input?: boolean;
  /** 'YYYY-MM-DD' — required_if `has_input=true`. */
  input_date?: string | null;
  input_value?: number | null;
  installments: AdvanceFinancialInstallment[];
  categories: AdvanceFinancialCategory[];
  // qtd_installments NUNCA enviado — o servidor deriva de installments.length.
}

// ============================================
// REACT HOOK FORM (create/edit)
// ============================================

export interface InstallmentFormRow {
  /** ISO 'YYYY-MM' ou '' (linha vazia default). */
  month: string;
  value: number | null;
}

// ---- FORM do bloco financeiro (RHF, nullable p/ inputs vazios) ----

export interface AdvanceFinancialInstallmentFormRow {
  /** 'YYYY-MM-DD' ou '' (linha vazia default) — DateInput. */
  due_date: string;
  value: number | null;
}

export interface AdvanceFinancialCategoryFormRow {
  /** uuid cru ou '' (linha vazia) — cache de exibição em `useState<Record
   *  <string, Option>>` no componente (mirror `ExpenseApportionmentTab`),
   *  NÃO um `Option` no próprio campo RHF (convenção do núcleo Advance,
   *  `employee_uuid`/`event_uuid`). */
  category_uuid: string;
  center_uuid: string;
  value: number | null;
  /** UI-only — NUNCA vai no wire (descartado ao montar o payload). */
  percent: number | null;
}

export interface AdvanceFinancialForm {
  type_uuid: string;
  provider_uuid: string | null;
  proprietary_uuid: string | null;
  number: string | null;
  note: string | null;
  fiscal_document: '0' | '1';
  has_input: boolean;
  input_date: string | null;
  input_value: number | null;
  installments: AdvanceFinancialInstallmentFormRow[];
  categories: AdvanceFinancialCategoryFormRow[];
}

export interface AdvanceForm {
  uuid?: string;
  employee_uuid: string;
  event_uuid: string;
  date: string;
  amount: number | null;
  installments: InstallmentFormRow[];
  /** D2-REV — "Gerar Financeiro" (master toggle, static Select sim/não). */
  has_financial: boolean;
  /** SEMPRE presente na forma do RHF (mesmo com `has_financial=false`) —
   *  só é validado/enviado quando o toggle está ligado. */
  financial: AdvanceFinancialForm;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface AdvanceFilterForm {
  employee_uuid?: string;
}
