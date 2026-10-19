// src/services/v2/Relatorios/requisitions-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Requisição/Saída" (F-312, execução 97-Esteiras/078,
// TASK-F312-F02). Mirror ESTRUTURAL de
// `products-exit-cost-center-report-service.ts` MENOS o campo `center` —
// `toQuery` como WHITELIST EXPLÍCITA (nunca `{ ...params }`), 2 downloads
// binários síncronos sobre a MESMA rota, `report_type` distinto.
//
// Endpoint DELIVERED (path FLAT, NÃO `/reports/...`):
//   GET /requisitions-report (PDF/XLSX, responseType:'blob')
//   params: start_date, end_date, warehouse?, product?, report_type(pdf|excel)
//
// `toRequisitionsReportParams()` é a FRONTEIRA OBRIGATÓRIA valores→payload —
// monta as chaves campo a campo a partir do form (4 campos) + o
// `report_type` literal recebido do handler que chama. PROIBIDO
// `{ ...values }`, spread parcial — a página nunca remonta chaves inline.
//
// `toQuery` omite `warehouse`/`product` vazios (nunca envia `''`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type {
  RequisitionsReportFormValues,
  RequisitionsReportParams,
  RequisitionsReportType,
} from '@/@types/v2/Relatorios/requisitions-report';

function toRequisitionsReportParams(
  values: RequisitionsReportFormValues,
  reportType: RequisitionsReportType
): RequisitionsReportParams {
  return {
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    warehouse: values.warehouse?.value || undefined,
    product: values.product?.value || undefined,
    report_type: reportType,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor, e que `warehouse`/
// `product` vazios não cheguem à querystring como `''`.
function toQuery(params: RequisitionsReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    warehouse: params.warehouse || undefined,
    product: params.product || undefined,
    report_type: params.report_type,
  };
}

async function downloadRequisitionsReportPdf(params: RequisitionsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/requisitions-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadRequisitionsReportExcel(params: RequisitionsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/requisitions-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export {
  downloadRequisitionsReportExcel,
  downloadRequisitionsReportPdf,
  toRequisitionsReportParams,
};
