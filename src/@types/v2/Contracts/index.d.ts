// src/@types/v2/Contracts/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Gestão de Contratos" (Contract — Financeiro, esteira
// 97-Esteiras/023, TASK-CTR-FE-01). Fundação de dados — nenhuma lógica, só
// shapes. Mirror estrutural de `@/@types/v2/RequestPurchases/index.d.ts`,
// bem mais enxuto: Contract não tem enums de status/tipo/prioridade, não tem
// anexos, não tem histórico de movimentação/trâmite.
//
// Fonte: Contract-FrontEnd-contrato.md §3 (Resource/Form Request CONFIRMADOS
// por leitura direta de `api_root` nesta rodada, 2026-08-06).
//
// `provider`/`employee` expõem `{uuid, label}` (não `{uuid, name}` nem
// `{uuid, description}`) — nome de campo exato do `ContractResource` real.
// `amount` é sempre recalculado server-side (DA-CT-06) — nunca aceito no
// payload de escrita. FKs expostas como `*_uuid` (convenção universal do
// projeto) — nenhum `id` sequencial exposto (Lei do client API Cerne).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADOS (FKs relacionais)
// ============================================

export interface ContractProviderRef {
  uuid: string;
  label: string | null;
}

export interface ContractEmployeeRef {
  uuid: string;
  label: string | null;
}

export interface ItemContractWarehouseRef {
  uuid: string;
  initials: string;
  description: string;
}

export interface ItemContractProductRef {
  uuid: string;
  description: string;
}

// ============================================
// ITEM DE CONTRATO (leitura)
// ============================================

export interface ItemContractRow {
  uuid: string;
  warehouse: ItemContractWarehouseRef | null;
  product: ItemContractProductRef | null;
  quantity: number;
}

// ============================================
// CONTRACT (resposta da API)
// ============================================

export interface ContractListItem {
  uuid: string;
  code: string;
  number: string;
  date: string; // ISO date
  expiration_date: string; // ISO date
  /** Sempre recalculado server-side (DA-CT-06) — somente leitura. */
  amount: number;
  installments: number;
  quantity: number;
  unit_value_sc: number | null;
  provider: ContractProviderRef | null;
  employee: ContractEmployeeRef | null;
  created_at: string;
  updated_at: string;
}

/** `GET /contracts/{uuid}` — shape de detalhe. Mesmo shape da listagem,
 *  acrescido dos itens (não exibidos na grid). */
export interface ContractData extends ContractListItem {
  items: ItemContractRow[];
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface ContractsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ContractsListEnvelope {
  success: boolean;
  message: string;
  data: ContractListItem[];
  errors: Record<string, string[]> | null;
  meta: ContractsApiPaginationMeta | null;
}

// ============================================
// PAYLOAD (create/update)
// ============================================

export interface ItemContractPayload {
  /** `null`/ausente = item novo (DA-CT-08) — presente = item existente mantido. */
  item_uuid?: string | null;
  warehouse_uuid: string;
  product_uuid: string;
  quantity: number;
}

/** Payload completo (store/update). SEM `amount`/`code`/`farm_id` — NUNCA
 *  aceitos pelo Form Request real (contrato de tela §3). */
export interface ContractPayload {
  provider_uuid: string;
  employee_uuid: string;
  number: string;
  date: string;
  expiration_date: string;
  installments: number;
  quantity: number;
  unit_value_sc: number;
  items: ItemContractPayload[];
}

// ============================================
// FILTRO (grid da listagem)
// ============================================

export interface ContractFilterForm {
  search?: string;
  employee_uuid?: string;
  provider_uuid?: string;
}

export interface ContractFilterRequest extends ContractFilterForm {}

// ============================================
// FORM (react-hook-form) — item mantém shape RAW (mirror
// RequestItemFormRow), componente de linha resolve exibição internamente
// (useFieldArray, TASK-CTR-FE-06).
// ============================================

export interface ItemContractFormRow {
  item_uuid?: string | null;
  warehouse_uuid: Option<string> | null;
  product_uuid: Option<string> | null;
  quantity: number | null;
}

export interface ContractForm {
  provider_uuid: Option<string> | null;
  employee_uuid: Option<string> | null;
  number: string;
  date: string | null;
  expiration_date: string | null;
  installments: number | null;
  quantity: number | null;
  unit_value_sc: number | null;
  items: ItemContractFormRow[];
}

// Reexport de conveniência (mirror `RequestPurchases/index.d.ts`) — evita
// import direto de `@/@types/option` nas telas quando só o alias for necessário.
export type { Option };
