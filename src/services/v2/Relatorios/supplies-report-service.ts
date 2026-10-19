// src/services/v2/Relatorios/supplies-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Suprimentos" (F-325, `SuppliesReportController`, execução
// CORE_WORKSPACE/97-Esteiras/015, Tarefa 52). Mirror ESTRUTURAL de
// `request-purchase-management-report-service.ts` (`toQuery` compartilhado
// pelas 2 rotas de download, retorno do `/options` DESEMPACOTADO — `Response<T>
// → T`) + `savings-report-service.ts` (boundary `toXxxParams()` nomeada e
// exportada, ÚNICA fronteira permitida entre form values e payload).
//
// Endpoints (camada api 100% entregue/aprovada, Tarefa 54 backend,
// `CONTRATO_AUTOAPROVADO` — `fid-g3a-suprimentos-relatorio.md`):
//   GET /request-purchases/supplies-report/options  (envelope ApiResponse)
//   GET /request-purchases/supplies-report          (PDF,   responseType:'blob',
//     `GbCerneSnappyReport::inline(...)` — NUNCA `downloadBlob` no componente)
//   GET /request-purchases/supplies-report/excel     (Excel, responseType:'blob',
//     `GbCerneReportExcel::download(...)`)
//
// Os 8 filtros são TODOS opcionais — `toSuppliesReportParams()` normaliza
// string vazia/`0`/`undefined` para `undefined` campo a campo (nenhum spread
// inline, mirror `toSavingsReportParams`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  SuppliesReportFormValues,
  SuppliesReportOptionsData,
  SuppliesReportParams,
} from '@/@types/v2/Relatorios/suppliesReport';

// Boundary form → payload — ÚNICA fronteira permitida (mirror `toSavingsReportParams`).
// A página NUNCA remonta chaves inline.
export function toSuppliesReportParams(values: SuppliesReportFormValues): SuppliesReportParams {
  return {
    farm_uuid: values.farm_uuid?.value || undefined,
    user_uuid: values.user_uuid?.value || undefined,
    authorizer_uuid: values.authorizer_uuid?.value || undefined,
    status: values.status?.value ?? undefined,
    priority: values.priority?.value ?? undefined,
    number: values.number || undefined,
    start_date: values.start_date || undefined,
    end_date: values.end_date || undefined,
  };
}

// Segunda barreira — whitelist explícita da querystring, NUNCA `{ ...params }`
// (mirror `toQuery` de `request-purchase-management-report-service.ts`).
function toQuery(params: SuppliesReportParams) {
  return {
    farm_uuid: params.farm_uuid,
    user_uuid: params.user_uuid,
    authorizer_uuid: params.authorizer_uuid,
    status: params.status,
    priority: params.priority,
    number: params.number,
    start_date: params.start_date,
    end_date: params.end_date,
  };
}

// Retorno DESEMPACOTADO (Response<T> → T), mirror
// `getRequestPurchaseManagementReportOptions` — `optionsQuery.data?.farms`,
// NÃO `.data?.data.farms` (esse 2º padrão é de `getSavingsReportOptions`, os
// 2 convivem no fork).
export async function getSuppliesReportOptions(): Promise<SuppliesReportOptionsData> {
  const { data } = await api.V2.get<Response<SuppliesReportOptionsData>>(
    '/request-purchases/supplies-report/options'
  );
  return data.data;
}

export async function downloadSuppliesReportPdf(params: SuppliesReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/request-purchases/supplies-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export async function downloadSuppliesReportExcel(params: SuppliesReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/request-purchases/supplies-report/excel',
    toQuery(params),
    { responseType: 'blob' }
  );
  return data;
}
