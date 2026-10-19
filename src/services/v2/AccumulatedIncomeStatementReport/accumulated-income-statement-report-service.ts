// src/services/v2/AccumulatedIncomeStatementReport/accumulated-income-statement-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Custo de Produção Acumulado" (F-217, `AccumulatedIncomeStatement-
// Controller` do legado, esteira 97-Esteiras/058, TASK-058-F217-FE-01).
// Mirror ESTRUTURAL de `request-purchase-management-report-service.ts`
// (`toQuery` compartilhado pelas 2 rotas de download, SEM recálculo).
//
// Endpoints (plano de API F-217 §Passo/contrato — `farm.context` aplicado
// antes do prefix `/api/v1`):
//   GET /accumulated-income-statement/pdf    → PDF binário (`responseType:'blob'`).
//   GET /accumulated-income-statement/excel  → Excel binário (`responseType:'blob'`).
//
// O endpoint de preview JSON (`GET /accumulated-income-statement`) e os 3
// endpoints de drill-down (`income-statement/*`) EXISTEM na API mas NÃO são
// consumidos por esta entrega (D-058-02, plano §0) — ficam disponíveis para
// uma extensão futura, fora deste escopo.
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — `farm_id` aqui é SÓ o sub-filtro
// OPCIONAL tenant-wide do formulário, nunca um substituto do contexto de
// fazenda ativa.
//
// `format` (Option local, PDF/Excel) é resolvido na PÁGINA para decidir qual
// função abaixo chamar — NUNCA entra em `toQuery`/na querystring.
//
// CORREÇÃO CIRÚRGICA (TASK-058-F217-FIX-01, esteira 058): `toQuery` só faz
// passthrough — as chaves `proprietary_id`/`harvest_id`/`cost_center_ids`
// já vêm corretas de `AccumulatedIncomeStatementReportParams` (mirror
// `HasIncomeStatementFilterRules` da API); antes eram enviadas como
// `proprietary`/`harvest`/`cost_center` e descartadas em silêncio pela API.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AccumulatedIncomeStatementReportParams } from '@/@types/v2/AccumulatedIncomeStatementReport';

// Achata os campos opcionais para a querystring — compartilhado pelas 2
// funções de download abaixo (mirror `toQuery` de
// `request-purchase-management-report-service.ts`).
function toQuery(params: AccumulatedIncomeStatementReportParams) {
  return {
    group: params.group,
    type: params.type,
    start_date: params.start_date,
    end_date: params.end_date,
    calculation_module: params.calculation_module,
    farm_id: params.farm_id || undefined,
    proprietary_id: params.proprietary_id || undefined,
    has_stock: params.has_stock ?? undefined,
    harvest_id: params.harvest_id || undefined,
    cost_center_ids:
      params.cost_center_ids && params.cost_center_ids.length > 0
        ? params.cost_center_ids
        : undefined,
  };
}

async function downloadAccumulatedIncomeStatementReportPdf(
  params: AccumulatedIncomeStatementReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/accumulated-income-statement/pdf', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadAccumulatedIncomeStatementReportExcel(
  params: AccumulatedIncomeStatementReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/accumulated-income-statement/excel', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export {
  downloadAccumulatedIncomeStatementReportExcel,
  downloadAccumulatedIncomeStatementReportPdf,
};
