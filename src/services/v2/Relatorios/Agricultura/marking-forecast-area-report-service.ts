// src/services/v2/Relatorios/Agricultura/marking-forecast-area-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Prev. Área/Receita" (F-280, TASK-MFA-FE-01, esteira 075). Mirror
// ESTRUTURAL de `stock-movement-report-service.ts` (`toQuery` + download
// único), SEM variante Excel — o legado nunca teve (contrato de tela §4 /
// contrato API §6).
//
// Endpoint (contrato de tela §3 / contrato API §9):
//   GET /markings/forecast-area-report (PDF, `responseType: 'blob'`)
//
// Envelope `{success,message,data,errors,meta}` NÃO se aplica ao binário —
// mesma exceção documentada de `stock-movement-report-service.ts`.
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`).
//
// `getAreasOptions()` — mirror EXATO `getAreasOptions()` de
// `rainfall-service.ts:121-124`/`harvestProduct-service.ts:151-154` (reusa o
// endpoint genérico já existente `GET /areas/options`, `is_enabled=true`
// forçado pelo servidor) — NÃO reimplementado como service novo de lookup,
// mesma assinatura/shape (convenção do projeto: cópia local mínima por
// módulo consumidor, sem import cruzado entre módulos de relatório).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type {
  MarkingForecastAreaFlatOptionsEnvelope,
  MarkingForecastAreaOptionItem,
  MarkingForecastAreaReportParams,
} from '@/@types/v2/Relatorios/Agricultura/markingForecastAreaReport';

function toQuery(params: MarkingForecastAreaReportParams) {
  return {
    areas: params.areas?.length ? params.areas : undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    variety_id: params.variety_id || undefined,
    order: params.order || undefined,
    week: params.week || undefined,
    year: params.year || undefined,
  };
}

async function downloadMarkingForecastAreaReportPdf(
  params: MarkingForecastAreaReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/markings/forecast-area-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function getAreasOptions(): Promise<MarkingForecastAreaOptionItem[]> {
  const { data } =
    await api.V2.get<MarkingForecastAreaFlatOptionsEnvelope<MarkingForecastAreaOptionItem>>(
      '/areas/options'
    );
  return data.data;
}

export { downloadMarkingForecastAreaReportPdf, getAreasOptions };
