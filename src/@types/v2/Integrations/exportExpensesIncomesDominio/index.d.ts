// src/@types/v2/Integrations/exportExpensesIncomesDominio/index.d.ts
// Tipos da tela STANDALONE "Exportação Domínio — Contas a Pagar/Receber"
// (F-118, Integrações, irmã do canário F-119 ExportNfseDominio). NÃO é
// CRUD — só o form de filtro (11 campos) e o request de export enviado à
// API. `DateInput` opera com string ISO `yyyy-MM-dd` (nunca `Date`); os 6
// selects trabalham com `Option<T>`/`Option<T>[]` (fábrica
// `(languageGB)=>Map` para os 2 estáticos; `SelectAsyncPaginate` para os 4
// async), NUNCA uuid/número cru no form — a extração `.value` acontece no
// service (contrato de tela §3, RISCO 1).

import type { Option } from '@/@types/option';

/** Form (React Hook Form) — todos os campos são `Option`/`Option[]`/ISO
 *  string, exceto `type` que é o único obrigatório. */
export interface ExportExpensesIncomesDominioForm {
  /** "Fazenda" — narrows dentro do tenant ativo (`X-Farm-Id`). */
  farm: Option<string> | null;
  /** "Dt. Emissão Início" — 'yyyy-MM-dd'. */
  start_date: string | null;
  /** "Dt. Emissão Fim" — 'yyyy-MM-dd'. */
  end_date: string | null;
  /** "Dt. Venc. Início" — 'yyyy-MM-dd'. */
  start_due_date: string | null;
  /** "Dt. Venc. Fim" — 'yyyy-MM-dd'. */
  end_due_date: string | null;
  /** "Proprietário Gestor". */
  proprietary_id: Option<string> | null;
  /** "Status" — 1..8, fiel a `Expense::opStatus`. */
  status: Option<number> | null;
  /** "Centro de Custo". */
  center_id: Option<string> | null;
  /** "Tipo Dados" — 1=Pagar/Expense, 2=Receber/Income. ÚNICO obrigatório. */
  type: Option<number> | null;
  /** "Categorias" — multiselect. */
  categories: Option<string>[] | null;
}

/**
 * Query params enviados à API
 * (`GET /integrations/exports/expenses-incomes-dominio`). Unwrapped (sem
 * `null`/`Option` — só chega aqui após a extração `.value` do service,
 * TASK-CPR-FE-03). SEM `farm_id` no payload — a fazenda ATIVA vai via
 * header `X-Farm-Id`, injetado pelo interceptor do `api.V2`; `farm_uuid`
 * é o filtro OPCIONAL de narrowing dentro do tenant (contrato de tela
 * §2.1/§3).
 */
export interface ExportExpensesIncomesDominioExportRequest {
  farm_uuid?: string;
  start_date?: string;
  end_date?: string;
  start_due_date?: string;
  end_due_date?: string;
  proprietary_uuid?: string;
  status?: number;
  center_uuid?: string;
  /** Único campo sempre presente (obrigatório no form/schema). */
  type: number;
  category_uuids?: string[];
}
