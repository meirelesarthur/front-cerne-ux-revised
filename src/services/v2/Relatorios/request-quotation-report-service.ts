// src/services/v2/Relatorios/request-quotation-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Orçamentos" (`request-quotation.report`, F-311, execução
// 97-Esteiras/078, TASK-F311-F02). Mirror ESTRUTURAL de
// `products-exit-cost-center-report-service.ts` — `toQuery` como WHITELIST
// EXPLÍCITA (nunca `{ ...params }`), 2 downloads binários síncronos sobre a
// MESMA rota, `report_type` distinto.
//
// Endpoint DELIVERED (FLAT, reconciliação obrigatória do plano — NÃO
// `/reports/...`):
//   GET /request-quotation-report (PDF/XLSX, responseType:'blob')
//   params: start_date, end_date, provider_id?, farm_id?, report_type(pdf|excel)
//
// FRONT-06 — options DEDICADO (1 único fetch, NUNCA os genéricos
// `/providers/options`/`/farms/options`):
//   GET /request-quotation-report/options → { providers:[{uuid,name}], farms:[{uuid,description}] }
//
// `toRequestQuotationReportParams()` é a FRONTEIRA OBRIGATÓRIA
// valores→payload — monta as chaves campo a campo a partir do form (4 campos)
// + o `report_type` literal recebido do handler que chama. PROIBIDO
// `{ ...values }`, spread parcial — a página nunca remonta chaves inline.
//
// `toQuery` omite `provider_id`/`farm_id` vazios (nunca envia `''`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  RequestQuotationReportFormValues,
  RequestQuotationReportOptions,
  RequestQuotationReportParams,
  RequestQuotationReportType,
} from '@/@types/v2/Relatorios/request-quotation-report';

function toRequestQuotationReportParams(
  values: RequestQuotationReportFormValues,
  reportType: RequestQuotationReportType
): RequestQuotationReportParams {
  return {
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    provider_id: values.provider_id?.value || undefined,
    farm_id: values.farm_id?.value || undefined,
    report_type: reportType,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor, e que `provider_id`/
// `farm_id` vazios não cheguem à querystring como `''`.
function toQuery(params: RequestQuotationReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    provider_id: params.provider_id || undefined,
    farm_id: params.farm_id || undefined,
    report_type: params.report_type,
  };
}

async function downloadRequestQuotationReportPdf(
  params: RequestQuotationReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/request-quotation-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadRequestQuotationReportExcel(
  params: RequestQuotationReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/request-quotation-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

// FRONT-06 — fetch DEDICADO, UM ÚNICO `useQuery` popula os 2 selects
// (`providerOptions`/`farmOptions` via `useMemo` na tela). NUNCA os
// endpoints genéricos `/providers/options`/`/farms/options`. Desempacota o
// envelope (`res.data.data`) — a tela consome `{ providers, farms }` direto.
async function getRequestQuotationReportOptions(): Promise<RequestQuotationReportOptions> {
  const { data } = await api.V2.get<Response<RequestQuotationReportOptions>>(
    '/request-quotation-report/options'
  );
  return data.data;
}

export {
  downloadRequestQuotationReportExcel,
  downloadRequestQuotationReportPdf,
  getRequestQuotationReportOptions,
  toRequestQuotationReportParams,
};
