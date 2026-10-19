// src/services/v2/Relatorios/production-area-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Prod./Área" (F-299, 97-Esteiras/012, Tarefa 47/48). Mirror
// estrutural de `cost-calculation-report-service.ts` (`toQuery` compartilhado
// pelo binário e pela prévia).
//
// Endpoints (contrato de API `api-contract-prod-area.md` v1,
// CONTRATO_AUTOAPROVADO; contrato de tela `frontend-contract-prod-area.md`
// §3/§9.1):
//   GET /production-area-report/production-cycles → opções do select de
//     ciclo + payload da cascata (`start_date`/`end_date`/`areas[]`).
//   GET /production-area-report/preview            → prévia em tabela
//     ({title,subtitle,columns,rows,kpis,filters}, mesmo wire de
//     `ApuracaoCusto`/`cost-calculation-report-service`).
//   GET /production-area-report                    → PDF, `Content-
//     Disposition: inline` (contrato de API §3.2) — `responseType:'blob'`,
//     aberto via `URL.createObjectURL`+`window.open` na página (NUNCA
//     `downloadBlob()`, contrato de tela §7.2/risco #1).
//
// `production_cycle` NUNCA entra em `ProductionAreaReportParams` — é
// client-only (FLT-01, contrato de API §3.1), só alimenta a cascata na
// página. Nenhuma função de Excel (não existe no legado nem na API,
// contrato de tela §9.1/§11).
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';

export interface ProductionAreaReportParams {
  start_date: string; // ISO 'YYYY-MM-DD'
  end_date: string; // ISO 'YYYY-MM-DD'
  area_uuids?: string[]; // ausente/vazio = todas as áreas (fidelidade FLT-02)
}

export type ProductionAreaReportColumnAlign = 'start' | 'end' | 'center';

export interface ProductionAreaReportColumn {
  key: string;
  label: string;
  align: ProductionAreaReportColumnAlign;
}

export interface ProductionAreaReportRow {
  /** Já formatadas PT-BR pelo backend — renderizar como texto puro, nunca reformatar no cliente. */
  cells: Record<string, string>;
  variant: 'normal' | 'group' | 'total';
  /** Sempre `[]` neste relatório — tratado por compatibilidade com o mesmo wire das outras telas. */
  negativeCells?: string[];
}

export interface ProductionAreaReportFilterChip {
  label: string;
  value: string;
}

export interface ProductionAreaReportPreview {
  title: string;
  subtitle: string;
  columns: ProductionAreaReportColumn[];
  rows: ProductionAreaReportRow[];
  /** `[]` neste relatório — não renderizado (contrato de tela §8.1). */
  kpis: unknown;
  filters: ProductionAreaReportFilterChip[];
}

export interface ProductionAreaReportCycleArea {
  uuid: string;
  description: string;
}

export interface ProductionAreaReportCycle {
  uuid: string;
  code: string;
  start_date: string; // ISO
  end_date: string; // ISO
  /** Pronta do servidor — ex.: "CP-2026-01 -> 01/03/2026 à 31/03/2026". */
  label: string;
  areas: ProductionAreaReportCycleArea[];
}

// Achata os campos opcionais para a querystring — compartilhado pela prévia
// e pelo binário (mirror `toQuery` de `cost-calculation-report-service.ts`).
function toQuery(params: ProductionAreaReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    area_uuids: params.area_uuids?.length ? params.area_uuids : undefined,
  };
}

async function listProductionAreaReportCycles(): Promise<ProductionAreaReportCycle[]> {
  const { data } = await api.V2.get<Response<ProductionAreaReportCycle[]>>(
    '/production-area-report/production-cycles'
  );
  return data.data;
}

async function getProductionAreaReportPreview(
  params: ProductionAreaReportParams
): Promise<ProductionAreaReportPreview> {
  const { data } = await api.V2.get<Response<ProductionAreaReportPreview>>(
    '/production-area-report/preview',
    toQuery(params)
  );
  return data.data;
}

async function downloadProductionAreaReportPdf(params: ProductionAreaReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/production-area-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export {
  downloadProductionAreaReportPdf,
  getProductionAreaReportPreview,
  listProductionAreaReportCycles,
};
