// src/@types/v2/MachinesMaintenanceReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Manutenções" (F-276, execução 97-Esteiras/078,
// TASK-F276-F01/F02). Twin direto `machines-supply-report` (F-277, grupo de
// menu `rel-gfr`) + F-312 (produto/armazém single).
//
// RECONCILIAÇÃO CONTRA A API VIVA (SEM MOCK — lida diretamente em
// `GB.Cerne.Api`, endpoint DELIVERED):
//   - R1 (param de formato): `MachinesMaintenanceReportRequest::rules()`
//     confirma `'format' => ['bail','nullable','string','in:pdf,xlsx']` —
//     NÃO é `report_type`. `MachinesMaintenanceReportFilterData::$format`
//     tem default `'pdf'`, mas o front SEMPRE envia o literal explícito (2
//     botões, nunca depende do default do servidor).
//   - R2 (cardinalidade de produto): a mesma Request confirma `'product_ids'
//     => ['bail','sometimes','array']` (array de uuid) — NÃO `product_id`
//     singular. A UI permanece SINGLE (fiel ao legado/task-packet,
//     `SelectAsyncPaginate` sem `isMulti`, mirror F-312); o WIRE serializa a
//     única seleção como array de 0..1 elemento (`product_ids: [value]`).
//   - R3 (shape do bundle `/machines-maintenance-report/options`): os 3
//     `Http/Resources/V1/*OptionResource` REAIS confirmam
//     `MachineOptionResource`={uuid,description},
//     `FarmOptionResource`={uuid,description},
//     `WarehouseOptionResource`={uuid,initials,description} — o array de
//     armazéns tem 1 campo A MAIS que o premissado no twin Abastecimentos
//     (`initials`), não usado na tela (só `description` vira label do
//     `Select`), mas tipado fielmente ao Resource real.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** Item de catálogo `machines`/`farms` do bundle — mirror
 *  `MachineOptionResource`/`FarmOptionResource` (uuid+description). */
export interface MachinesMaintenanceReportCatalogItem {
  uuid: string;
  description: string;
}

/** Item de catálogo `warehouses` do bundle — mirror `WarehouseOptionResource`
 *  (uuid+initials+description, R3). */
export interface MachinesMaintenanceReportWarehouseItem {
  uuid: string;
  initials: string;
  description: string;
}

/** Bundle ÚNICO devolvido por `GET /machines-maintenance-report/options`
 *  (envelope `ApiResponse` padrão, `{machines,farms,warehouses}` já
 *  farm-scoped pelo servidor, SEM paginação/busca server-side — mirror
 *  D-FE-01 Abastecimentos). */
export interface MachinesMaintenanceReportOptionsData {
  machines: MachinesMaintenanceReportCatalogItem[];
  farms: MachinesMaintenanceReportCatalogItem[];
  warehouses: MachinesMaintenanceReportWarehouseItem[];
}

/** Forma INTERNA do form (react-hook-form) — 6 campos: `equipment_ids`
 *  (ÚNICO obrigatório, min 1) + `farm_ids` (opcional, ambos
 *  `CheckboxListField` sobre o bundle ÚNICO) + `warehouse_id` (opcional,
 *  `Select` estático sobre o bundle) + `product_id` (opcional,
 *  `SelectAsyncPaginate` SINGLE, tenant-wide) + `start_date`/`end_date`
 *  (obrigatórios). */
export interface MachinesMaintenanceReportFormValues {
  equipment_ids: string[];
  farm_ids: string[];
  warehouse_id: Option<string> | null;
  product_id: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

/** `type→format` do legado (CLM/SFC-276-FILTERS) — literal `pdf`/`xlsx`
 *  (R1, mirror `MachinesSupplyReportFilterData`/twin). Dois botões no
 *  footer, cada um fixa o literal — NUNCA um Select "Tipo de Relatório" no
 *  front (FRONT-09, decisão já resolvida). */
export type MachinesMaintenanceReportFormat = 'pdf' | 'xlsx';

/** Payload REAL enviado ao servidor — `format` é sempre incluído pelos 2
 *  handlers de download (literal `pdf`/`xlsx`), nunca lido do form.
 *  `product_ids` é SEMPRE array no wire (R2), mesmo com UI single (0 ou 1
 *  elemento). A fronteira permitida entre `FormValues` e `Params` é
 *  `toMachinesMaintenanceReportParams()`
 *  (`machines-maintenance-report-service.ts`). */
export interface MachinesMaintenanceReportParams {
  equipment_ids: string[];
  farm_ids?: string[];
  warehouse_id?: string;
  product_ids?: string[];
  start_date: string;
  end_date: string;
  format: MachinesMaintenanceReportFormat;
}
