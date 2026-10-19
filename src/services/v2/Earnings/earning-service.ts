// src/services/v2/Earnings/earning-service.ts
// -----------------------------------------------------------------------------
// Earning Service — API v1 do backend Laravel GB.Cerne (Apuração Mensal —
// Administrativo, 97-Esteiras/002, Tarefas 07/08/09). Mirror estrutural de
// `requisition-service.ts`/`advance-service.ts` (adaptador de envelope
// paginado → `ResponsePagination`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /earnings                → data: EarningListItem[], meta paginação
//                                      REAL (filtros employee_uuid/
//                                      function_uuid/month/year, uuid exato)
//                                      — F-105 (UT-000731, branch irmã já
//                                      aprovada): reverte `GAP-EARNING-FE-02`
//                                      — lista o ROSTER de funcionários
//                                      elegíveis por vínculo no período, não
//                                      só os já lançados. Cada item vem em 2
//                                      formas (`EarningListItem`, ver
//                                      `@/@types/v2/Earnings`):
//                                        - APURADO: uuid/is_pay/total/
//                                          vl_account/vl_cheque preenchidos,
//                                          events:[...]
//                                        - A APURAR: uuid/is_pay/total/
//                                          vl_account/vl_cheque `null`,
//                                          events:[] — employee/function/
//                                          month/year/type do período do
//                                          filtro, sempre presentes
//   GET    /earnings/{employee_uuid} → data: EarningDetail — 404 ESPERADO
//                                      quando não existe apuração para o
//                                      período (não é erro de tela)
//   PUT    /earnings/{employee_uuid} → payload EarningUpsertPayload (upsert
//                                      único, sem POST separado)
//   DELETE /earnings/{employee_uuid} → 204, sem body
//   GET    /earnings/download        → binário (.xlsx modelo), sem envelope
//   POST   /earnings/import          → multipart, data: EarningImportResult
//   POST   /earnings/expenses        → payload {earning_uuids}, data:
//                                      EarningExpenseResult[]
//
// `getEarningForForm` — Armadilha 1 da Tarefa 08: o hook de form NÃO pode
// deixar o interceptor genérico converter o 404 (esperado) em toast de erro
// genérico. Esta função captura especificamente `status === 404` e resolve
// `null` (formulário em branco) em vez de deixar a exceção subir; qualquer
// outro status (401/403/500) continua propagando normalmente para o fluxo
// padrão de erro.
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  EarningDetail,
  EarningExpenseResult,
  EarningImportBatchFields,
  EarningImportResult,
  EarningListItem,
  EarningsListEnvelope,
  EarningTypeValue,
  EarningUpsertPayload,
} from '@/@types/v2/Earnings';

// Params aceitos pela listagem — mirror `EarningFilterData` (uuid exato,
// SEM busca textual — `GAP-EARNING-FE-02`).
export interface ListEarningsParams extends PaginationQueryParams {
  employee_uuid?: string;
  function_uuid?: string;
  month?: number;
  year?: number;
  /**
   * UT-000716 item 9 (complemento) — decisão do dono: filtro de Tipo passa
   * a filtrar de verdade; `EarningFilterData.php` (API) ganha `type` em
   * paralelo. Aditivo/opt-in — omitido preserva 100% o comportamento
   * anterior.
   */
  type?: EarningTypeValue;
}

