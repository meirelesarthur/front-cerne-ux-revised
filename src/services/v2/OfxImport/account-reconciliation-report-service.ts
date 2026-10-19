// src/services/v2/OfxImport/account-reconciliation-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de Conciliação de Contas Consolidadas (SURF-033/034, TASK-MES-FE-11
// — CONDICIONAL, desbloqueado por DEC-177/DECISOES-DONO.md: "Meses COMPLETA,
// inclui relatório consolidado"). Mirror estrutural de `ofx-import-service.ts`
// (`getOfxReport`) e do padrão de export duplo PDF/Excel de
// `@/services/v2/Evolutions/evolution-service.ts`
// (`downloadEvolutionsReportPdf`/`downloadEvolutionsReportXlsx`).
//
// REWORK (F-213 "Conciliação de Contas", lote 079, 97-Esteiras/079/ROTEIROS/
// F-213-plano-frontend-rework.md) — a API JÁ MIGRADA expõe DUAS rotas
// distintas, não uma só:
//   `GET /account-reconciliation-report`            (`report()`)   → JSON, linhas CRUAS (prévia em tela)
//   `GET /account-reconciliation-report/generated`   (`generated()`) → PDF/Excel binário (`report_type`)
// BUG CORRIGIDO nesta Tarefa (achado §0.2 do plano): a função de export
// chamava `/account-reconciliation-report` (rota JSON) com
// `responseType:'blob'` — o "PDF" baixado era, na prática, o corpo JSON da
// prévia (documento corrompido no visualizador). Agora aponta para
// `/generated`, a única rota que de fato devolve binário.
//
// Campos (contrato-meses-norm.md FLD-073 a FLD-080, `account_report`):
//   account_uuid  — opcional (FLD-073, FIL-009, default "todas").
//   start_date/
//   end_date      — par OBRIGATÓRIO (FLD-074/075) — o front só dispara a
//                    consulta com as duas datas presentes (mirror "consulta
//                    só ocorre quando presente junto com end_date").
//   condition     — enum 0/1 (FLD-076/FIL-012): 0 = sem joins de
//                    categoria/centro, 1 = COM os dois joins (não é uma
//                    escolha exclusiva categoria-OU-centro).
//   provider_uuid/
//   client_uuid   — opcionais (FLD-077/078, FIL-013/014).
//   order_by      — enum FECHADO 'asc'|'desc' (FLD-079/FIL-015, mirror
//                    `ORDER BY date,id`) — o front NUNCA expõe este campo
//                    como texto livre (nota de risco do fork de extração:
//                    "servidor indexa mapa sem validação").
//   report_type   — 0 (PDF) | 1 (Excel), FLD-080/FIL-016 — resolvido pelas
//                    2 funções exportadas abaixo, nunca pelo consumidor.
//
// PRÉVIA EM TELA (Fatia 3, F-213) — `getAccountReconciliationReportPreview`
// consome a MESMA rota `report()` usada pelo download antigo (JSON puro,
// `ApiResponse::success($rows->values())`), SEM paginação (`meta: null`).
// Decisão de shape (documentada, §3.1 do plano): ao contrário de
// `cost-calculation-report-service.ts` (`/preview` já formatado
// {columns,rows} no backend), esta rota devolve linhas CRUAS
// (`MovementRepository::reportAccountReconciliation()`) — o front monta o
// view-model (`buildAccountReconciliationColumns`/`Rows`, ver
// `RelatorioConsolidado/buildPreviewViewModel.ts`) espelhando literalmente
// `GenerateAccountReconciliationReportAction::buildColumns()/buildRows()`
// (usada hoje só no caminho PDF/Excel). OPORTUNIDADE DE CONFORMIDADE FUTURA
// (fora do escopo deste rework, front-only): alinhar `report()` ao padrão
// `/preview` já formatado no servidor, evitando essa duplicação de regra de
// apresentação entre front e back.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';

export type AccountReconciliationReportCondition = 0 | 1;
export type AccountReconciliationReportOrderBy = 'asc' | 'desc';

export interface AccountReconciliationReportParams {
  account_uuid?: string;
  start_date: string;
  end_date: string;
  condition?: AccountReconciliationReportCondition;
  provider_uuid?: string;
  client_uuid?: string;
  order_by: AccountReconciliationReportOrderBy;
}

/**
 * Shape CRU devolvido por `GET /account-reconciliation-report`
 * (`MovementRepository::reportAccountReconciliation()`, `DB::table()` sem
 * cast Eloquent) — `value`/`allocation_value` chegam como STRING do
 * Postgres, nunca `number`. `category`/`center`/`allocation_*` só existem na
 * resposta quando `condition=1` (mirror `addSelect` condicional do backend).
 */
export interface AccountReconciliationReportRawRow {
  provider_name: string | null;
  client_name: string | null;
  document: string | null;
  /** Char cru RTRIM'd do banco — 'E'|'S'|'A'|'T'|'M'|'F' (`App\Enums\MovementType`). */
  type: string;
  /** Decimal cru do Postgres via `DB::table()` — SEMPRE string, converter com `Number()` antes de formatar. */
  value: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  account: string;
  category?: string | null;
  center?: string | null;
  allocation_value?: string | null;
  allocation_interest?: string | null;
}

// Achata os campos opcionais para a querystring — compartilhado pela prévia
// JSON e pelo download binário (mesmos filtros, rotas diferentes).
function toQuery(params: AccountReconciliationReportParams) {
  return {
    account_uuid: params.account_uuid || undefined,
    start_date: params.start_date,
    end_date: params.end_date,
    condition: params.condition ?? 0,
    provider_uuid: params.provider_uuid || undefined,
    client_uuid: params.client_uuid || undefined,
    order_by: params.order_by,
  };
}

/**
 * Prévia em tela (Fatia 3, F-213) — `GET /account-reconciliation-report`
 * (JSON, rota `report()`, linhas CRUAS). Envelope `ApiResponse` padrão
 * (`success/message/data/errors/meta`), `meta: null` (lista completa,
 * síncrona, sem paginação server-side).
 * @param {AccountReconciliationReportParams} params - Filtros do relatório.
 * @return {Promise<AccountReconciliationReportRawRow[]>} Linhas cruas da consulta.
 */
async function getAccountReconciliationReportPreview(
  params: AccountReconciliationReportParams
): Promise<AccountReconciliationReportRawRow[]> {
  const { data } = await api.V2.get<Response<AccountReconciliationReportRawRow[]>>(
    '/account-reconciliation-report',
    toQuery(params)
  );
  return data.data;
}

/**
 * Download binário — SEMPRE `/account-reconciliation-report/generated`
 * (rota `generated()`, a ÚNICA que devolve PDF/Excel de verdade; `report()`
 * devolve JSON e nunca deveria receber `responseType:'blob'` — BUG #2
 * corrigido nesta Tarefa). `report_type`: falsy(0)=PDF, truthy(1)=Excel
 * (mirror `AccountReconciliationReportRequest::rules()`, `Rule::in([0,1])`).
 * @param {AccountReconciliationReportParams} params - Filtros do relatório.
 * @param {0 | 1} reportType - 0 = PDF, 1 = Excel.
 * @return {Promise<Blob>} Binário do relatório.
 */
async function requestGeneratedAccountReconciliationReport(
  params: AccountReconciliationReportParams,
  reportType: 0 | 1
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/account-reconciliation-report/generated',
    { ...toQuery(params), report_type: reportType },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadAccountReconciliationReportPdf(
  params: AccountReconciliationReportParams
): Promise<Blob> {
  return requestGeneratedAccountReconciliationReport(params, 0);
}

async function downloadAccountReconciliationReportXlsx(
  params: AccountReconciliationReportParams
): Promise<Blob> {
  return requestGeneratedAccountReconciliationReport(params, 1);
}

export {
  downloadAccountReconciliationReportPdf,
  downloadAccountReconciliationReportXlsx,
  getAccountReconciliationReportPreview,
};
