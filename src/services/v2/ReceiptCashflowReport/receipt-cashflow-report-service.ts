// src/services/v2/ReceiptCashflowReport/receipt-cashflow-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Fluxo Mensal de Recebimento" (F-303, esteira 97-Esteiras/059,
// TASK-303-API-03). Mirror ESTRUTURAL de `receipt-schedule-report-service.ts`
// (F-304, irmã direta — MESMO dispatch de saída no Controller:
// `GbCerneSnappyReport::inline` para `format=pdf` — resposta binária SERVIDA
// INLINE — e `Excel::download`/`GbCerneReportExcel::download` para
// `format=xlsx` — download direto) — 1 função de download síncrono,
// resposta BINÁRIA, `responseType: 'blob'` OBRIGATÓRIO (inclusive erro 422,
// que chega como `Blob` e precisa de `parseBlobError` no `catch`/`onError`
// da tela).
//
// Endpoint: `GET /api/v1/receipt-cashflow-report` (permissão
// `monthly-receipt-flow_view`, `ReceiptCashflowReportRequest` — 8 filtros,
// contrato `CONTRATO-F303-fluxo-mensal-recebimento.md` §"Decisão de
// arquitetura", lido diretamente do código real da API). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica ao sucesso (mesma
// exceção documentada nos irmãos de download binário — PDF/Excel decidido
// pelo MESMO endpoint via campo `format`).
//
// `accounts`/`start_date`/`end_date`/`proprietary_id`/`center_id`/
// `categories`/`farm_id`/`format` são os nomes 1:1 de
// `ReceiptCashflowReportRequest::rules()` — SEM renomeação (diferente de
// `receipt-schedule-report-service.ts`, cujo endpoint espera
// `proprietary_uuid`/`center_uuid`/`farm`).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`). `farm_id` aqui é
// SÓ o sub-filtro OPCIONAL tenant-wide do formulário (DEC-265, assimetria
// OQ-003 preservada no backend), nunca um substituto do contexto de fazenda
// ativa.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { ReceiptCashflowReportParams } from '@/@types/v2/ReceiptCashflowReport';

async function downloadReceiptCashflowReport(
  params: ReceiptCashflowReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/receipt-cashflow-report',
    {
      accounts: params.accounts && params.accounts.length > 0 ? params.accounts : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      proprietary_id: params.proprietary_id || undefined,
      center_id: params.center_id || undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      farm_id: params.farm_id || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadReceiptCashflowReport };
