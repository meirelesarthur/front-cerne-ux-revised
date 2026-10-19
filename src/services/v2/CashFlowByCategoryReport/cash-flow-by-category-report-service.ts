// src/services/v2/CashFlowByCategoryReport/cash-flow-by-category-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Fluxo de Caixa Mensal" (F-240, esteira 97-Esteiras/053,
// TASK-053-240-FE-01). Mirror estrutural de
// `expense-report-service.ts`/`cost-center-report-service.ts` — 1 função de
// download síncrono, resposta BINÁRIA (`application/pdf` inline ou
// `.../spreadsheetml.sheet` download), `responseType: 'blob'` OBRIGATÓRIO
// (sem isso o axios corrompe o arquivo).
//
// Endpoint: `GET /api/v1/cash-flow-by-category-report` (permissão
// `cashflow_by_category_report`, `CashFlowByCategoryReportRequest` — 10
// filtros/contrato, lido diretamente do código real da API). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica ao sucesso (mesma
// exceção documentada nos irmãos de download binário — PDF/Excel decidido
// pelo MESMO endpoint via campo `format`); erro 422/401/403 chega como
// `Blob` também — o chamador usa `parseBlobError` no `catch`.
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — `farm_id` aqui é SÓ o sub-filtro
// OPCIONAL tenant-wide do formulário, nunca um substituto do contexto de
// fazenda ativa.
//
// Lista os 10 campos EXPLICITAMENTE (armadilha #10 do checklist —
// `provider-service.ts` §cabeçalho — nunca descartar params no service):
// string vazia/ausente vira `undefined` (nunca `''`/`null`); arrays vazios
// também viram `undefined`. `last_balance` é o único campo booleano
// obrigatório — SEMPRE enviado, serializado como `'1'`/`'0'` (nunca
// `undefined`).
//
// BUGFIX (P0, achado no E2E — 875ca2e7 tinha o bug): axios/URLSearchParams
// serializa um `boolean` de JS cru na querystring como a STRING LITERAL
// `"true"`/`"false"` (`?last_balance=false`). A regra Laravel `boolean` NÃO
// aceita essas strings — só `true,false,1,0,"1","0"` — então `"false"`
// batia 422 (`"O campo last balance deve ser verdadeiro ou falso."`).
// Convertido para `'1'`/`'0'` (mirror do convênio JÁ usado em TODO o
// repositório para campo `boolean` do Laravel — `payload.is_enabled ? '1' :
// '0'` em `marker-service.ts`/`farm-admin-service.ts`/`equipment-service.ts`/
// `user-service.ts`/`writeoff-service.ts`/`site-service.ts`, mesmo racional,
// aqui aplicado a querystring em vez de `FormData`). Único campo booleano
// desta query (`CashFlowByCategoryReportParams` — os demais 9 campos são
// string/uuid/enum, conferido contra `CashFlowByCategoryReportRequest::
// rules()`); nenhum outro booleano nesta mesma chamada.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { CashFlowByCategoryReportParams } from '@/@types/v2/CashFlowByCategoryReport';

async function downloadCashFlowByCategoryReport(
  params: CashFlowByCategoryReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/cash-flow-by-category-report',
    {
      group: params.group,
      start_date: params.start_date,
      end_date: params.end_date,
      accounts: params.accounts && params.accounts.length > 0 ? params.accounts : undefined,
      // '1'/'0' — NUNCA o boolean cru (axios serializa como "true"/"false",
      // que a regra Laravel `boolean` rejeita com 422).
      last_balance: params.last_balance ? '1' : '0',
      proprietary_id: params.proprietary_id || undefined,
      center_id: params.center_id || undefined,
      farm_id: params.farm_id || undefined,
      report_type: params.report_type,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadCashFlowByCategoryReport };
