// src/services/v2/Relatorios/products-exit-cost-center-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Saídas x Centro Custo" (F-301, execução 97-Esteiras/078,
// TASK-F301-F02). Mirror ESTRUTURAL de `savings-report-service.ts` —
// `toQuery` como WHITELIST EXPLÍCITA (nunca `{ ...params }`), 2 downloads
// binários síncronos sobre a MESMA rota, `report_type` distinto.
//
// Endpoint DELIVERED (evidência viva `routes/api.php:2255`, reconciliação
// obrigatória do plano — NÃO `/reports/...`):
//   GET /products-exit-cost-center (PDF/XLSX, responseType:'blob')
//   params: start_date, end_date, center?, product?, warehouse?, report_type(pdf|excel)
//
// `toProductsExitCostCenterReportParams()` é a FRONTEIRA OBRIGATÓRIA
// valores→payload — monta as chaves campo a campo a partir do form (5 campos)
// + o `report_type` literal recebido do handler que chama. PROIBIDO
// `{ ...values }`, spread parcial — a página nunca remonta chaves inline.
//
// `toQuery` omite `center`/`warehouse`/`product` vazios (nunca envia `''`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type {
  ProductsExitCostCenterReportFormValues,
  ProductsExitCostCenterReportParams,
  ProductsExitCostCenterReportType,
} from '@/@types/v2/Relatorios/products-exit-cost-center';

function toProductsExitCostCenterReportParams(
  values: ProductsExitCostCenterReportFormValues,
  reportType: ProductsExitCostCenterReportType
): ProductsExitCostCenterReportParams {
  return {
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    center: values.center?.value || undefined,
    warehouse: values.warehouse?.value || undefined,
    product: values.product?.value || undefined,
    report_type: reportType,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor, e que `center`/
// `warehouse`/`product` vazios não cheguem à querystring como `''`.
function toQuery(params: ProductsExitCostCenterReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    center: params.center || undefined,
    warehouse: params.warehouse || undefined,
    product: params.product || undefined,
    report_type: params.report_type,
  };
}

async function downloadProductsExitCostCenterPdf(
  params: ProductsExitCostCenterReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/products-exit-cost-center', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadProductsExitCostCenterExcel(
  params: ProductsExitCostCenterReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/products-exit-cost-center', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export {
  downloadProductsExitCostCenterExcel,
  downloadProductsExitCostCenterPdf,
  toProductsExitCostCenterReportParams,
};
