// src/services/v2/Relatorios/savings-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Savings" (F-319, execução 97-Esteiras/013, TASK-013-F319-FE-01/
// 02). Mirror ESTRUTURAL de `stock-movement-report-service.ts` — `toQuery`
// como WHITELIST EXPLÍCITA (nunca `{ ...params }`, mirror PROIBIDO de
// `logged-hours-report-service.ts:30,43`), 2 downloads binários síncronos +
// 1 lookup de opções.
//
// Endpoints (PROPOSTO pelo plano da camada api, `fid-g3f-savings.md §3
// P-01/P-06` — ainda não `CONTRATO_AUTOAPROVADO` no momento desta escrita;
// reconciliar contra o contrato selado antes do handover ao Tester):
//   GET /request-quotations/savings-report/options (JSON, envelope ApiResponse)
//   GET /request-quotations/savings-report        (PDF,  responseType:'blob')
//   GET /request-quotations/savings-report/excel   (XLSX, responseType:'blob')
//
// `farm_uuid` é o ÚNICO nome de parâmetro de fazenda (singular, array de
// uuid) — NÃO `farm_uuids`. Sem `X-Farm-Id`/`farm_id` no payload — a fazenda
// ATIVA vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`).
//
// `toSavingsReportParams()` é a FRONTEIRA OBRIGATÓRIA valores→payload
// (`DEC-FE-02`, `fid-g3f-savings.md §5 D-11/D-12`): monta as 4 chaves campo a
// campo — `values.user_id` é DELIBERADAMENTE ignorado. PROIBIDO `{
// ...values }`, spread parcial, `delete`, `omit(values, [...])`. É a única
// fronteira permitida entre `SavingsReportFormValues` (5 campos) e
// `SavingsReportParams` (4 chaves) — a página NUNCA remonta chaves inline.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  SavingsReportFormValues,
  SavingsReportOptions,
  SavingsReportParams,
} from '@/@types/v2/Relatorios/savings';

function toSavingsReportParams(values: SavingsReportFormValues): SavingsReportParams {
  return {
    farm_uuid: values.farm_uuid,
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    status: values.status?.value ?? undefined,
  };
}

// Segunda barreira (`fid-g3f-savings.md §5 D-12`, regra 4 da fronteira) —
// whitelist explícita, NUNCA `{ ...params }`: garante que nenhuma chave
// indeclarada (ex.: um futuro `user_id`/parâmetro de responsável colado sem
// passar por `toSavingsReportParams`) sobreviva a um refactor.
function toQuery(params: SavingsReportParams) {
  return {
    // Array serializado pelo axios como `farm_uuid[]=<uuid>&farm_uuid[]=...`
    // (mirror `product_uuids`/`client_ids` dos irmãos — a chave NÃO leva
    // colchetes aqui, o axios adiciona `[]` na query string final).
    farm_uuid: params.farm_uuid,
    start_date: params.start_date,
    end_date: params.end_date,
    status: params.status ?? undefined,
  };
}

async function getSavingsReportOptions(): Promise<Response<SavingsReportOptions>> {
  const { data } = await api.V2.get<Response<SavingsReportOptions>>(
    '/request-quotations/savings-report/options'
  );
  return data;
}

async function downloadSavingsReportPdf(params: SavingsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/request-quotations/savings-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadSavingsReportExcel(params: SavingsReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/request-quotations/savings-report/excel',
    toQuery(params),
    { responseType: 'blob' }
  );
  return data;
}

export {
  downloadSavingsReportExcel,
  downloadSavingsReportPdf,
  getSavingsReportOptions,
  toSavingsReportParams,
};
