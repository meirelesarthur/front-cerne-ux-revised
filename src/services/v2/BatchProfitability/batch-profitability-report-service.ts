// src/services/v2/BatchProfitability/batch-profitability-report-service.ts
// -----------------------------------------------------------------------------
// Batch Profitability Report Service — API v1 do backend Laravel GB.Cerne
// (F-234, TASK-FE-PA-01, contrato-api-performance-animal.md §4). Endpoint FLAT
// (`GET /batch-profitability-report`, SEM `RequirePermission` no servidor —
// `DEC-DOM-19`, mirror `EvolutionReportController`/`GAP-EVO-01`) — mirror
// ESTRUTURAL 1:1 de `pregnant-cows-report-service.ts`.
//
// `type` decide o FORMATO da mesma resposta binária (0=PDF inline, 1=Excel
// download) — não filtra dado (mirror CL16/`BatchProfitabilityReportController`,
// `(int) $filters->type === 1 → Excel; qualquer outro valor (incl. ausente) →
// PDF inline`). Fora do envelope `ApiResponse`, retorno cru de `Blob`.
//
// Lookup de venda (`sale_id`, risco 2 da Tarefa 57) — `GET /movement-sales/
// options` dedicado NÃO existe (`GAP-VD-02`, `search`/`client_id`/
// `start_date`/`end_date` são aceitos e ignorados pelo DTO real, e NÃO há
// filtro de `status` no `MovementSaleFilterData`). Solução default (decisão
// já tomada na Tarefa, não é Gap novo): `listBillableMovementSaleOptions`
// envolve `listMovementSales` (mirror `MovementSales/movement-sale-service.ts`)
// filtrando `status === 'F'` (Finalizada/faturada) NO CLIENTE — o campo de
// busca do combobox fica presente mas sem efeito real até `GAP-VD-02` ser
// corrigido no backend (herança, não regressão desta tela). Deliberadamente
// declarado NESTE service novo (não estendido em `movement-sale-service.ts`),
// mesma decisão de isolamento já tomada em `pregnant-cows-report-service.ts`
// para não misturar endpoints de domínios diferentes.
// -----------------------------------------------------------------------------

import api from '@/services/api';
import { listMovementSales } from '@/services/v2/MovementSales/movement-sale-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';

export interface BatchProfitabilityReportFilterParams {
  sale_id?: string;
  batch_id?: string;
  start_date?: string;
  end_date?: string;
  type: 0 | 1; // 0=PDF inline, 1=Excel download — mirror CL16
}

async function downloadBatchProfitabilityReport(
  params: BatchProfitabilityReportFilterParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/batch-profitability-report',
    { ...params },
    { responseType: 'blob' }
  );
  return data;
}

// `mapOptions`/adaptador do lookup de venda — filtra `status==='F'` NO
// CLIENTE (GAP-VD-02 herdado, ver docblock de topo). Paginação normal do
// servidor preservada (múltiplas páginas se necessário, mesmo padrão de
// scroll incremental do `SelectAsyncPaginate`); como o filtro reduz o
// array PÓS-paginação do servidor, uma página pode devolver menos itens que
// `per_page` mesmo havendo mais páginas com resultado — limitação aceita
// (herança do Gap já documentado, não introduzida por esta tela).
async function listBillableMovementSaleOptions(
  params: PaginationQueryParams & { search?: string }
): Promise<ResponsePagination<Option<string>[]>> {
  const response = await listMovementSales({
    page: params.page,
    per_page: params.per_page,
    search: params.search,
  });

  const billableItems = response.data.items.filter((item) => item.status === 'F');

  return {
    success: response.success,
    message: response.message,
    data: {
      items: billableItems.map((item) => ({
        label: item.client?.name ? `${item.code} — ${item.client.name}` : item.code,
        value: item.uuid,
      })),
      pagination: response.data.pagination,
    },
  };
}

export { downloadBatchProfitabilityReport, listBillableMovementSaleOptions };
