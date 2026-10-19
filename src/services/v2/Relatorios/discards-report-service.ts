// src/services/v2/Relatorios/discards-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Descarte Romaneio" (F-256, execução 97-Esteiras/078,
// TASK-F256-F02). Mirror ESTRUTURAL de
// `products-exit-cost-center-report-service.ts` (F-301) — `toQuery` como
// WHITELIST EXPLÍCITA (nunca `{ ...params }`), 2 downloads binários síncronos
// sobre a MESMA rota, `report_type` distinto.
//
// Endpoint DELIVERED (evidência viva `routes/api.php:2304`, reconciliação
// obrigatória do plano — NÃO `/reports/...`):
//   GET /discards-report (PDF/XLSX, responseType:'blob')
//   params: start_date, end_date, area?, report_type(pdf|excel)
//
// `toDiscardsReportParams()` é a FRONTEIRA OBRIGATÓRIA valores→payload —
// monta as chaves campo a campo a partir do form (3 campos) + o
// `report_type` literal recebido do handler que chama. PROIBIDO
// `{ ...values }`, spread parcial — a página nunca remonta chaves inline.
//
// `toQuery` omite `area` vazia (nunca envia `''`).
//
// `getAreasOptions()` NÃO é reimplementado aqui — reusa o mirror EXATO já
// vivo em `@/services/v2/Rainfalls/rainfall-service.ts` (`GET
// /areas/options`, farm-scoped, `FlatOptionsEnvelope<AreaOptionItem>`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type {
  DiscardsReportFormValues,
  DiscardsReportParams,
  DiscardsReportType,
} from '@/@types/v2/Relatorios/discards-report';

function toDiscardsReportParams(
  values: DiscardsReportFormValues,
  reportType: DiscardsReportType
): DiscardsReportParams {
  return {
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    area: values.area?.value || undefined,
    report_type: reportType,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor, e que `area` vazia não
// chegue à querystring como `''`.
function toQuery(params: DiscardsReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    area: params.area || undefined,
    report_type: params.report_type,
  };
}

async function downloadDiscardsReportPdf(params: DiscardsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/discards-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadDiscardsReportExcel(params: DiscardsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/discards-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export { downloadDiscardsReportExcel, downloadDiscardsReportPdf, toDiscardsReportParams };