async function listEarnings(
  params: ListEarningsParams
): Promise<ResponsePagination<EarningListItem[]>> {
  const { data } = await api.V2.get<EarningsListEnvelope>('/earnings', {
    page: params.page,
    per_page: params.per_page,
    employee_uuid: params.employee_uuid || undefined,
    function_uuid: params.function_uuid || undefined,
    month: params.month || undefined,
    year: params.year || undefined,
    type: params.type || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listRequisitions`/`listAdvances`.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export interface GetEarningParams {
  month: number;
  year: number;
  type?: string;
}

// `GET /earnings/{employee_uuid}` cru — propaga qualquer status (inclusive
// 404) para o caller. Usado pela tela de Detalhe (Tarefa 07), onde a linha
// só é alcançável a partir do índice (portanto sempre 200 ali).
async function getEarning(
  employeeUuid: string,
  params: GetEarningParams
): Promise<Response<EarningDetail>> {
  const { data } = await api.V2.get<Response<EarningDetail>>(`/earnings/${employeeUuid}`, {
    month: params.month,
    year: params.year,
    type: params.type || undefined,
  });
  return data;
}

// Variante para o FORMULÁRIO (Tarefa 08, Armadilha 1) — 404 é esperado
// (funcionário ainda sem apuração no período) e vira `null`, NUNCA uma
// exceção que o interceptor genérico converteria em toast de erro. Qualquer
// outro status (401/403/500) continua propagando normalmente.
async function getEarningForForm(
  employeeUuid: string,
  params: GetEarningParams
): Promise<EarningDetail | null> {
  try {
    const response = await getEarning(employeeUuid, params);
    return response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// `PUT /earnings/{employee_uuid}` — upsert único (sem `POST` separado,
// decisão do dono já ratificada em `GAP-EARNING-04`). Payload sempre FULL
// (nunca patch parcial).
async function upsertEarning(
  employeeUuid: string,
  params: GetEarningParams,
  payload: EarningUpsertPayload
): Promise<Response<EarningDetail>> {
  const { data } = await api.V2.put<Response<EarningDetail>>(`/earnings/${employeeUuid}`, payload, {
    params: { month: params.month, year: params.year, type: params.type || undefined },
  });
  return data;
}

// `DELETE /earnings/{employee_uuid}` — hard delete, guardado por corte de
// período (`GAP-EARNING-06`, dia 01 do mês anterior — DIFERENTE do corte de
// edição, dia 25). A mensagem de erro do servidor já é exibida pelo
// `useRequest` (toast automático) — não reimplementar a guarda no cliente.
async function deleteEarning(employeeUuid: string, params: GetEarningParams): Promise<void> {
  await api.V2.delete(`/earnings/${employeeUuid}`, {
    params: { month: params.month, year: params.year, type: params.type || undefined },
  });
}

// ---- Tarefa 09 — Importação/Exportação de planilha ------------------------

// `GET /earnings/download` — modelo de planilha (.xlsx), SEM gate de
// permissão granular (`GAP-EARNING-05` [AVALIADO], Opção B — preservar sem
// gate). Exceção ao envelope `ApiResponse` (resposta binária).
async function downloadEarningTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/earnings/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

// `POST /earnings/import` — multipart, campos globais de lote
// (mês/ano/tipo/centro/equipe/proprietário aplicados à planilha inteira,
// NÃO por linha). SEM gate de permissão granular (mesma decisão de
// `download`). Tudo-ou-nada: qualquer linha não resolvida aborta a
// importação inteira (422, nada persistido).
async function importEarnings(
  file: File,
  batchFields: EarningImportBatchFields
): Promise<Response<EarningImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('month', String(batchFields.month));
  fd.append('year', String(batchFields.year));
  if (batchFields.type) fd.append('type', batchFields.type);
  if (batchFields.center_uuid) fd.append('center_uuid', batchFields.center_uuid);
  if (batchFields.team_uuid) fd.append('team_uuid', batchFields.team_uuid);
  if (batchFields.proprietary_uuid) fd.append('proprietary_uuid', batchFields.proprietary_uuid);

  const { data } = await api.V2.post<Response<EarningImportResult>>('/earnings/import', fd);
  return data;
}

// `POST /earnings/expenses` — "Gerar Financeiro", gate `earnings_edit`
// (`GAP-EARNING-02` [AVALIADO], mandatório). Bulk action — 1 única chamada
// recebendo o array inteiro de uuids selecionados, nunca N requests.
async function generateEarningExpenses(
  earningUuids: string[]
): Promise<Response<EarningExpenseResult[]>> {
  const { data } = await api.V2.post<Response<EarningExpenseResult[]>>('/earnings/expenses', {
    earning_uuids: earningUuids,
  });
  return data;
}

export {
  deleteEarning,
  downloadEarningTemplate,
  generateEarningExpenses,
  getEarning,
  getEarningForForm,
  importEarnings,
  listEarnings,
  upsertEarning,
};
