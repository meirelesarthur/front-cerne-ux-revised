// src/services/v2/Relatorios/income-statement-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Custo de Produção" (F-272, `IncomeStatementController`/
// `IncomeStatementDrillDownController` do legado, esteira 97-Esteiras/073,
// TASK-272-FE-01). Mirror ESTRUTURAL de `paid-interest-report-service.ts` para
// o binário (`downloadIncomeStatementReportPdf`) + 1 função `Response<T>`-
// envelope (mirror `harvest-service.ts::listHarvestOptions`) para o preview +
// 3 funções `Response<T>`-envelope para os drill-downs. Endpoints confirmados
// em `GB.Cerne.Api/routes/api.php:1920-1925`.
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — `farm_id` aqui é SÓ o sub-filtro
// OPCIONAL tenant-wide do formulário (contrato de tela §2, campo 6), nunca
// um substituto do contexto de fazenda ativa.
//
// SEM paginação no preview — a API entrega o array COMPLETO já achatado
// (`ApiResponse::success(IncomeStatementRowResource[])`, mirror `CashFlow`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  IncomeStatementApportionmentDetail,
  IncomeStatementCategoryDetail,
  IncomeStatementDepreciationDetail,
  IncomeStatementFilterParams,
  IncomeStatementRow,
} from '@/@types/v2/Relatorios/income-statement';

// Achata os campos opcionais para a querystring — mirror `buildParams` das
// telas-irmãs, centralizado aqui porque as 5 funções abaixo compartilham o
// MESMO filtro-base (contrato de tela §5 — os 3 drill-downs reenviam os 9
// campos do filtro aplicado + 1 campo próprio).
function toQuery(filters: IncomeStatementFilterParams) {
  return {
    group: filters.group,
    type: filters.type,
    start_date: filters.start_date,
    end_date: filters.end_date,
    calculation_module: filters.calculation_module,
    farm_id: filters.farm_id || undefined,
    proprietary_id: filters.proprietary_id || undefined,
    has_stock: filters.has_stock ?? undefined,
    harvest_id: filters.harvest_id || undefined,
    cost_center_ids: filters.cost_center_ids?.length ? filters.cost_center_ids : undefined,
  };
}

async function getIncomeStatementPreview(
  filters: IncomeStatementFilterParams
): Promise<IncomeStatementRow[]> {
  const { data } = await api.V2.get<Response<IncomeStatementRow[]>>(
    '/income-statement',
    toQuery(filters)
  );
  return data.data;
}

async function downloadIncomeStatementReportPdf(
  filters: IncomeStatementFilterParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/income-statement/pdf', toQuery(filters), {
    responseType: 'blob',
  });
  return data;
}

// Correção pós-homologação (esteira 073) — decisão do Maestro: "Tipo de
// Relatório" (PDF/Excel) FUNCIONAL. Rota nova `/income-statement/excel`
// (materializada em paralelo pelo executor de API) — mesmo filtro `toQuery`
// do PDF, mesmo contrato de binário (`responseType: 'blob'`, content-type
// xlsx em vez de pdf).
async function downloadIncomeStatementReportExcel(
  filters: IncomeStatementFilterParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/income-statement/excel', toQuery(filters), {
    responseType: 'blob',
  });
  return data;
}

async function getIncomeStatementCategoryDetails(
  filters: IncomeStatementFilterParams,
  categoryId: number
): Promise<IncomeStatementCategoryDetail[]> {
  const { data } = await api.V2.get<Response<IncomeStatementCategoryDetail[]>>(
    '/income-statement/categories',
    { ...toQuery(filters), category_id: categoryId }
  );
  return data.data;
}

async function getIncomeStatementDepreciationDetails(
  filters: IncomeStatementFilterParams,
  familyDescription: string | null
): Promise<IncomeStatementDepreciationDetail[]> {
  const { data } = await api.V2.get<Response<IncomeStatementDepreciationDetail[]>>(
    '/income-statement/depreciation-details',
    { ...toQuery(filters), family_description: familyDescription ?? undefined }
  );
  return data.data;
}

async function getIncomeStatementApportionmentDetails(
  filters: IncomeStatementFilterParams,
  centerDescription: string | null
): Promise<IncomeStatementApportionmentDetail[]> {
  const { data } = await api.V2.get<Response<IncomeStatementApportionmentDetail[]>>(
    '/income-statement/apportionment-details',
    { ...toQuery(filters), center_description: centerDescription ?? undefined }
  );
  return data.data;
}

export {
  downloadIncomeStatementReportExcel,
  downloadIncomeStatementReportPdf,
  getIncomeStatementApportionmentDetails,
  getIncomeStatementCategoryDetails,
  getIncomeStatementDepreciationDetails,
  getIncomeStatementPreview,
};
