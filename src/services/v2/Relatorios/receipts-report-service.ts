// src/services/v2/Relatorios/receipts-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Recebimentos" (F-305, TASK-RCB-FE-01, esteira 074). Mirror
// ESTRUTURAL de `paid-interest-report-service.ts`/`listDfesForReport` — 1
// função de download síncrono, resposta BINÁRIA (PDF ou Excel conforme
// `type`), `responseType: 'blob'` obrigatório — inclusive erro 422, que
// chega como `Blob` e precisa de `parseBlobError` no `catch` da tela.
//
// Endpoint: `GET /api/v1/receipts-report` (contrato de tela
// `recebimentos-contrato-front.md` §4, contrato de API
// `recebimentos-contrato-api.md`). Envelope `{success,message,data,errors,
// meta}` NÃO se aplica — mesma exceção documentada para controllers de
// relatório binário (`get_spa_api_client_pattern`, `COMPONENTE-RELATORIOS.md
// §8`).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface ReceiptsReportParams {
  product_uuid?: string;
  center_uuid?: string;
  category_uuid?: string;
  start_date: string;
  end_date: string;
  type: 'pdf' | 'excel';
}

async function downloadReceiptsReport(params: ReceiptsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/receipts-report',
    {
      product_uuid: params.product_uuid || undefined,
      center_uuid: params.center_uuid || undefined,
      category_uuid: params.category_uuid || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      type: params.type,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadReceiptsReport };
