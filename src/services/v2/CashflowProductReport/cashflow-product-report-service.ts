// src/services/v2/CashflowProductReport/cashflow-product-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Estoque Financeiro" (F-241, esteira 97-Esteiras/013,
// TASK-013-241-FE-02). Mirror estrutural de
// `cash-flow-by-category-report-service.ts` — 1 função de download síncrono,
// resposta BINÁRIA (`application/pdf` inline ou
// `.../spreadsheetml.sheet` download), `responseType: 'blob'` OBRIGATÓRIO
// (sem isso o axios corrompe o arquivo).
//
// Endpoint (PROVISÓRIO — `LAC-FE-05`, camada API ainda sem
// `CONTRATO_AUTOAPROVADO`): `GET /api/v1/cashflow-product-report`, permissão
// `cashflow_product_report` (já existente em `permissionsCatalog.json`).
//
// Params (PROVISÓRIOS — `LAC-FE-01`/`LAC-FE-02`): `start_date`/`end_date`
// (ISO `YYYY-MM-DD`, mirror `DateInput` + irmão F-240), `format`
// (`'pdf' | 'xlsx'`, mirror `reportFormatOptions`, 17 telas). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica ao sucesso (mesma
// exceção documentada nos irmãos de download binário); erro 401/403/422
// chega como `Blob` também — o chamador usa `parseBlobError` no `catch`.
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — não reimplementado aqui.
//
// Lista os 3 campos EXPLICITAMENTE (armadilha do checklist —
// `provider-service.ts` §cabeçalho — nunca descartar params no service).
// Esta tela não tem campo booleano hoje — regra `'1'`/`'0'` (nunca boolean
// cru) registrada por precaução nos irmãos, sem superfície aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { CashflowProductReportParams } from '@/@types/v2/CashflowProductReport';

async function downloadCashflowProductReport(params: CashflowProductReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/cashflow-product-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadCashflowProductReport };
