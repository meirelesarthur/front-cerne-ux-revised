// src/@types/v2/PaymentCashflowReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Fluxo Mensal de Pagamento" (`payment-cashflow.report`,
// F-293, execução 97-Esteiras/078, TASK-F293-F01). Endpoint DELIVERED (FLAT,
// NÃO `/reports/...`): `GET /payment-cashflow-report` — params confirmados em
// `PaymentCashflowReportRequest` (leitura direta da API viva, SEM MOCK):
// `start_date`/`end_date` (required, `after_or_equal:start_date`), `accounts[]`
// (uuid[]), `proprietary` (uuid, NÃO `proprietary_id`), `center_id` (uuid),
// `categories[]` (uuid[]), `farm_id` (uuid), `report_type` (`pdf`|`excel`,
// NUNCA `type`).
//
// Options DEDICADO (FRONT-07, mirror F-311/F-276): `GET
// /payment-cashflow-report/options` devolve as 5 listas NUM ÚNICO fetch —
// shape EXATO de `ListPaymentCashflowReportOptionsAction`. NUNCA os lookups
// genéricos `/accounts/options`/`/cost-centers/options`/`/proprietaries/options`/
// `/farms/options`.
//
// `PaymentCashflowReportFormValues` (forma do form) ≠
// `PaymentCashflowReportParams` (payload real) — a fronteira permitida entre
// os dois é `toPaymentCashflowReportParams()`
// (`payment-cashflow-report-service.ts`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Forma INTERNA do form (react-hook-form) — 7 campos: 2 multiselects
 *  (`accounts`/`categories`, `CheckboxListField`) + 3 selects opcionais
 *  (`proprietary`/`center_id`/`farm_id`) + 2 datas OBRIGATÓRIAS
 *  (`start_date`/`end_date`). */
export interface PaymentCashflowReportFormValues {
  accounts: string[];
  categories: string[];
  proprietary: Option<string> | null;
  center_id: Option<string> | null;
  farm_id: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL enviado ao servidor — `report_type` é sempre incluído pelos
 *  2 handlers de download (literal `pdf`/`excel`), nunca lido do form. Nomes
 *  EXATOS de `PaymentCashflowReportRequest`: `proprietary` (NÃO
 *  `proprietary_id`), `center_id`, `farm_id`, `accounts`, `categories`,
 *  `report_type` (NUNCA `type`). */
export interface PaymentCashflowReportParams {
  start_date: string;
  end_date: string;
  accounts?: string[];
  proprietary?: string;
  center_id?: string;
  categories?: string[];
  farm_id?: string;
  report_type: PaymentCashflowReportType;
}

/** `type→report_type` do legado — literal `pdf`/`excel`, mirror
 *  `RequestQuotationReportType`. Dois botões no footer, cada um fixa o
 *  literal — NUNCA um Select "Tipo de Relatório" no front (FRONT-10, decisão
 *  já resolvida, DEC-049). */
export type PaymentCashflowReportType = 'pdf' | 'excel';

/** Item de conta devolvido pelo fetch dedicado de options
 *  (`GET /payment-cashflow-report/options`) — label já vem "code -
 *  description" do backend. */
export interface PaymentCashflowReportAccountOption {
  uuid: string;
  label: string;
}

/** Item de proprietário devolvido pelo fetch dedicado de options. */
export interface PaymentCashflowReportProprietaryOption {
  uuid: string;
  name: string;
}

/** Item de centro de custo devolvido pelo fetch dedicado de options —
 *  escopado pela fazenda ATIVA (DEFECT-02, X-Farm-Id), NÃO pelo `farm_id`
 *  do filtro. */
export interface PaymentCashflowReportCostCenterOption {
  uuid: string;
  description: string;
}

/** Item de categoria financeira devolvido pelo fetch dedicado de options —
 *  label já vem "code - description" do backend. */
export interface PaymentCashflowReportFinancialCategoryOption {
  uuid: string;
  label: string;
}

/** Item de fazenda devolvido pelo fetch dedicado de options. */
export interface PaymentCashflowReportFarmOption {
  uuid: string;
  description: string;
}

/** Envelope de dados do fetch dedicado (FRONT-07) — UM ÚNICO `useQuery`
 *  popula os 5 campos (`accountItems`/`categoryItems`/`proprietaryOptions`/
 *  `costCenterOptions`/`farmOptions`, todos via `useMemo`). Shape EXATO de
 *  `ListPaymentCashflowReportOptionsAction`. NUNCA os endpoints genéricos. */
export interface PaymentCashflowReportOptions {
  accounts: PaymentCashflowReportAccountOption[];
  proprietaries: PaymentCashflowReportProprietaryOption[];
  cost_centers: PaymentCashflowReportCostCenterOption[];
  financial_categories: PaymentCashflowReportFinancialCategoryOption[];
  farms: PaymentCashflowReportFarmOption[];
}
