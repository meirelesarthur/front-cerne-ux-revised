// src/@types/v2/ChargeBillIncome/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Contas a Receber" (ChargeBillIncome — Operacional /
// Agricultura / Carregamento). TASK-CBI-FE-01 (fundação), esteira
// `97-Esteiras/059`. Mirror estrutural de `@types/v2/FechamentoSemana/index.d.ts`
// (CRUD flat, sem satélites aninhados além de `provider`/`cultivation`).
//
// Fonte: contrato de tela §2/§3 (`CORE_WORKSPACE/97-Esteiras/059/CONTRATOS/
// contrato-tela-charge-bill-incomes-frontend.md`) + contrato legado
// (`legacy-contract-charge-bill-incomes.md`). `uuid` sempre, `id` NUNCA
// aparece no envelope.
//
// DOMÍNIO PRÓPRIO — NÃO confundir com `Income` (Financeiro → Receber,
// `@types/v2/Incomes`, tabela `incomes`): `ChargeBillIncome` é a tabela
// `charge_bills` com `type='E'` (Carregamento), permissões `charge_income_*`,
// menu "Carregamento". Nomes/estruturas distintos de propósito (DEC-FE-02/
// contrato §"Leitura do dev").
//
// DEC-FE-02 (ratificado) — a escrita usa `provider_uuid`/`cultivation_uuid`
// (uuid), NUNCA `provider_id`/`cultivation_id` (o backend FE-05 resolve
// uuid→id internamente na Action, mirror `StoreChargeAction`). Os selects de
// `providers/options`/`cultivations/options` só devolvem `{uuid,label}`.
// -----------------------------------------------------------------------------

import { Option } from '@/@types/option';

// ============================================
// ENTIDADES ANINHADAS (satélites do `ChargeBillIncomeResource`)
// ============================================

export interface ChargeBillIncomeProviderRef {
  uuid: string;
  name: string;
}

export interface ChargeBillIncomeCultivationRef {
  uuid: string;
  name: string;
}

// ============================================
// RECURSO PRINCIPAL — LISTAGEM (`ChargeBillIncomeResource`, `index` eager-
// carrega `provider`/`cultivation` — contrato §4).
// ============================================

export interface ChargeBillIncomeListItem {
  uuid: string;
  code: string;
  dt_emission: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  number: string | null;
  amount: number;
  description: string;
  type: string;
  provider: ChargeBillIncomeProviderRef | null;
  cultivation: ChargeBillIncomeCultivationRef | null;
  created_at: string;
}

// ============================================
// RECURSO PRINCIPAL — DETALHE (`GET /charge-bill-incomes/{uuid}`, contrato
// §5 — 8 campos, mesmo shape da listagem, sem satélite adicional).
// ============================================

export type ChargeBillIncomeDetail = ChargeBillIncomeListItem;

// ============================================
// PAYLOAD DE ESCRITA (POST/PUT — contrato §3). `code`/`type`/`farm_id`/
// `branch_id` NUNCA são enviados pelo cliente (server-authoritative,
// DEC-FE-03/RN-01/RN-02 do contrato legado).
// ============================================

export interface ChargeBillIncomePayload {
  dt_emission: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  number?: string | null;
  amount: number;
  provider_uuid?: string | null;
  cultivation_uuid?: string | null;
  description: string;
}

// ============================================
// FORM (RHF, `CreateOrUpdateChargeBillIncome.tsx` — TASK-CBI-FE-03, FORA do
// escopo desta execução). Relações como `Option<string>|null` (guarda o
// `Option{label,value=uuid}` inteiro, extração do uuid cru pro payload só
// no submit — mirror `AccountForm.provider_uuid`). Declarado AQUI (fundação)
// para o FE-03 plugar sem tocar neste arquivo.
// ============================================

export interface ChargeBillIncomeForm {
  code: string; // readonly/view — DEC-FE-03 (placeholder no create)
  dt_emission: string; // ISO YYYY-MM-DD
  due_date: string; // ISO YYYY-MM-DD
  number: string;
  amount: number;
  provider_uuid: Option<string> | null;
  cultivation_uuid: Option<string> | null;
  description: string;
}

// ============================================
// ENVELOPE (ApiResponse::paginated) — a listagem devolve um array PLANO em
// `data` (mesma armadilha de `ChargesListEnvelope`/`ClosingWeeksListEnvelope`).
// ============================================

export interface ChargeBillIncomesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface ChargeBillIncomeEnvelope {
  success: boolean;
  message: string;
  data: ChargeBillIncomeListItem[];
  errors: Record<string, string[]> | null;
  meta: ChargeBillIncomesApiPaginationMeta | null;
}

// ============================================
// LOOKUPS (`GET /providers/options`, `GET /cultivations/options`) — flat/
// não-paginados (`meta:null`, DEC-FE-05). DEC-FE-04 (GAP-TT-01): params
// numéricos (`type:1`, `only_children:1`), NUNCA boolean cru.
// ============================================

export interface ChargeBillIncomeProviderOption {
  uuid: string;
  label: string;
}

export interface ChargeBillIncomeCultivationOption {
  uuid: string;
  label: string;
}
