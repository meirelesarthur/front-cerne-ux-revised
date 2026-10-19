// src/services/v2/StockConsolidatedReport/stock-consolidated-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Estoque Consolidado" (F-323, feature_id e70b8cad, esteira
// 97-Esteiras/079). Mirror estrutural de `stock-abc-report-service.ts` — 1
// função de download síncrono, resposta BINÁRIA (PDF ou Excel conforme
// `report_type`), `responseType: 'blob'` obrigatório.
//
// Endpoint: `GET /api/v1/stocks-consolidated-report` (chaves EXATAS
// confirmadas por leitura direta de `StockConsolidatedReportRequest::rules()`
// no api_root — `warehouse_uuids[]`, `group_uuid`, `category_uuid`,
// `kind_uuid`, `search`, `product_uuid`, `date`, `report_type`). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica (mesma exceção
// documentada para controllers de relatório binário).
//
// `warehouse_uuids` vai como array — mesmo mecanismo já usado por
// `product_uuids`/`group_uuid[]` noutros services deste projeto (o wrapper
// `api.V2.get` serializa arrays nativamente, sem `JSON.stringify` manual).
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { StockConsolidatedReportParams } from '@/@types/v2/StockConsolidatedReport';

async function downloadStockConsolidatedReport(
  params: StockConsolidatedReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/stocks-consolidated-report',
    {
      warehouse_uuids: params.warehouse_uuids,
      group_uuid: params.group_uuid || undefined,
      category_uuid: params.category_uuid || undefined,
      kind_uuid: params.kind_uuid || undefined,
      search: params.search || undefined,
      product_uuid: params.product_uuid || undefined,
      date: params.date || undefined,
      report_type: params.report_type, // chave EXATA do FormRequest da API
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadStockConsolidatedReport };
