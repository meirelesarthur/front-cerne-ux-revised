// src/@types/v2/MachinesSupplyReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Abastecimentos" (F-277, esteira 97-Esteiras/054,
// TASK-054-277-FE-01). Mirror estrutural de `@/@types/v2/MachinesReport`
// (F-278, mesmo grupo de menu `rel-gfr`) — tela de filtro + download binário
// (PDF+Excel, `ReportFormat` REUSADO de `@/@types/v2/AccountsReports`), SEM
// grid/prévia.
//
// Diferença deliberada (D-FE-01, roteiro-front-F277-abastecimentos.md §3.2):
// `equipment_ids`/`farm_ids`/`warehouse_id` NÃO vêm de lookups remotos
// próprios — vêm de 1 ÚNICO bundle `GET /machines-supply-report/options`
// (`MachinesSupplyReportOptionsData`, envelope `ApiResponse` padrão, SEM
// `meta` de paginação — mirror de forma com
// `ManagementBatchReportController::options()`). Só `product_ids` usa lookup
// remoto/paginado próprio (`GET /products/options`, `ProductOption` já
// existente em `@/@types/v2/Products`).
//
// Contrato servidor (`MachinesSupplyReportFilterData`, roteiro API §2 —
// `CONTRATO_AUTOAPROVADO`, ainda não implementado — tipos escritos CONTRA O
// CONTRATO, mirror `equipment-service.ts`/`TASK-BE-704`; ajuste mecânico se o
// Resource real divergir):
//   equipment_ids[]  required, array, min:1 (uuid, farm ativa)
//   farm_ids[]       sometimes, array (uuid)
//   product_ids[]    sometimes, array (uuid)
//   warehouse_id     sometimes, nullable uuid
//   start_date / end_date   required, date; end_date >= start_date
//   format           nullable `pdf`|`xlsx` (default servidor `pdf`)
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

/** Item de catálogo do bundle `/machines-supply-report/options` — shape
 *  PREMISSADO (`uuid`+`description`) contra o contrato ainda não
 *  implementado; ajustar mecanicamente quando o Resource real publicar. */
export interface MachinesSupplyReportOptionItem {
  uuid: string;
  description: string;
}

/** Bundle ÚNICO devolvido por `GET /machines-supply-report/options` — os 3
 *  catálogos (machines/farms/warehouses) JÁ filtrados pelo servidor (família
 *  de equipamento, farm-scope, estoque de categoria), SEM paginação/busca
 *  server-side (D-FE-01). */
export interface MachinesSupplyReportOptionsData {
  machines: MachinesSupplyReportOptionItem[];
  farms: MachinesSupplyReportOptionItem[];
  warehouses: MachinesSupplyReportOptionItem[];
}

export interface MachinesSupplyReportFilterForm {
  equipment_ids: string[];
  farm_ids: string[];
  product_ids: string[];
  warehouse_id: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  format: Option<ReportFormat> | null;
}

export interface MachinesSupplyReportParams {
  equipment_ids: string[];
  farm_ids?: string[];
  product_ids?: string[];
  warehouse_id?: string;
  start_date: string;
  end_date: string;
  format: ReportFormat;
}
