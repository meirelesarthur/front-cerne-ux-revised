// src/services/v2/Relatorios/profitability-by-crop-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Rentabilidade/Cultura" (F-302, esteira
// CORE_WORKSPACE/97-Esteiras/077, F-302-plano-front.md) — mirror
// ESTRUTURAL de `sale-client-report-service.ts` (F-313)/
// `production-costing-area-report-service.ts` (F-298): 1 função de download
// síncrono, resposta BINÁRIA (SÓ PDF — SEM `report_type`/seletor de formato,
// diferente do irmão `sale-client-report-service.ts`), `responseType: 'blob'`
// obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/profitability-by-crop-report` — SEM envelope
// `{success,message,data,errors,meta}` (mesma exceção documentada em
// `sale-client-report-service.ts` para controllers de relatório binário).
//
// SEM `X-Farm-Id` explícito no payload — o client já injeta o header
// automaticamente (`get_spa_api_client_pattern §2`).
//
// `harvest` NUNCA aparece no payload — 100% client-side, o FormRequest da API
// aceita o campo mas nunca o usa para filtrar (F-302-plano-api.md §4, risco 3
// do plano de front). Nenhuma função de options — `listCultivationOptions`/
// `listActiveHarvests` são IMPORTADAS pela TELA, não reescritas aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { ProfitabilityByCropReportParams } from '@/@types/v2/Relatorios/profitability-by-crop-report';

async function downloadProfitabilityByCropReportPdf(
  params: ProfitabilityByCropReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/profitability-by-crop-report',
    {
      cultivation_uuid: params.cultivation_uuid,
      start_date: params.start_date,
      end_date: params.end_date,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadProfitabilityByCropReportPdf };
