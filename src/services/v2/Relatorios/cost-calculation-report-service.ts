// src/services/v2/Relatorios/cost-calculation-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Apuração de Custo" (F-245, TASK-245-FE-01, esteira 073 — AMPLIADO
// na rodada de homologação de 5 itens). Mirror ESTRUTURAL de
// `income-statement-report-service.ts` (`toQuery` compartilhado pelo binário +
// pela prévia JSON) — 3 funções: `getCostCalculationReportPreview` (JSON,
// `Response<T>`-envelope, mirror `getIncomeStatementPreview`),
// `downloadCostCalculationReportPdf` (binário, `responseType: 'blob'`,
// preexistente) e `downloadCostCalculationReportExcel` (binário, NOVO — mirror
// `downloadIncomeStatementReportExcel`).
//
// Endpoints (contrato de tela, homologação): `GET /cost-calculation-report`
// (PDF), `GET /cost-calculation-report/excel` (Excel), `GET
// /cost-calculation-report/preview` (JSON — `{title,subtitle,columns,rows,
// kpis,filters}`, mirror do relatório LARGO, células JÁ formatadas PT-BR pelo
// backend, `align` por coluna 'start'|'end'|'center'). Envelope
// `{success,message,data,errors,meta}` se aplica À PRÉVIA (JSON, mirror
// `getIncomeStatementPreview`) — NÃO se aplica aos 2 binários (mesma exceção
// documentada de `dre-report-service.ts`/`paid-interest-report-service.ts`).
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`);
// `farm_uuid` aqui é SÓ o sub-filtro OPCIONAL adicional do formulário
// (FILTER-03 do legado), tenant-wide por padrão — nunca um substituto do
// contexto de fazenda ativa.
//
// Forma interna do form (Option-based, react-select) — documentada aqui
// porque é ESTE service quem recebe a forma já achatada
// (`CostCalculationReportParams`), a extração `.value`/`.map(o=>o.value)`
// acontece em `buildParams` da página (TASK-245-FE-02), nunca dentro deste
// service:
//   farm_uuid: Option<string> | null              →  string | undefined
//   cost_center_uuids: Option<string>[] | null    →  string[] | undefined
//   account_uuids: Option<string>[] | null        →  string[] | undefined
//   order_by: 'asc' | 'desc'                      →  'asc' | 'desc'
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';

export interface CostCalculationReportParams {
  start_date: string;
  end_date: string;
  farm_uuid?: string;
  cost_center_uuids?: string[];
  account_uuids?: string[];
  order_by?: 'asc' | 'desc';
}

/** Alinhamento por coluna — mapeado 1:1 em `textAlign` do `Table.ColumnHeader`/`Table.Cell` (Chakra v3 aceita 'start'|'end'|'center' como valor CSS válido). */
export type CostCalculationReportColumnAlign = 'start' | 'end' | 'center';

export interface CostCalculationReportColumn {
  key: string;
  label: string;
  align: CostCalculationReportColumnAlign;
}

export interface CostCalculationReportRow {
  /** Já formatadas PT-BR (R$/percentual) pelo backend — renderizar como texto puro, nunca reformatar no cliente. */
  cells: Record<string, string>;
  variant: 'normal' | 'group' | 'total';
  /**
   * Campo ADITIVO (homologação, esteira 073 — negativo em vermelho).
   * Lista das chaves de `cells` cujo valor é negativo — o cliente NUNCA
   * reinterpreta o número formatado, só decide a cor da célula por chave.
   * Ausente em respostas antigas (API em rollout paralelo) → tratar como `[]`.
   */
  negativeCells?: string[];
}

export interface CostCalculationReportPreview {
  title: string;
  subtitle: string;
  columns: CostCalculationReportColumn[];
  rows: CostCalculationReportRow[];
  kpis: unknown;
  filters: unknown;
}

// Achata os campos opcionais para a querystring — compartilhado pelas 3
// funções abaixo (mirror `toQuery` de `income-statement-report-service.ts`).
function toQuery(params: CostCalculationReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    farm_uuid: params.farm_uuid || undefined,
    cost_center_uuids: params.cost_center_uuids?.length ? params.cost_center_uuids : undefined,
    account_uuids: params.account_uuids?.length ? params.account_uuids : undefined,
    order_by: params.order_by || 'asc',
  };
}

async function getCostCalculationReportPreview(
  params: CostCalculationReportParams
): Promise<CostCalculationReportPreview> {
  const { data } = await api.V2.get<Response<CostCalculationReportPreview>>(
    '/cost-calculation-report/preview',
    toQuery(params)
  );
  return data.data;
}

async function downloadCostCalculationReportPdf(
  params: CostCalculationReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/cost-calculation-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

// NOVO (homologação, execução 073) — mesmo filtro `toQuery` do PDF, mesmo
// contrato de binário (`responseType: 'blob'`, content-type xlsx em vez de
// pdf), mirror `downloadIncomeStatementReportExcel`.
async function downloadCostCalculationReportExcel(
  params: CostCalculationReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/cost-calculation-report/excel', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export {
  downloadCostCalculationReportExcel,
  downloadCostCalculationReportPdf,
  getCostCalculationReportPreview,
};
