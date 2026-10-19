// src/services/v2/TransferDifferenceReport/transfer-difference-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Romaneio/Diferença" (Tarefa 49, esteira 97-Esteiras/014,
// feature_id c0b2369d). Mirror ESTRUTURAL de
// `accounts-payable-receivable-report-service.ts` — 1 função de download
// síncrono, resposta BINÁRIA (`application/pdf` ou
// `.../spreadsheetml.sheet` conforme `format`), `responseType: 'blob'`
// OBRIGATÓRIO (sem isso o axios corrompe o arquivo).
//
// Endpoint: `GET /api/v1/transfer-differences-report` — **sem** permissão de
// negócio na rota (`GAP-RMD-02`/`DEC-043`, preservado AS-IS; ver
// `router/index.tsx`). Resposta binária síncrona, fora do envelope
// `ApiResponse` (contrato de API §2). Erro 422/500 chega como `Blob`
// também — o chamador usa `parseBlobError` no `catch`.
//
// Lista os 3 filtros EXPLICITAMENTE (nunca descartar params no service):
// string vazia/ausente vira `undefined` (nunca `''`/`null`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { TransferDifferenceReportParams } from '@/@types/v2/TransferDifferenceReport';

async function downloadTransferDifferenceReport(
  params: TransferDifferenceReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/transfer-differences-report',
    {
      client: params.client || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadTransferDifferenceReport };
