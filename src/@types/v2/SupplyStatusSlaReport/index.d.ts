// src/@types/v2/SupplyStatusSlaReport/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do Relatório SLA (SupplyStatusSlaReport — Administrativo / Suprimentos,
// TASK-SLA-FE-01, esteira 97-Esteiras/037). Módulo NOVO e ISOLADO — não
// estende `RequestPurchases` (o relatório não expõe entidade própria, só
// recebe filtros e devolve um binário `.xlsx`).
//
// Espelha `RequestPurchaseSlaReportRequest::rules()`/
// `RequestPurchaseSlaReportFilterData` (API, confirmado por leitura direta):
// `uuid`/`start_date`/`end_date`/`status`, todos `sometimes` — dois gatilhos
// ALTERNATIVOS (`uuid` OU par `start_date`+`end_date`), `status` sempre
// opcional independente do gatilho escolhido.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Forma INTERNA do form (React Hook Form) — relacionais como `Option<T>`,
 *  nunca o valor cru (mirror `FilterSideInvoice.tsx`/demais filtros do projeto). */
export interface SupplyStatusSlaReportFilterForm {
  /** Gatilho 1 — uma solicitação específica (via botão "Relatório SLA" da
   *  listagem de Rejeitados/Cancelados, TASK-RC-FE-01). */
  uuid?: Option<string> | null;
  /** Gatilho 2 — junto com `end_date` (formulário manual de filtro). */
  start_date?: string | null;
  end_date?: string | null;
  /** Opcional, filtra independente do gatilho escolhido (`statusOptions`
   *  genérico já existente, `requestPurchaseStatusOptions`, 1..11). */
  status?: Option<number> | null;
}

/** Forma CRUA enviada como querystring da API (`GET /request-purchases/sla-report`). */
export interface SupplyStatusSlaReportFilterRequest {
  uuid?: string;
  start_date?: string;
  end_date?: string;
  status?: number;
}
