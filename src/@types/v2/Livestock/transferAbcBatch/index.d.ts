// src/@types/v2/Livestock/transferAbcBatch/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Transferência ABC de Animais entre Lotes" (TransferAbcBatch
// — Operacional > Pecuária > Transferências, 97-Esteiras/039, TASK-FE-039-ABC-01).
// Confirmado campo a campo contra o código REAL da API (`GB.Cerne.Api`):
//   app/Http/Resources/V1/TransferAbcBatchResource.php   (leitura — index/show)
//   app/Http/Resources/V1/TransferAbcAnimalResource.php  (leitura — animals[])
//   app/Http/Requests/Api/V1/TransferAbcBatchRequest.php (escrita — store)
//   app/Http/Requests/Api/V1/TransferAbcBatchIndexRequest.php (filtro — só `per_page`)
//   app/Enums/TransferAbcTypeEnum.php                    (1=Entrada, 2=Saída)
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /transfer-abc-batches          → data: TransferAbcBatchListItem[], meta paginação REAL
//   GET    /transfer-abc-batches/{uuid}   → data: TransferAbcBatchDetailData (eager completo)
//   POST   /transfer-abc-batches          → payload CreateTransferAbcBatchRequest → data: TransferAbcBatchDetailData
//   DELETE /transfer-abc-batches/{uuid}   → 204, sem body
//
// SEM `update` (D3, parity — o legado nunca teve `edit()`/`update()`).
//
// ⚠️ Achado confirmado por leitura DIRETA (`TransferAbcBatchIndexRequest::rules()`):
// a listagem NÃO tem NENHUM filtro de campo — só `per_page`. Não fabricar
// filtros que o servidor ignoraria (SEM MOCK) — a tela de listagem (FE-02)
// não monta drawer de filtro por ausência de campo filtrável real.
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 1/Lei 10).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUM BACKED (valor físico exato — app/Enums/TransferAbcTypeEnum.php)
// ============================================

export type TransferAbcType = 1 | 2; // 1 = Entrada, 2 = Saída

// ============================================
// REFS ANINHADAS (shape 1:1 com TransferAbcBatchResource.php, lido no código real)
// ============================================

export interface TransferAbcBatchUserRef {
  uuid: string;
  label: string;
}

/** `provider`/`client` — a API agora expõe `name` junto do `uuid` no Resource real. */
export interface TransferAbcBatchThirdPartyRef {
  uuid: string;
  name: string | null;
}

export interface TransferAbcBatchBatchRef {
  uuid: string;
  description: string | null;
}

export interface TransferAbcAnimalRef {
  uuid: string;
  identification: string | null;
}

// ============================================
// ANIMAL DA TRANSFERÊNCIA (leitura — `TransferAbcAnimalResource`, só
// presente no `show`, `whenLoaded`)
// ============================================

