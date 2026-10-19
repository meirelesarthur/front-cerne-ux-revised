// src/services/v2/MarkingsFarmForecastReport/markings-farm-forecast-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Previsão Fazenda/Receita" (F-281, execução 055, roteiro-front-
// F281-prev-fazenda-receita.md §4/§6-TASK-01). Mirror estrutural de
// `weighing-harvest-report-service.ts` — 1 função de download síncrono,
// resposta BINÁRIA, `responseType: 'blob'` obrigatório (sem isso o axios
// corrompe o binário).
//
// Endpoint: `GET /api/v1/markings/forecast-farm-report`
// (`MarkingForecastFarmReportController`, branch `feature/055-relatorios`).
// SÓ PDF — SEM parâmetro `format` (divergência declarada do molde SPA,
// FID-G3F CL-031/RN-19; fidelidade ao legado, RN-19). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica ao sucesso (mesma
// exceção documentada para controllers de relatório binário) — erros
// chegam como Blob e são desempacotados por `parseBlobError` na tela.
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { MarkingsFarmForecastReportParams } from '@/@types/v2/MarkingsFarmForecastReport';

async function downloadMarkingsFarmForecastReport(
  params: MarkingsFarmForecastReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/markings/forecast-farm-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      cultivation: params.cultivation || undefined,
      forecast: params.forecast ?? undefined,
      week: params.week ?? undefined,
      year: params.year ?? undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadMarkingsFarmForecastReport };
