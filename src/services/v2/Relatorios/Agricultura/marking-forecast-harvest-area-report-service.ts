// src/services/v2/Relatorios/Agricultura/marking-forecast-harvest-area-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Previsão Colheita/Área" (F-282, esteira 059,
// `CONTRATO-F282-previsao-colheita-area.md` §5). Endpoints confirmados por
// leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/MarkingForecastHarvestAreaReportController.php`
// e `routes/api.php:4619-4622`:
//   - `GET /api/v1/markings/forecast-harvest-area-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.production_cycles`/
//     `data.areas`/`data.cultivations` (mirror
//     `production-costing-area-report-service.ts::getProductionCostingAreaReportOptions`,
//     combinado num único payload — sem paginação/busca no servidor).
//   - `GET /api/v1/markings/forecast-harvest-area-report` — PDF binário, SEM
//     envelope (`GbCerneSnappyReport::inline`, mesma exceção documentada em
//     `marking-forecast-area-report-service.ts`/`dre-report-service.ts`),
//     `responseType:'blob'` obrigatório (sem isso o axios corrompe o binário).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`). Permissão dupla
// barreira no servidor (`permission:markings_prev_farm_view` +
// `authorize()`), reaproveitando o MESMO slug já usado por F-281
// (`PrevisaoFazendaReceita`) — nenhuma ação de front aqui além de consumir o
// endpoint (a rota da SPA é gateada em `router/index.tsx`, ver BLOCO DE
// FIAÇÃO).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  MarkingForecastHarvestAreaReportOptionsData,
  MarkingForecastHarvestAreaReportParams,
} from '@/@types/v2/Relatorios/Agricultura/markingForecastHarvestAreaReport';

interface MarkingForecastHarvestAreaReportOptionsResponse {
  production_cycles: MarkingForecastHarvestAreaReportOptionsData['productionCycles'];
  areas: MarkingForecastHarvestAreaReportOptionsData['areas'];
  cultivations: MarkingForecastHarvestAreaReportOptionsData['cultivations'];
}

async function getMarkingForecastHarvestAreaReportOptions(): Promise<MarkingForecastHarvestAreaReportOptionsData> {
  const { data } = await api.V2.get<Response<MarkingForecastHarvestAreaReportOptionsResponse>>(
    '/markings/forecast-harvest-area-report/options'
  );
  return {
    productionCycles: data.data.production_cycles,
    areas: data.data.areas,
    cultivations: data.data.cultivations,
  };
}

async function downloadMarkingForecastHarvestAreaReportPdf(
  params: MarkingForecastHarvestAreaReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/markings/forecast-harvest-area-report',
    {
      areas: params.areas?.length ? params.areas : undefined,
      cultivation: params.cultivation || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      forecast: params.forecast ?? undefined,
      week: params.week ?? undefined,
      year: params.year ?? undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadMarkingForecastHarvestAreaReportPdf, getMarkingForecastHarvestAreaReportOptions };
