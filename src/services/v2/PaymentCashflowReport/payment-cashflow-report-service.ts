// src/services/v2/PaymentCashflowReport/payment-cashflow-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Fluxo Mensal de Pagamento" (`payment-cashflow.report`, F-293,
// execução 97-Esteiras/078, TASK-F293-F02). Mirror ESTRUTURAL de
// `request-quotation-report-service.ts` — `toQuery` como WHITELIST EXPLÍCITA
// (nunca `{ ...params }`), 2 downloads binários síncronos sobre a MESMA
// rota, `report_type` distinto.
//
// Endpoint DELIVERED (FLAT, reconciliação obrigatória do plano — NÃO
// `/reports/...`):
//   GET /payment-cashflow-report (PDF/Excel, responseType:'blob')
//   params: start_date, end_date, accounts[]?, proprietary?, center_id?,
//           categories[]?, farm_id?, report_type(pdf|excel)
//
// FRONT-07 — options DEDICADO (1 único fetch, NUNCA os genéricos
// `/accounts/options`/`/cost-centers/options`/`/proprietaries/options`/
// `/farms/options`):
//   GET /payment-cashflow-report/options →
//     { accounts, proprietaries, cost_centers, financial_categories, farms }
//
// `toPaymentCashflowReportParams()` é a FRONTEIRA OBRIGATÓRIA
// valores→payload — monta as chaves campo a campo a partir do form (7
// campos) + o `report_type` literal recebido do handler que chama. PROIBIDO
// `{ ...values }`, spread parcial — a página nunca remonta chaves inline.
//
// `toQuery` omite `accounts`/`categories`/`proprietary`/`center_id`/
// `farm_id` vazios (nunca envia `''`/`[]`). Nomes EXATOS de param:
// `proprietary` (NÃO `proprietary_id`), `center_id`, `farm_id`, `accounts`,
// `categories`, `report_type` (NUNCA `type`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  PaymentCashflowReportFormValues,
  PaymentCashflowReportOptions,
  PaymentCashflowReportParams,
  PaymentCashflowReportType,
} from '@/@types/v2/PaymentCashflowReport';

function toPaymentCashflowReportParams(
  values: PaymentCashflowReportFormValues,
  reportType: PaymentCashflowReportType
): PaymentCashflowReportParams {
  return {
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    accounts: values.accounts.length > 0 ? values.accounts : undefined,
    proprietary: values.proprietary?.value || undefined,
    center_id: values.center_id?.value || undefined,
    categories: values.categories.length > 0 ? values.categories : undefined,
    farm_id: values.farm_id?.value || undefined,
    report_type: reportType,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor, e que
// `accounts`/`categories`/`proprietary`/`center_id`/`farm_id` vazios não
// cheguem à querystring como `''`/`[]`.
function toQuery(params: PaymentCashflowReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    accounts: params.accounts && params.accounts.length > 0 ? params.accounts : undefined,
    proprietary: params.proprietary || undefined,
    center_id: params.center_id || undefined,
    categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
    farm_id: params.farm_id || undefined,
    report_type: params.report_type,
  };
}

async function downloadPaymentCashflowReportPdf(
  params: PaymentCashflowReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/payment-cashflow-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadPaymentCashflowReportExcel(
  params: PaymentCashflowReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/payment-cashflow-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

// FRONT-07 — fetch DEDICADO, UM ÚNICO `useQuery` popula os 5 campos
// (`accountItems`/`categoryItems`/`proprietaryOptions`/`costCenterOptions`/
// `farmOptions` via `useMemo` na tela). NUNCA os endpoints genéricos.
// Desempacota o envelope (`res.data.data`) — a tela consome as 5 listas
// direto.
async function listPaymentCashflowReportOptions(): Promise<PaymentCashflowReportOptions> {
  const { data } = await api.V2.get<Response<PaymentCashflowReportOptions>>(
    '/payment-cashflow-report/options'
  );
  return data.data;
}

export {
  downloadPaymentCashflowReportExcel,
  downloadPaymentCashflowReportPdf,
  listPaymentCashflowReportOptions,
  toPaymentCashflowReportParams,
};
