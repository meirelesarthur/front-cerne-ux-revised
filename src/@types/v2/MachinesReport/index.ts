// src/@types/v2/MachinesReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Máquinas" (F-278, esteira 97-Esteiras/052,
// TASK-052-278-FE-01). Mirror estrutural de `@/@types/v2/StockProviderLotReport`
// — tela de filtro + download binário (PDF+Excel, DEC-225, `ReportFormat`
// REUSADO de `@/@types/v2/AccountsReports`), SEM grid/prévia.
//
// Contrato servidor (`MachinesReportRequest`, roteiro-arquitetura-F278-
// maquinas.md §2.3):
//   equipment_ids[]           required, array, min:1 (uuid, farm ativa)
//   farm_ids[]                sometimes, array (uuid)
//   start_date / end_date     required, date; end_date >= start_date
//   maintenance_type          nullable enum `employee`|`provider`
//   maintenance_executor_id   nullable uuid — cascata do lookup conforme
//                             `maintenance_type` (employee↔provider)
//   format                    nullable `pdf`|`xlsx` (default servidor `pdf`)
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

/** Enum `MaintenanceType` do backend (`App\Enums\Reports\MaintenanceType`). */
export type MaintenanceType = 'employee' | 'provider';

export interface MachinesReportFilterForm {
  equipment_ids: string[];
  farm_ids: string[];
  start_date: string | null;
  end_date: string | null;
  maintenance_type: Option<MaintenanceType> | null;
  maintenance_executor_id: Option<string> | null;
  format: Option<ReportFormat> | null;
}

export interface MachinesReportParams {
  equipment_ids: string[];
  farm_ids?: string[];
  start_date: string;
  end_date: string;
  maintenance_type?: MaintenanceType;
  maintenance_executor_id?: string;
  format: ReportFormat;
}
