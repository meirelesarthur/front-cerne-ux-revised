// src/services/v2/MachinesReport/machines-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Máquinas" (F-278, esteira 97-Esteiras/052, TASK-052-278-FE-01).
// Mirror estrutural de `stock-provider-lot-report-service.ts` — 1 função de
// download síncrono, resposta BINÁRIA (PDF ou Excel conforme `format`),
// `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/machines-report` (`MachinesReportRequest`,
// roteiro-arquitetura-F278-maquinas.md §2.3). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica (mesma exceção
// documentada para controllers de relatório binário); erro 422/401/403
// chega como `Blob` também — o chamador usa `parseBlobError` no `catch`.
//
// `X-Farm-Id` é automático (interceptor de `@/services/api.ts`) — os 7
// campos são listados EXPLICITAMENTE (armadilha ERRO-FE-016: nunca
// descartar parâmetro em silêncio); string/array vazios viram `undefined`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { MachinesReportParams } from '@/@types/v2/MachinesReport';

async function downloadMachinesReport(params: MachinesReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/machines-report',
    {
      equipment_ids: params.equipment_ids,
      farm_ids: params.farm_ids && params.farm_ids.length > 0 ? params.farm_ids : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      maintenance_type: params.maintenance_type || undefined,
      maintenance_executor_id: params.maintenance_executor_id || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadMachinesReport };
