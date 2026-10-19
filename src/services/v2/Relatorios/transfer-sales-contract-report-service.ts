// src/services/v2/Relatorios/transfer-sales-contract-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Romaneio/Vendas/Contrato" (F-331, TASK-RVC-FE-01, esteira
// 97-Esteiras/008). Mirror ESTRUTURAL de `receipt-schedule-report-service.ts`
// (F-304, também usa `format`) — 1 função de download síncrono, resposta
// BINÁRIA (PDF `inline` ou XLSX `attachment` conforme `format`).
//
// Endpoint: `GET /api/v1/transfer-sales-contract-report`. Envelope
// `{success,message,data,errors,meta}` NÃO se aplica — mesma exceção
// documentada para controllers de relatório binário
// (`get_spa_api_client_pattern`). `responseType: 'blob'` é OBRIGATÓRIO —
// inclusive o erro `422`, que chega como `Blob` e exige `parseBlobError` no
// `onError` da mutation da tela (TASK-RVC-FE-02).
//
// ⚠️ Os filtros `client`/`type`/`product`/`contract` são os nomes CURTOS reais
// de `TransferSalesContractReportRequest::rules()` — NÃO `client_uuid`/
// `product_uuid`/`sale_contract_uuid` (mirror `sale-client-report-service.ts`
// seria um erro aqui: a ponte para as FKs reais é feita 100% do lado
// servidor, `TransferSalesContractReportController::buildFilters()`). Enviar
// o sufixo `_uuid` faz o servidor ignorar o filtro em silêncio.
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { TransferSalesContractReportParams } from '@/@types/v2/Relatorios/transfer-sales-contract-report';

async function downloadTransferSalesContractReport(
  params: TransferSalesContractReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/transfer-sales-contract-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      client: params.client || undefined,
      type: params.type || undefined,
      product: params.product || undefined,
      contract: params.contract || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadTransferSalesContractReport };
