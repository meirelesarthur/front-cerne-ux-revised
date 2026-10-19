// src/services/v2/StockAbcReport/stock-abc-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Curva ABC/Estoque" (F-322, esteira 97-Esteiras/077). Mirror
// estrutural de `stock-provider-lot-report-service.ts` — 1 função de
// download síncrono, resposta BINÁRIA (PDF ou Excel conforme `report_type`),
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/stocks-abc-report` (start_date, end_date, report_type
// — enum 'pdf'|'excel', default 'pdf'). Envelope `{success,message,data,
// errors,meta}` NÃO se aplica (mesma exceção documentada para controllers de
// relatório binário).
//
// Chave do parâmetro na API é `report_type` — NUNCA 'type'/'format' (risco 2
// do plano front). SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai
// pelo header `X-Farm-Id` automático do client (`get_spa_api_client_pattern
// §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { StockAbcReportParams } from '@/@types/v2/StockAbcReport';

async function downloadStockAbcReport(params: StockAbcReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/stocks-abc-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      report_type: params.report_type, // chave EXATA do FormRequest da API
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadStockAbcReport };
