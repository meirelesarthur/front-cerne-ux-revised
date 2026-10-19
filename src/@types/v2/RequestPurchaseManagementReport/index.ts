// src/@types/v2/RequestPurchaseManagementReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Gerencial de Solicitações" (F-310, esteira
// 97-Esteiras/053, TASK-053-F310-FE-01). Contrato de tela SELADO —
// `97-Esteiras/053/ROTEIROS/roteiro-front-F310-gerencial-solicitacoes.md`
// §4/§5.1 — mirror ESTRUTURAL de `@/@types/v2/AccountsPayableReceivableReport`
// (pasta dedicada por feature) para os TIPOS + `management-batch-report`
// (`@/@types/v2/Relatorios/management-batch-report`) para o formato do
// `/options` combinado (farms+types+statuses, 1 `useQuery`).
//
// Campos EXATOS de `RequestPurchaseManagementReportRequest` (confirmado por
// leitura direta do controller/request na branch `feature/053-relatorios`,
// commit `46c5021a6`):
//   start_date    required date
//   end_date      required date (>= start_date)
//   farm_id       opcional uuid
//   type_request  opcional string (RequestPurchaseType, backed enum)
//   status        opcional int (RequestPurchaseStatus, backed enum)
//
// Tela DOWNLOAD-ONLY — 2 rotas dedicadas (PDF/Excel), SEM campo "formato"
// (mirror `CentroCusto`/`ManagementBatchReport`: 2 endpoints = 2 botões, não
// 1 select condicional).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `ListRequestPurchaseManagementReportOptionsAction::handle()` — fazendas
 *  ATIVAS do tenant corrente, `{uuid,description}` (NÃO a listagem
 *  CRUD-gateada `GET /farms`, mirror decisão do roteiro §"Leitura do dev"
 *  risco #3). */
export interface RequestPurchaseManagementReportFarmOption {
  uuid: string;
  description: string;
}

/** `{value,label}` já prontos do servidor — mesma forma de `Option`, direto
 *  de `RequestPurchaseType::label()`/`RequestPurchaseStatus::label()` (mesma
 *  fonte que alimenta a coluna "Tipo"/"Status" do PDF — paridade 1:1 de
 *  rótulo). */
export interface RequestPurchaseManagementReportOptionsData {
  farms: RequestPurchaseManagementReportFarmOption[];
  types: Option<string>[];
  statuses: Option<number>[];
}

/** Forma INTERNA do form (react-hook-form/react-select) — `buildParams` na
 *  página achata para `RequestPurchaseManagementReportParams` antes de
 *  chamar o service (mirror `ContasAPagar`/`CentroCusto`). */
export interface RequestPurchaseManagementReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  farm_id: Option<string> | null;
  type_request: Option<string> | null;
  status: Option<number> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 *  `RequestPurchaseManagementReportRequest::rules()`. */
export interface RequestPurchaseManagementReportParams {
  start_date: string;
  end_date: string;
  farm_id?: string;
  type_request?: string;
  status?: number;
}
