// src/@types/v2/Relatorios/request-quotation-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Orçamentos" (`request-quotation.report`,
// F-311, execução 97-Esteiras/078, TASK-F311-F01). Endpoint DELIVERED (FLAT,
// NÃO `/reports/...`): `GET /request-quotation-report` — params
// `start_date,end_date,provider_id?,farm_id?,report_type(pdf|excel)`. Mirror
// ESTRUTURAL de `@/@types/v2/Relatorios/products-exit-cost-center.ts` — 4
// campos de filtro (2 obrigatórios + 2 opcionais), SEM campo decorativo.
//
// Diferença central (FRONT-06): os 2 selects opcionais (`provider_id`/
// `farm_id`) são alimentados por UM ÚNICO endpoint dedicado
// `GET /request-quotation-report/options` → `{ providers, farms }` — NUNCA
// os genéricos `/providers/options`/`/farms/options`.
//
// `RequestQuotationReportFormValues` (forma do form) ≠
// `RequestQuotationReportParams` (payload real) — a fronteira permitida entre
// os dois é `toRequestQuotationReportParams()`
// (`request-quotation-report-service.ts`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Forma INTERNA do form (react-hook-form) — 4 campos: 2 obrigatórios
 *  (`start_date`/`end_date`) + 2 opcionais (`provider_id`/`farm_id`). */
export interface RequestQuotationReportFormValues {
  start_date: string | null;
  end_date: string | null;
  provider_id: Option<string> | null;
  farm_id: Option<string> | null;
}

/** Payload REAL enviado ao servidor — `report_type` é sempre incluído pelos
 *  2 handlers de download (literal `pdf`/`excel`), nunca lido do form. */
export interface RequestQuotationReportParams {
  start_date: string;
  end_date: string;
  provider_id?: string;
  farm_id?: string;
  report_type: RequestQuotationReportType;
}

/** `type→report_type` do legado — literal `pdf`/`excel`, mirror
 *  `ProductsExitCostCenterReportType`. Dois botões no footer, cada um fixa o
 *  literal — NUNCA um Select "Tipo de Relatório" no front (FRONT-07, decisão
 *  já resolvida). */
export type RequestQuotationReportType = 'pdf' | 'excel';

/** Item de fornecedor devolvido pelo fetch dedicado de options
 *  (`GET /request-quotation-report/options`). */
export interface RequestQuotationReportProviderOption {
  uuid: string;
  name: string;
}

/** Item de fazenda devolvido pelo fetch dedicado de options
 *  (`GET /request-quotation-report/options`). */
export interface RequestQuotationReportFarmOption {
  uuid: string;
  description: string;
}

/** Envelope de dados do fetch dedicado (FRONT-06) — UM ÚNICO `useQuery`
 *  popula os 2 selects (`providerOptions`/`farmOptions`, ambos via
 *  `useMemo`). NUNCA `/providers/options`/`/farms/options` genéricos. */
export interface RequestQuotationReportOptions {
  providers: RequestQuotationReportProviderOption[];
  farms: RequestQuotationReportFarmOption[];
}
