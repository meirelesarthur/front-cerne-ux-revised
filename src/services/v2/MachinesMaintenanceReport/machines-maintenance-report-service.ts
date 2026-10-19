// src/services/v2/MachinesMaintenanceReport/machines-maintenance-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Manutenções" (F-276, execução 97-Esteiras/078, TASK-F276-F02).
// Mirror estrutural de `machines-supply-report-service.ts` (twin F-277,
// bundle `/options` dedicado) + `requisitions-report-service.ts` (F-312,
// `toQuery` como WHITELIST EXPLÍCITA, 2 downloads binários síncronos sobre a
// MESMA rota, `toMachinesMaintenanceReportParams()` como fronteira
// obrigatória valores→payload).
//
// RECONCILIAÇÃO CONTRA A API VIVA (lida em `GB.Cerne.Api`, endpoint
// DELIVERED — `MachinesMaintenanceReportRequest`/`MachinesMaintenanceReportController`):
//   - R1: param de formato = `format` (`in:pdf,xlsx`), NÃO `report_type`.
//   - R2: produto = `product_ids` ARRAY de uuid (`sometimes|array`), NÃO
//     `product_id` singular — UI permanece SINGLE (fiel ao legado/F-312), o
//     wire serializa a seleção única como array de 0..1 elemento.
//   - R3: bundle `/machines-maintenance-report/options` retorna
//     `{machines,farms,warehouses}`, envelope `ApiResponse` padrão
//     (desempacota `.data`, NÃO `.data.data`).
//
// Path FLAT `/machines-maintenance-report` (NÃO `/reports/...`). Nome do
// arquivo Excel FIXO: `relatorio_manutencoes.xlsx` (CLM-07 — corrige o
// resíduo copy-paste `relatorio_abastecimentos` do legado).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  MachinesMaintenanceReportFormValues,
  MachinesMaintenanceReportFormat,
  MachinesMaintenanceReportOptionsData,
  MachinesMaintenanceReportParams,
} from '@/@types/v2/MachinesMaintenanceReport';

function toMachinesMaintenanceReportParams(
  values: MachinesMaintenanceReportFormValues,
  format: MachinesMaintenanceReportFormat
): MachinesMaintenanceReportParams {
  return {
    equipment_ids: values.equipment_ids,
    farm_ids: values.farm_ids.length > 0 ? values.farm_ids : undefined,
    warehouse_id: values.warehouse_id?.value || undefined,
    // R2 — wire SEMPRE array (`product_ids`), mesmo com UI single: 0
    // elemento quando limpo, 1 quando selecionado. NUNCA `product_id`
    // escalar (o FormRequest DELIVERED não aceita essa chave).
    product_ids: values.product_id?.value ? [values.product_id.value] : undefined,
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    format,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor, e que
// `farm_ids`/`warehouse_id`/`product_ids` vazios não cheguem à querystring
// como `''`/`[]`.
function toQuery(params: MachinesMaintenanceReportParams) {
  return {
    equipment_ids: params.equipment_ids,
    farm_ids: params.farm_ids && params.farm_ids.length > 0 ? params.farm_ids : undefined,
    warehouse_id: params.warehouse_id || undefined,
    product_ids:
      params.product_ids && params.product_ids.length > 0 ? params.product_ids : undefined,
    start_date: params.start_date,
    end_date: params.end_date,
    format: params.format,
  };
}

async function listMachinesMaintenanceReportOptions(): Promise<MachinesMaintenanceReportOptionsData> {
  const { data } = await api.V2.get<Response<MachinesMaintenanceReportOptionsData>>(
    '/machines-maintenance-report/options'
  );
  return data.data;
}

async function downloadMachinesMaintenanceReportPdf(
  params: MachinesMaintenanceReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/machines-maintenance-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadMachinesMaintenanceReportExcel(
  params: MachinesMaintenanceReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/machines-maintenance-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export {
  downloadMachinesMaintenanceReportExcel,
  downloadMachinesMaintenanceReportPdf,
  listMachinesMaintenanceReportOptions,
  toMachinesMaintenanceReportParams,
};
