// src/services/v2/Relatorios/sale-product-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Vendas/Produto" (F-315, `SaleProductReportController`, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-315-FE-01) — mirror EXATO de
// `expense-report-service.ts` (`AccountsReports`) e `dre-report-service.ts`:
// 1 função de download síncrono, resposta BINÁRIA (PDF ou XLSX conforme
// `type`), `responseType: 'blob'` obrigatório (sem isso o axios corrompe o
// binário).
//
// Endpoint confirmado por leitura DIRETA de
// `GB.Cerne.Api/routes/api.php:3431-3432` (`Route::get('sales-product-report',
// SaleProductReportController::class)->name('sale-products.report')`) e do
// próprio Controller — SEM envelope `{success,message,data,errors,meta}`
// (mesma exceção documentada em `dre-report-service.ts`/
// `management-batch-report-service.ts` para controllers de relatório
// binário).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
//
// Nenhuma função de options — `listProductOptions` é IMPORTADA de
// `@/services/v2/Products/product-service.ts` pela TELA, não reescrita aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { SaleProductReportParams } from '@/@types/v2/Relatorios/sale-product-report';

async function downloadSaleProductReport(params: SaleProductReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/sales-product-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      product_uuid: params.product_uuid || undefined,
      type: params.type,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadSaleProductReport };
