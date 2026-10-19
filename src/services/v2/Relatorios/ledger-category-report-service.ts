// src/services/v2/Relatorios/ledger-category-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Razão Categoria" (F-273, `LedgerCategoryReportController` da
// API, execução 059, `CONTRATO-F273-razao-categoria.md`, TASK-273-FE-01).
// Mirror ESTRUTURAL de `cash-flow-by-category-report-service.ts`/
// `received-interest-report-service.ts` — 1 função de download síncrono,
// resposta BINÁRIA (`application/pdf` inline ou `.../spreadsheetml.sheet`
// download), `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe o
// arquivo), MESMO endpoint decidido pelo campo `format` (`pdf`/`xlsx`).
//
// Endpoint: `GET /api/v1/ledger-category-report` (permissão
// `ledger_caregory_report` — grafia legada preservada,
// `PermissionTree.php:3597-3600`, dupla barreira `permission:`+`authorize()`
// no Controller/Request, ver docblocks respectivos). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica ao sucesso — mesma
// exceção documentada nos irmãos de download binário (`get_spa_api_client_
// pattern §COMPONENTE-RELATORIOS`); erro 422/401/403 chega como `Blob`
// também — o chamador usa `parseBlobError` no `catch`/`onError`.
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — `farm_id` aqui é SÓ o sub-filtro
// OPCIONAL tenant-wide do formulário, nunca um substituto do contexto de
// fazenda ativa.
//
// Lista os 7 campos EXPLICITAMENTE (mirror `cash-flow-by-category-report-
// service.ts` — nunca descartar params no service): string vazia/ausente
// vira `undefined` (nunca `''`/`null`); array vazio também vira `undefined`.
// Sem campo booleano nesta query (diferente de `cash-flow-by-category-
// report-service.ts::last_balance`) — nenhuma serialização especial
// necessária.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { LedgerCategoryReportParams } from '@/@types/v2/Relatorios/ledger-category-report';

async function downloadLedgerCategoryReport(params: LedgerCategoryReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/ledger-category-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      farm_id: params.farm_id || undefined,
      proprietary_id: params.proprietary_id || undefined,
      center_id: params.center_id || undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadLedgerCategoryReport };
