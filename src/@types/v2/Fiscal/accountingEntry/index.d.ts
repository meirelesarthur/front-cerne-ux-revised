// src/@types/v2/Fiscal/accountingEntry/index.d.ts
// DTOs de Partida Dobrada (AccountingEntry — domínio Fiscal, F-128, esteira
// 97-Esteiras/068, TASK-PD-FE-01). Módulo 100% novo, CRUD puro (SEM
// ativar/inativar — não gerar `enabled`/`ActivateAndInactivate...`).
//
// ⚠️ PROIBIDO nos tipos de PAYLOAD de escrita (`CreateOrUpdateAccountingEntryRequest`/
// `AccountingEntryItemRequest`): `total_amount`, `code`, `user_id`, `farm_id` — o
// DTO real da API (`app/Data/AccountingEntry/AccountingEntryData.php`,
// `AccountingEntryRequest`) NÃO os aceita; são sempre resolvidos/calculados no
// servidor (GAP-PD-02/03/04, já `CORRIGIDO`). Eles só existem no tipo de
// LEITURA (`AccountingEntryData` de resposta, abaixo).

import { Option } from '@/@types/option';

// Origem do lançamento — 3 valores fixos, sem "Selecione" (placeholder é só de UI)
export type AccountingEntryOrigin = 'A' | 'G' | 'P';

// Condição da linha (Débito/Crédito) — SÓ 2 valores. Nunca adicionar um 3º
// (dead path, `condition=3` "Ambos" não existe neste domínio — contrato-tela
// §4, FID-G3F linha FLD-13/CLM-15). NÃO confundir com `PlanAccountCondition`
// (natureza da conta, módulo Plano de Contas, que pode ter "Ambos") — domínios
// DIFERENTES (CLM-14).
export type AccountingEntryItemCondition = 1 | 2;

// ---- Leitura (resposta da API — AccountingEntryResource/AccountingEntryItemResource) ----
export interface AccountingEntryItemData {
  uuid: string;
  plan_account: { uuid: string; code: string; description: string } | null;
  condition: { value: AccountingEntryItemCondition; label: string };
  value: number;
}

export interface AccountingEntryData {
  uuid: string;
  code: string;
  description: string;
  total_amount: number;
  origin: { value: AccountingEntryOrigin; label: string };
  date: string; // ISO date string
  user?: { uuid: string; name: string } | null; // whenLoaded — ausente/null fora de show/edit
  items?: AccountingEntryItemData[]; // whenLoaded — AUSENTE no index (listagem enxuta)
}

// ---- Formulário (React Hook Form) ----
export interface AccountingEntryItemForm {
  // uuid da linha (edição) — ausente/undefined em linha nova, NÃO enviado no payload
  uuid?: string;
  plan_account_uuid: Option<string> | null; // Select — sempre Option<T>, nunca string direta
  condition: Option<AccountingEntryItemCondition> | null;
  value: number | null;
}

export interface AccountingEntryForm {
  date: string | null;
  description: string;
  origin: Option<AccountingEntryOrigin> | null;
  items: AccountingEntryItemForm[];
}

// ---- Filtro (FilterSide) ----
export interface AccountingEntryFilterForm {
  code?: string;
  origin?: Option<AccountingEntryOrigin> | null;
  description?: string;
  start_date?: Date | null;
  end_date?: Date | null;
  user_uuid?: Option<string> | null;
}

// ---- Query params enviados na listagem (Option<T> → T) ----
export interface AccountingEntryFilterRequest {
  code?: string;
  origin?: AccountingEntryOrigin;
  description?: string;
  start_date?: string;
  end_date?: string;
  user_uuid?: string;
}

// ---- Payload de escrita (create/update) ----
// ⚠️ PROIBIDO incluir aqui: total_amount, code, user_id, farm_id — ver nota de
// topo do arquivo (GAP-PD-02/03/04).
export interface AccountingEntryItemRequest {
  plan_account_uuid: string;
  condition: AccountingEntryItemCondition;
  value: number;
}

export interface CreateOrUpdateAccountingEntryRequest {
  date: string;
  description: string;
  origin: AccountingEntryOrigin;
  items: AccountingEntryItemRequest[]; // SEMPRE enviado por completo — nunca omitido (decisão §1 do contrato de tela)
}

// ============================================
// ENVELOPE PAGINADO CRU (ApiResponse::paginated — GET /double-entry-accountings)
// Mirror de `NutritionsApiPaginationMeta`/`NutritionsListEnvelope`
// (`src/@types/v2/Nutritions/index.d.ts`). O service adapta este envelope
// cru para `ResponsePagination<AccountingEntryData[]>` (shape de grid) — NUNCA
// repassar `data` cru direto (TASK-PD-FE-FIX-LIST).
// ============================================

export interface AccountingEntriesApiPaginationMeta {
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

export interface AccountingEntriesListEnvelope {
  success: boolean;
  message: string;
  data: AccountingEntryData[];
  errors: Record<string, string[]> | null;
  meta: AccountingEntriesApiPaginationMeta | null;
}
