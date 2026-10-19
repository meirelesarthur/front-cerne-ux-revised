// src/@types/v2/ChargeBillExpense/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Contas a Pagar" (ChargeBillExpense — Operacional /
// Agricultura / Carregamento). TASK-CBE-04 (fundação), esteira
// `97-Esteiras/062`. Mirror ESTRUTURAL de `@types/v2/ChargeBillIncome/
// index.d.ts` (gêmeo, execução 059) — CRUD flat, sem satélites aninhados além
// de `provider`/`cultivation` + `branch` (EXCLUSIVO desta feature).
//
// Fonte: contrato de tela §2/§3 (`CORE_WORKSPACE/97-Esteiras/062/CONTRATOS/
// contrato-tela-charge-bill-expenses-frontend.md`) + contrato legado
// (`legacy-contract-charge-bill-expenses.md`). `uuid` sempre, `id` NUNCA
// aparece no envelope.
//
// DOMÍNIO PRÓPRIO — NÃO confundir com `Expense` (Financeiro → Pagar,
// `@types/v2/Financeiro`, tabela `expenses`): `ChargeBillExpense` é a tabela
// `charge_bills` com `type='S'` (Carregamento), permissões `charge_expense_*`,
// menu "Carregamento".
//
// DEC-FE-02 (ratificado, mirror do gêmeo) — a escrita usa `provider_uuid`/
// `branch_uuid`/`cultivation_uuid` (uuid), NUNCA `provider_id`/`branch_id`/
// `cultivation_id` (o backend resolve uuid→id internamente na Action). Os
// selects de `providers/options`/`branches`/`cultivations/options` só
// devolvem `{uuid,label}` (branch: `{uuid,name}` adaptado para `{uuid,label}`
// no service).
//
// `branch_uuid`/`branch` são EXCLUSIVOS desta feature (não existem no gêmeo
// `ChargeBillIncome`) — cascata `provider→branch` (contrato §2.2/§6, mirror
// `Financeiro/ContasAPagar/CreateOrUpdateExpense.tsx`).
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// ENTIDADES ANINHADAS (satélites do `ChargeBillExpenseResource`)
// ============================================

export interface ChargeBillExpenseProviderRef {
  uuid: string;
  name: string;
}

export interface ChargeBillExpenseCultivationRef {
  uuid: string;
  name: string;
}

// EXCLUSIVO desta feature — não existe em `ChargeBillIncome` (contrato §6).
export interface ChargeBillExpenseBranchRef {
  uuid: string;
  name: string;
}

// ============================================
// RECURSO PRINCIPAL — LISTAGEM (`ChargeBillExpenseResource`, `index` eager-
// carrega `provider`/`cultivation`/`branch` — contrato §4). `branch` NUNCA
// aparece em coluna da listagem (list_manifest note, fiel ao legado), mas o
// campo existe no shape para a tela de Detalhe/re-hidratação do form.
// ============================================

export interface ChargeBillExpenseListItem {
  uuid: string;
  code: string;
  dt_emission: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  number: string | null;
  amount: number;
  description: string;
  type: string;
  provider: ChargeBillExpenseProviderRef | null;
  cultivation: ChargeBillExpenseCultivationRef | null;
  branch: ChargeBillExpenseBranchRef | null;
  created_at: string;
}

// ============================================
// RECURSO PRINCIPAL — DETALHE (`GET /charge-bill-expenses/{uuid}`, contrato
// §2.3 — 8 campos read-only exibidos na tela, `branch` presente no payload
// mas OMITIDO da renderização de Detalhe, fiel ao legado).
// ============================================

export type ChargeBillExpenseDetail = ChargeBillExpenseListItem;

// ============================================
// PAYLOAD DE ESCRITA (POST/PUT — contrato §2.2). `code`/`type`/`farm_id`
// NUNCA são enviados pelo cliente (server-authoritative, RN-01/RN-02/RN-04/
// RN-05/RN-16 do contrato legado).
// ============================================

export interface ChargeBillExpensePayload {
  dt_emission: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  number?: string | null;
  amount: number;
  provider_uuid?: string | null;
  branch_uuid?: string | null;
  cultivation_uuid?: string | null;
  description: string;
}

// ============================================
// FORM (RHF, `CreateOrUpdateChargeBillExpense.tsx` — TASK-CBE-06, FORA do
// escopo desta execução). Relações como `Option<string>|null` (guarda o
// `Option{label,value=uuid}` inteiro, extração do uuid cru pro payload só
// no submit — mirror `ChargeBillIncomeForm`). Declarado AQUI (fundação) para
// o CBE-06 plugar sem tocar neste arquivo.
// ============================================

export interface ChargeBillExpenseForm {
  code: string; // readonly/view — RN-04/RN-05 (placeholder no create)
  dt_emission: string; // ISO YYYY-MM-DD
  due_date: string; // ISO YYYY-MM-DD
  number: string;
  amount: number;
  provider_uuid: Option<string> | null;
  branch_uuid: Option<string> | null;
  cultivation_uuid: Option<string> | null;
  description: string;
}

// ============================================
// ENVELOPE (ApiResponse::paginated) — a listagem devolve um array PLANO em
// `data` (mesma armadilha de `ChargeBillIncomeEnvelope`).
// ============================================

export interface ChargeBillExpensesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface ChargeBillExpenseEnvelope {
  success: boolean;
  message: string;
  data: ChargeBillExpenseListItem[];
  errors: Record<string, string[]> | null;
  meta: ChargeBillExpensesApiPaginationMeta | null;
}

// ============================================
// LOOKUPS (`GET /providers/options`, `GET /branches?provider_uuid=`,
// `GET /cultivations/options`) — flat/não-paginados (`meta:null`). DEC-FE-04
// (GAP-TT-01): params numéricos (`type:1`), NUNCA boolean cru.
// ============================================

export interface ChargeBillExpenseProviderOption {
  uuid: string;
  label: string;
}

export interface ChargeBillExpenseCultivationOption {
  uuid: string;
  label: string;
}

// EXCLUSIVO desta feature — adaptação local de `BranchOption{uuid,name}`
// (service compartilhado `listBranchesByProvider`) para o contrato
// `{uuid,label}` esperado por `SelectAsyncPaginate.service`.
export interface ChargeBillExpenseBranchOption {
  uuid: string;
  label: string;
}