export interface TransferAbcAnimalData {
  uuid: string;
  last_weight: number;
  actual_weight: number;
  value: number;
  total_value: number;
  animal: TransferAbcAnimalRef | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// FINANCEIRO (leitura, resumo) — `expenses[]`/`incomes[]` só aparecem no
// `show` (`whenLoaded`), sem eager-load de relações internas
// (`ExpenseResource`/`IncomeResource` reais expõem MUITO mais campos, mas
// `TransferAbcBatchRepository::EAGER_LOAD_DETAIL` só carrega
// `expenses`/`incomes` RASOS — os campos de relação aninhada desses 2
// Resources ficam ausentes por `whenLoaded` não satisfeito). Tipados aqui
// só com os campos ESCALARES garantidos pelo Model, nunca fabricando
// relação não carregada.
// ============================================

export interface TransferAbcExpenseSummary {
  uuid: string;
  number: string | null;
  code: string | null;
  note: string | null;
  amount: number;
  balance: number;
  due_date: string | null;
  dt_emission: string | null;
}

export interface TransferAbcIncomeSummary {
  uuid: string;
  number: string | null;
  code: string | null;
  note: string | null;
  amount: number;
  balance: number;
  due_date: string | null;
}

// ============================================
// LISTAGEM — `GET /transfer-abc-batches` (index, sem relações internas
// carregadas nos itens de detalhe do financeiro/animais — Resource
// completo, mas `animals`/`expenses`/`incomes` só populam no `show`).
// ============================================

export interface TransferAbcBatchListItem {
  uuid: string;
  code: string;
  date: string; // YYYY-MM-DD
  type: TransferAbcType;
  type_label: string;
  description: string;
  user: TransferAbcBatchUserRef | null;
  provider: TransferAbcBatchThirdPartyRef | null;
  client: TransferAbcBatchThirdPartyRef | null;
  origin_batch: TransferAbcBatchBatchRef | null;
  destination_batch: TransferAbcBatchBatchRef | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// DETALHE — `GET /transfer-abc-batches/{uuid}` (show, eager completo:
// `animals.animal`, `expenses`, `incomes`, além do que já vem no índice).
// ============================================

export interface TransferAbcBatchDetailData extends TransferAbcBatchListItem {
  animals: TransferAbcAnimalData[];
  expenses: TransferAbcExpenseSummary[];
  incomes: TransferAbcIncomeSummary[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /transfer-abc-batches)
// ============================================

export interface TransferAbcBatchesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TransferAbcBatchesListEnvelope {
  success: boolean;
  message: string;
  data: TransferAbcBatchListItem[];
  errors: Record<string, string[]> | null;
  meta: TransferAbcBatchesApiPaginationMeta | null;
}

// ============================================
// FILTRO — a listagem NÃO tem nenhum campo filtrável real
// (`TransferAbcBatchIndexRequest::rules()`, só `per_page`). Sem
// `TransferAbcBatchFilterForm` — não fabricar filtro sem contrato (achado
// confirmado por leitura direta, não Gap de arquitetura).
// ============================================

// ============================================
// REACT HOOK FORM — formulário de CRIAÇÃO (TASK-FE-039-ABC-03)
// ============================================

/** 1 linha do repeater de animais (form) — mirror `FarmTransferItemForm`. */
export interface TransferAbcAnimalForm {
  animal_uuid: Option<string> | null;
  /** Readonly — hidratado a partir do candidato do lote origem (`weight`), nunca editável. */
  last_weight: number | null;
  actual_weight: number | null;
  value: number | null;
  /** Readonly, calculado — `actual_weight * value` (CV-002). */
  total_value: number;
}

/** 1 linha do rateio financeiro (`financial.categories[]`) — mirror
 *  `FarmTransferAllocationRowForm`, ACRESCIDO de `plan_account_uuid`
 *  opcional (campo real do payload, ausente no irmão). */
export interface TransferAbcCategoryRowForm {
  category_uuid: Option | null;
  center_uuid: Option | null;
  plan_account_uuid: Option | null;
  value: number | null;
}

/** 1 parcela do parcelamento (`financial.installments[]`) — mirror
 *  `FarmTransferInstallmentForm`, campo `due_date` (não `date`). */
export interface TransferAbcInstallmentRowForm {
  due_date: string | null;
  value: number | null;
}

export interface TransferAbcBatchForm {
  /** Readonly sempre — vazio até o servidor devolver o `code` real (só existe pós-criação). */
  code: string;
  date: string;
  type: Option<TransferAbcType> | null;
  description: string;
  /** Visível/obrigatório quando `type===1` (Entrada); oculto/limpo quando `type===2`. */
  provider_uuid: Option<string> | null;
  /** Visível/obrigatório quando `type===2` (Saída); oculto/limpo quando `type===1`. */
  client_uuid: Option<string> | null;
  origin_batch_uuid: Option<string> | null;
  destination_batch_uuid: Option<string> | null;
  animals: TransferAbcAnimalForm[];
  /** Readonly, calculado — Σ `animals[].total_value` (CV-003). */
  vl_total: number;
  financial_number: string;
  financial_type_title_uuid: Option<string> | null;
  financial_proprietary_uuid: Option<string> | null;
  /** "Histórico" na tela (era "Observação") — mesmo campo `note`, agora aceita até 200 chars (TASK-FE-039-ABCFIN-02, FD-FIN1). */
  financial_note: string;
  /** "Dedutível" na tela (era "Possui documento fiscal?") — mesmo campo físico `fiscal_document`, só rótulo (FD-FIN2). Dropdown Sim/Não. */
  financial_fiscal_document: Option<boolean> | null;
  /** Dropdown Sim/Não (era `Switch`) — mesma regra de cascata para `financial_input_date`/`financial_input_value`. */
  financial_has_input: Option<boolean> | null;
  financial_input_date: string | null;
  financial_input_value: number | null;
  /** Front-only (TASK-FE-039-ABCFIN-01) — nunca vai no payload, só monta `installments[]` no clique de "Gerar Parcelas". */
  financial_qtd_installments: number | null;
  /** Front-only — "Venc. 1ª PC". */
  financial_first_installment_date: string | null;
  /** Front-only — "Int. Parcelas (dias)". */
  financial_int_installments: number | null;
  installments: TransferAbcInstallmentRowForm[];
  categories: TransferAbcCategoryRowForm[];
}

// ============================================
// REQUEST TYPES (uuid-first, mirror EXATO de `TransferAbcBatchRequest::rules()`
// lido no código real — nenhum campo inventado). `farm_id`/`user_id` NUNCA
// aparecem aqui (contexto server — DEC-013 não herdado).
// ============================================

export interface TransferAbcAnimalPayload {
  animal_uuid: string;
  last_weight: number;
  actual_weight: number;
  value: number;
}

export interface TransferAbcInstallmentPayload {
  due_date: string;
  value: number;
}

export interface TransferAbcCategoryPayload {
  category_uuid: string;
  center_uuid: string;
  value: number;
  plan_account_uuid?: string;
}

export interface TransferAbcFinancialPayload {
  number: string;
  type_title_uuid: string;
  proprietary_uuid: string;
  note: string;
  fiscal_document: boolean;
  has_input: boolean;
  input_date?: string;
  input_value?: number;
  installments: TransferAbcInstallmentPayload[];
  categories: TransferAbcCategoryPayload[];
}

export interface CreateTransferAbcBatchRequest {
  date: string;
  type: TransferAbcType;
  description: string;
  provider_uuid?: string;
  client_uuid?: string;
  origin_batch_uuid: string;
  destination_batch_uuid: string;
  animals: TransferAbcAnimalPayload[];
  financial: TransferAbcFinancialPayload;
}
