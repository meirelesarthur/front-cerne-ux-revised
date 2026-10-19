// src/@types/v2/BatchTransfers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo TRANSFERÊNCIA ANIMAIS/LOTE (BatchTransfer — Operacional /
// Pecuária, feature `426be835`, TASK-LOTE-FE-01/02). Transcritos dos
// Resources/Actions REAIS do fork (`BatchTransferController`,
// `EligibleAnimalResource`, `GetBatchTransferCreateOptionsAction`), NÃO do
// contrato de API v1 desenhado — ver
// `01-Arquitetura_e_Contratos/frontend-contract-animais-lote.md §4.2`.
//
// ⚠️ Esta feature NÃO tem listagem de transferências realizadas — o legado
// nunca teve. `EligibleAnimal` é o shape da listagem de ANIMAIS ELEGÍVEIS
// para transferir (`change-batch-animals.index`), não um histórico.
//
// `BatchTransferCreateOptions` NÃO tem `user` — corrigido contra a
// expectativa do contrato de API v1 (`GAP-LOTE-07`, já resolvido na Tarefa 26
// da API). "Responsável" vem de `useAuth()` no formulário (Tarefa 27).
// -----------------------------------------------------------------------------

// ---- Listagem (Tarefa 26) --------------------------------------------------

// GET /batch-transfers/eligible-animals — item da grid de animais elegíveis.
export interface EligibleAnimal {
  uuid: string;
  /** Valor CRU do backend ('batch' | outro | null) — rótulo é do front (mapper `batch-transfer-type.ts`, §5.2 do contrato). */
  type: string | null;
  /** Já concatenada pelo servidor (`" - "`) ou `"S/ID"` — nunca remontar aqui. */
  identification: string;
  /** String JÁ FORMATADA pelo servidor (ex.: "3 anos, 2 meses e 1 dias") — renderizar sem reformatar; `null` → "—". */
  age: string | null;
  /** Descrição da categoria — string crua (alias de JOIN, não objeto aninhado). */
  category: string | null;
  /** Descrição do lote ATUAL do animal — `null` → "—". */
  batch: string | null;
}

export interface EligibleAnimalsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// Envelope CRU do backend (`ApiResponse::paginated`) — o serviço adapta à
// mão para `ResponsePagination` (mirror literal de `getBatches`, §7 do
// contrato) porque o interceptor genérico NÃO desempacota.
export interface EligibleAnimalsListEnvelope {
  success: boolean;
  message: string;
  data: EligibleAnimal[];
  errors: Record<string, string[]> | null;
  meta: EligibleAnimalsApiPaginationMeta | null;
}

export interface BatchTransferFilterForm {
  category_uuid?: string;
  batch_uuid?: string;
  /** Igualdade EXATA no backend (`where(...identification, $valor)`), não `ILIKE` — fidelidade deliberada (contrato §5.3). */
  identification?: string;
}

/** Mesmo shape do filtro — não há camada de tradução adicional entre o formulário do drawer e a query string desta tela. */
export type BatchTransferFilterRequest = BatchTransferFilterForm;

// ---- Formulário de criação (Tarefa 27) -------------------------------------

export interface BatchTransferCreateOptionItem {
  uuid: string;
  description: string;
}

// GET /batch-transfers/create-options — lookups do form. Sem `user` (ver
// nota de cabeçalho) — "Responsável" sai de `useAuth()`.
export interface BatchTransferCreateOptions {
  batches: BatchTransferCreateOptionItem[];
  categories: BatchTransferCreateOptionItem[];
  /** Preview de exibição do próximo código — pode divergir do gravado sob concorrência (`GAP-LOTE-06`), nunca tratar como garantia. */
  next_code: string;
}

export interface BatchTransferResultBatchRef {
  uuid: string;
  description: string;
}

export interface BatchTransferResultEmployeeRef {
  uuid: string;
  name: string | null;
}

export interface BatchTransferResultUserRef {
  uuid: string;
  name: string;
}

export interface BatchTransferResultAnimal {
  uuid: string;
  identification: string;
  /** `null` quando o animal não tinha lote de origem no momento da transferência. */
  batch_old: BatchTransferResultBatchRef | null;
}

// POST /batch-transfers → resultado da criação (usado no toast/redirect, não
// há tela de detalhe — a rota web só tem index/create/store).
export interface BatchTransferResult {
  code: string;
  date: string;
  batch_next: BatchTransferResultBatchRef;
  employee: BatchTransferResultEmployeeRef | null;
  user: BatchTransferResultUserRef;
  animals: BatchTransferResultAnimal[];
}

// Payload REAL do POST — só 3 campos (contrato §6.1): `code`/`user_id`/
// `farm_id`/`employee_id` NUNCA são enviados pelo cliente.
export interface CreateBatchTransferRequest {
  date: string;
  /** uuid do Lote de DESTINO (`batch_id` no Request do backend). */
  batch_id: string;
  animals: string[];
}

/** Alias semântico — mesmo shape de `CreateBatchTransferRequest`, usado no mutation wrapper da tela. */
export type BatchTransferForm = CreateBatchTransferRequest;
