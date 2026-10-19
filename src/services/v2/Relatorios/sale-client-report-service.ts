// src/services/v2/Relatorios/sale-client-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Cliente/Produto" (F-313, `SaleClientsReportController` legado /
// endpoint novo `sales-client-report`, esteira
// CORE_WORKSPACE/97-Esteiras/054) — mirror EXATO de
// `sale-product-report-service.ts` (F-315): 1 função de download síncrono,
// resposta BINÁRIA (PDF ou XLSX conforme `type`), `responseType: 'blob'`
// obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint confirmado por `roteiro-api-F313-cliente-produto.md §Endpoint`
// (`GET /api/v1/sales-client-report`) — SEM envelope
// `{success,message,data,errors,meta}` (mesma exceção documentada em
// `sale-product-report-service.ts` para controllers de relatório binário).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
//
// Nenhuma função de options — `listClientOptions`/`listProductOptions` são
// IMPORTADAS pela TELA, não reescritas aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { SaleClientReportParams } from '@/@types/v2/Relatorios/sale-client-report';

async function downloadSaleClientReport(params: SaleClientReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/sales-client-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      client_uuid: params.client_uuid || undefined,
      product_uuid: params.product_uuid || undefined,
      type: params.type,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadSaleClientReport };
