// src/services/v2/Relatorios/financings-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Financiamentos" (F-265, execução 97-Esteiras/078,
// TASK-F265-F02). Mirror ESTRUTURAL de
// `products-exit-cost-center-report-service.ts` — `toQuery` como WHITELIST
// EXPLÍCITA (nunca `{ ...params }`), 2 downloads binários síncronos sobre a
// MESMA rota, `report_type` distinto.
//
// Endpoint DELIVERED (evidência viva `routes/api.php:2274`, reconciliação
// OBRIGATÓRIA do plano — COM prefixo `reports/`, DIFERENTE do path raiz do
// F-301 `/products-exit-cost-center`):
//   GET /reports/financings (PDF/XLSX, responseType:'blob')
//   params: start_date, end_date, report_type(pdf|excel)
//
// `toFinancingsReportParams()` é a FRONTEIRA OBRIGATÓRIA valores→payload —
// monta as chaves campo a campo a partir do form (2 campos, SEM selects) +
// o `report_type` literal recebido do handler que chama. PROIBIDO
// `{ ...values }`, spread parcial — a página nunca remonta chaves inline.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type {
  FinancingsReportFormValues,
  FinancingsReportParams,
  FinancingsReportType,
} from '@/@types/v2/Relatorios/financings-report';

function toFinancingsReportParams(
  values: FinancingsReportFormValues,
  reportType: FinancingsReportType
): FinancingsReportParams {
  return {
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    report_type: reportType,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor.
function toQuery(params: FinancingsReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    report_type: params.report_type,
  };
}

async function downloadFinancingsReportPdf(params: FinancingsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/reports/financings', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadFinancingsReportExcel(params: FinancingsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/reports/financings', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export { downloadFinancingsReportExcel, downloadFinancingsReportPdf, toFinancingsReportParams };
