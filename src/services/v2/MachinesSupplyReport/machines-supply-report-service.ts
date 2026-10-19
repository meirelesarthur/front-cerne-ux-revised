// src/services/v2/MachinesSupplyReport/machines-supply-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Abastecimentos" (F-277, esteira 97-Esteiras/054,
// TASK-054-277-FE-01). Mirror estrutural de
// `@/services/v2/MachinesReport/machines-report-service.ts` (F-278) — 1
// função de download síncrono, resposta BINÁRIA (PDF ou Excel conforme
// `format`), `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe o
// binário) — SOMADA a `getMachinesSupplyReportOptions`, NOVA nesta tela
// (D-FE-01, roteiro-front-F277-abastecimentos.md §3.2).
//
// ⚠️ 2 formatos DIFERENTES no MESMO service (`get_spa_api_client_pattern`):
//   - `getMachinesSupplyReportOptions` → envelope `ApiResponse` padrão
//     (`{success,message,data,errors,meta:null}`), desempacota `.data`
//     (NÃO `.data.data`, NÃO devolve o envelope cru).
//   - `downloadMachinesSupplyReport` → resposta BINÁRIA (`Blob`), o envelope
//     `ApiResponse` NÃO se aplica (mesma exceção documentada em
//     `MachinesReport`/`SaleProductReport`); erro 422/401/403 também chega
//     como `Blob` — o chamador usa `parseBlobError` no `catch`.
//
// Endpoint principal: `GET /api/v1/machines-supply-report`
// (`MachinesSupplyReportFilterData`, roteiro-api-F277-abastecimentos.md §2 —
// `CONTRATO_AUTOAPROVADO`, ainda não implementado — service escrito CONTRA O
// CONTRATO, mirror `equipment-service.ts`/`TASK-BE-704`; ajuste mecânico se o
// Resource real divergir).
//
// `X-Farm-Id` é automático (interceptor de `@/services/api.ts`), inclusive na
// chamada `.options()` — os 7 campos do endpoint principal são listados
// EXPLICITAMENTE (armadilha ERRO-FE-016: nunca descartar parâmetro em
// silêncio); string/array vazios viram `undefined`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  MachinesSupplyReportOptionsData,
  MachinesSupplyReportParams,
} from '@/@types/v2/MachinesSupplyReport';

async function getMachinesSupplyReportOptions(): Promise<MachinesSupplyReportOptionsData> {
  const { data } = await api.V2.get<Response<MachinesSupplyReportOptionsData>>(
    '/machines-supply-report/options'
  );
  return data.data;
}

async function downloadMachinesSupplyReport(params: MachinesSupplyReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/machines-supply-report',
    {
      equipment_ids: params.equipment_ids,
      farm_ids: params.farm_ids && params.farm_ids.length > 0 ? params.farm_ids : undefined,
      product_ids:
        params.product_ids && params.product_ids.length > 0 ? params.product_ids : undefined,
      warehouse_id: params.warehouse_id || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadMachinesSupplyReport, getMachinesSupplyReportOptions };
