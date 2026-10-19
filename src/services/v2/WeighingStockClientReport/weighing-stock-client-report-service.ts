// src/services/v2/WeighingStockClientReport/weighing-stock-client-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Pesagem/Armazém/Cliente" (F-337, esteira 060, DEC-267,
// ROTEIRO-F337-FRONT.md §3.F). Mirror estrutural de
// `stock-abc-report-service.ts` — 1 função de download síncrono, resposta
// BINÁRIA (PDF ou Excel conforme `format`), `responseType: 'blob'`
// obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/weighing-stock-client-report` (`format` — enum
// 'pdf'|'xlsx', obrigatório, `WeighingStockClientReportRequest::rules()`).
// Envelope `{success,message,data,errors,meta}` NÃO se aplica (mesma exceção
// documentada para controllers de relatório binário,
// `get_laravel_response_exception_pattern` §5).
//
// `product`/`client`/`warehouse` são OPCIONAIS (DEC-267 — reativados nesta
// esteira 060) — enviados SOMENTE quando preenchidos (`undefined` é
// descartado pelo client, mirror `get_spa_api_client_pattern`); vazio =
// relatório completo (comportamento preservado). Chaves EXATAS do
// FormRequest: `product`/`client`/`warehouse`/`format` — NÃO `*_uuid` (essa
// é a chave do relatório irmão F-336, `weighing-in-out-report-service.ts`,
// NÃO copiar aqui). SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa
// vai pelo header `X-Farm-Id` automático do client
// (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { WeighingStockClientReportParams } from '@/@types/v2/WeighingStockClientReport';

async function downloadWeighingStockClientReport(
  params: WeighingStockClientReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/weighing-stock-client-report',
    {
      product: params.product, // uuid opcional — chave EXATA do FormRequest (NUNCA product_uuid)
      client: params.client, // uuid opcional — chave EXATA do FormRequest (NUNCA client_uuid)
      warehouse: params.warehouse, // uuid opcional — chave EXATA do FormRequest (NUNCA warehouse_uuid)
      format: params.format, // chave EXATA do FormRequest da API
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadWeighingStockClientReport };
