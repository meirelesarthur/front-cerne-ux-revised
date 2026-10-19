// src/services/v2/WeighingInOutReport/weighing-in-out-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Pesagem Entrada/Saída" (F-336, esteira 97-Esteiras/058,
// FRONT-F336-plano.md §3/§4, TASK-058-F336-FE-01). Mirror estrutural de
// `transfer-cliente-report-service.ts`/`weighing-harvest-report-service.ts` —
// 1 função de download síncrono, resposta BINÁRIA (PDF ou Excel conforme
// `format`), `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe o
// binário).
//
// Endpoint: `GET /api/v1/weighing-in-out-report`
// (`WeighingInOutReportController`, permissão `weighing-in-out_report` JÁ
// SEEDED — plano §2.1). O FIX de VALOR do backend (C1 — "Peso Líquido" da
// Saída, `final_weight` em vez de `net_weight`) é 100% server-side; este
// service só baixa o binário já corrigido, sem recalcular nada.
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { WeighingInOutReportParams } from '@/@types/v2/WeighingInOutReport';

async function downloadWeighingInOutReport(params: WeighingInOutReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/weighing-in-out-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      product_uuid: params.product_uuid,
      client_uuid: params.client_uuid || undefined,
      warehouse_uuid: params.warehouse_uuid || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadWeighingInOutReport };
