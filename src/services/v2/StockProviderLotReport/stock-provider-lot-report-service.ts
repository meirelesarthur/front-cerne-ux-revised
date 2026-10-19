// src/services/v2/StockProviderLotReport/stock-provider-lot-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Lote/Fornecedor" (F-324, esteira 97-Esteiras/052,
// TASK-052-324-FE-01). Mirror estrutural de
// `birth-animal-sisbov-report-service.ts` — 1 função de download síncrono,
// resposta BINÁRIA (PDF ou Excel conforme `format`), `responseType: 'blob'`
// obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/stocks-lot-provider-report`
// (`StockProviderLotReportRequest`, roteiro-arquitetura-F324-lote-
// fornecedor.md). Envelope `{success,message,data,errors,meta}` NÃO se
// aplica (mesma exceção documentada para controllers de relatório binário).
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`);
// `provider_uuid` é validado server-side via pivot tenant-scoped
// (`provider_tenant`), não via fazenda ativa.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { StockProviderLotReportParams } from '@/@types/v2/StockProviderLotReport';

async function downloadStockProviderLotReport(params: StockProviderLotReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/stocks-lot-provider-report',
    {
      provider_uuid: params.provider_uuid,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadStockProviderLotReport };
