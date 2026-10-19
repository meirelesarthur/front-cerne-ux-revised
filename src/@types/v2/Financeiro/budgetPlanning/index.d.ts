// src/@types/v2/Financeiro/budgetPlanning/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do bounded context "Prev. Orçamentária" (BudgetPlanning — F-106,
// esteira 97-Esteiras/067, TASK-PO-FE-01). Mirror estrutural de
// `@/@types/v2/FinancialFreeze` (mesmo formato de cabeçalho/organização).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /budget-plannings/template          → blob (XLS), SEM envelope.
//   POST   /budget-plannings/import             → 201/422, data: BudgetPlanningData.
//   GET    /budget-plannings/predicted-report   → blob (PDF/XLSX), SEM envelope.
//   GET    /budget-plannings                    → paginado, data: BudgetPlanningListData[].
//   POST   /budget-plannings                    → 201, data: BudgetPlanningData.
//   GET    /budget-plannings/{uuid}              → show (hidratação edit).
//   GET    /budget-plannings/{uuid}/export       → blob (XLS), SEM envelope.
//   PUT    /budget-plannings/{uuid}              → 200, data: BudgetPlanningData.
//   DELETE /budget-plannings/{uuid}              → hard delete (sem soft delete).
//
// ⚠️ PROIBIDO no payload de escrita: `code`, `farm_id`, `user_id`,
// `employee_id` — `BudgetPlanningRequest::rules()` (API real) não os
// declara; resolvidos sempre no servidor (regras #1/#2 do contrato legado).
//
// `categories.*.month` / `BudgetPlanningMonthValue.month` são 0-11
// (0=Janeiro..11=Dezembro) — confirmado em código real
// (`BudgetPlanningRequest::rules()` `between:0,11`,
// `BudgetPlanningResource.categories.*.months[].month`). NÃO usar o range
// 1-12 de `@/constants/options/months.ts` aqui — aquele arquivo é só rótulo
// de exibição (reuso na grade, TASK-PO-FE-07), a conversão de índice é
// responsabilidade de quem consumir os dois lados (fora do escopo desta
// Tarefa).
//
// Universo de "categorias elegíveis para a grade" — GAP-PO-08 RESOLVIDO
// (TASK-PO-FE-07): `GET /budget-plannings/eligible-categories` existe
// (`067/CONTRATOS/prev-orcamentaria-frontend-contrato-tela.md §0/§4`).
// `BudgetPlanningEligibleCategory` é consumido por
// `listEligibleBudgetPlanningCategories` (service) e
// `CreateOrUpdateBudgetPlanning.tsx`/`BudgetPlanningGrid.tsx`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// LEITURA (resposta da API)
// ============================================

export interface BudgetPlanningMonthValue {
  /** 0-11 (0=Janeiro..11=Dezembro) — mirror `between:0,11` do servidor. */
  month: number;
  amount: number;
}

export interface BudgetPlanningCategoryData {
  financial_category: { uuid: string; code: string; description: string };
  /** Regra #7 — sempre calculado no servidor, nunca gravado. */
  last_year_value: number;
  months: BudgetPlanningMonthValue[];
}

/** Detalhe (`GET /{uuid}` e resposta do `POST`/`PUT`). */
export interface BudgetPlanningData {
  uuid: string;
  code: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  year: number;
  /** `whenLoaded` — passivo, CL-14 do contrato legado, NÃO exibir. */
  employee?: { uuid: string; name: string } | null;
  /** `whenLoaded` — autor, display-only. */
  user?: { uuid: string; name: string } | null;
  /** `whenLoaded` — SÓ categorias com pivot existente (gap §0 do contrato de tela). */
  categories?: BudgetPlanningCategoryData[];
  /** ISO UTC. Ausente na resposta do `POST` (mirror `updated_at` de outros módulos). */
  updated_at?: string;
}

/** Linha da grid (`GET /budget-plannings`, `BudgetPlanningListResource` — enxuto). */
export interface BudgetPlanningListData {
  uuid: string;
  code: string;
  date: string;
  year: number;
  /** Já resolvido no servidor (`user.name ?? employee.people.name`). */
  responsavel: string | null;
  created_at: string;
}

// ============================================
// Universo de categorias elegíveis (BLOQUEADO — sem endpoint ainda, gap §0)
// ============================================

/**
 * Universo de categorias elegíveis para a grade mensal (ver contrato de tela
 * §0/§4 — GAP-PO-08 resolvido). Consumido por
 * `listEligibleBudgetPlanningCategories` (TASK-PO-FE-07).
 */
export interface BudgetPlanningEligibleCategory {
  uuid: string;
  code: string;
  description: string;
}

// ============================================
// REACT HOOK FORM — matriz FIXA (NÃO é useFieldArray de add/remove)
// ============================================

export interface BudgetPlanningGridCellForm {
  /** Vem da linha fixa (universo de categorias elegíveis), não de um Select. */
  financial_category_uuid: string;
  amount: number | null;
}

export interface BudgetPlanningGridRowForm {
  financial_category: { uuid: string; code: string; description: string };
  /** Display-only — nunca enviado ao servidor. */
  last_year_value: number;
  /** Sempre 12 posições, index = mês (0-11). */
  months: BudgetPlanningGridCellForm[];
}

export interface BudgetPlanningForm {
  date: Date | null;
  year: number | null;
  /** 1 linha por categoria elegível — NUNCA add/remove pelo usuário. */
  rows: BudgetPlanningGridRowForm[];
}

// ============================================
// FILTRO (FilterSide da listagem)
// ============================================

export interface BudgetPlanningFilterForm {
  year?: Option<number> | null;
}

/** Query params enviados na listagem (`Option<T>` → `T`, já em primitivos). */
export interface BudgetPlanningFilterRequest {
  year?: number;
  per_page?: number;
}

// ============================================
// PAYLOAD DE ESCRITA (create/update)
// ============================================

// ⚠️ PROIBIDO incluir aqui: `code`, `farm_id`, `user_id`, `employee_id` — a
// API (`BudgetPlanningRequest::rules()`) NÃO os aceita; resolvidos sempre no
// servidor.
export interface BudgetPlanningCategoryRequest {
  financial_category_uuid: string;
  /** 0-11 (0=Janeiro..11=Dezembro). */
  month: number;
  amount: number;
}

export interface CreateOrUpdateBudgetPlanningRequest {
  /** YYYY-MM-DD. */
  date: string;
  year: number;
  /** Só linhas com valor preenchido (regra #4) — `required|array|min:1` no servidor. */
  categories: BudgetPlanningCategoryRequest[];
}

// ============================================
// IMPORT
// ============================================

export interface ImportBudgetPlanningRequest {
  file: File;
  year: number;
}

// ============================================
// RELATÓRIO PREVISTO×REALIZADO
// ============================================

export type BudgetPlanningPredictedReportType = 'pdf' | 'xlsx';

export interface BudgetPlanningPredictedReportFilterForm {
  year: number | null;
  type: Option<BudgetPlanningPredictedReportType> | null;
  /**
   * Fazenda TENANT-SCOPED (rodada 3, esteira 065, item 1.a — REVERTE o
   * `GAP-PO-04`/"sem `farm_id`" registrado acima). Campo OPCIONAL — decisão
   * do dono (task-packet rodada 3): sem seleção, o relatório cai no fallback
   * `X-Farm-Id` do interceptor (mirror `farm_id` de
   * `Relatorios/Financeiro/MovimentoBancario/index.tsx`, também opcional).
   */
  farm: Option<string> | null;
}

export interface BudgetPlanningPredictedReportRequest {
  year: number;
  type: BudgetPlanningPredictedReportType;
  /** UUID da fazenda selecionada (tenant-scoped) — omitido quando não selecionada. */
  farm_uuid?: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /budget-plannings)
// ============================================

export interface BudgetPlanningsListEnvelope {
  success: boolean;
  message?: string;
  data: BudgetPlanningListData[];
  errors: Record<string, string[]> | null;
  meta?: {
    current_page: number;
    /** `last_page`, NÃO `total_pages` — mapear no adaptador do service. */
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}
