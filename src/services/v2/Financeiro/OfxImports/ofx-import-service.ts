// src/services/v2/Financeiro/OfxImports/ofx-import-service.ts
// -----------------------------------------------------------------------------
// OfxImport Service — API v1 do backend Laravel GB.Cerne ("Importação OFX",
// F-114, 97-Esteiras/064, TASK-064-OFX-FE-01). Mirror estrutural de
// `services/v2/Movements/movement-service.ts` (mesmo domínio Financeiro,
// `farm.context` estrito, tenant-only) + `services/v2/Site/site-service.ts`
// (multipart com method-spoofing `_method=PUT`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /ofx-imports              → data: OfxImportListItem[], meta
//                                       paginação REAL (`code desc`).
//   GET    /ofx-imports/{uuid}       → data: OfxImportDetail (COM attachments[]).
//   POST   /ofx-imports              → multipart (description, account_uuid,
//                                       start_date, end_date, ofx_file).
//   PUT    /ofx-imports/{uuid}       → multipart via POST + `_method=PUT`
//                                       (method spoofing — Laravel não faz
//                                       parse nativo de multipart em PUT
//                                       verdadeiro, mirror `site-service.ts`).
//                                       `ofx_file` omitido preserva o anexo
//                                       atual (SE-02).
//   DELETE /ofx-imports/{uuid}       → 204.
//   GET    /ofx-imports/{uuid}/download → binário puro (Storage::download),
//                                       mirror `getExpenseReceipt`
//                                       (`responseType:'blob'`).
//   GET    /ofx-imports/report       → agregação mensal de
//                                       `Movement.is_reconciled=true`
//                                       (TASK-065-OFX-FE-03, "Meses
//                                       Conciliados") — `data:
//                                       OfxImportReportItem[]`, SEM `meta`
//                                       (não pagina), SEM parâmetro
//                                       (`OfxReportRequest::rules()` vazio),
//                                       permissão GENÉRICA `import_ofx`
//                                       (não as granulares view/create/edit/
//                                       delete). Ver `report.d.ts` para o
//                                       racional completo (substitui
//                                       `getOfxReport()`/`GET /ofx-report`
//                                       DELES, endpoint REMOVIDO no merge 065).
//
// GAP-OFX-FE-01 (CORE_WORKSPACE/04-Gaps_Frontend_UI/GAP-OFX-FE-01-*.md):
// `OfxImportRequest`/`OfxImportData` no backend exigem `account_id` (PK
// interna, integer) — o único lookup exposto ao front (`GET /accounts`,
// `AccountResource`) nunca expõe `id`, só `uuid`. Este service envia
// `account_uuid` (o valor real disponível no SPA, semanticamente correto,
// mirror da opção recomendada no Gap) — ATÉ O GAP SER RESOLVIDO, `create`/
// `update` respondem 422 (`account_id` ausente). SEM MOCK: não fabrico um
// `id` a partir do `uuid`. Listagem/filtro/detalhe/excluir/download NÃO são
// afetados (usam `account_uuid`, que `OfxImportIndexRequest`/
// `OfxImportResource` já tratam corretamente).
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`; este
// service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateOfxImportPayload,
  ListOfxImportsParams,
  OfxImportDetail,
  OfxImportForm,
  OfxImportListItem,
  OfxImportsListEnvelope,
  UpdateOfxImportPayload,
} from '@/@types/v2/Financeiro/ofxImport';
import type { OfxImportReportItem } from '@/@types/v2/Financeiro/ofxImport/report';

export type ListOfxImportsQuery = ListOfxImportsParams & PaginationQueryParams;

async function listOfxImports(
  params: ListOfxImportsQuery
): Promise<ResponsePagination<OfxImportListItem[]>> {
  const { data } = await api.V2.get<OfxImportsListEnvelope>('/ofx-imports', {
    page: params.page,
    per_page: params.per_page,
    description: params.description || undefined,
    account_uuid: params.account_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid),
  // mirror `listMovements`/`listAccounts`.
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

async function getOfxImport(ofxImportUuid: string) {
  const { data } = await api.V2.get<Response<OfxImportDetail>>(`/ofx-imports/${ofxImportUuid}`);
  return data;
}

// `buildOfxImportFormData` — monta o FormData comum ao create/update.
// `ofx_file` só é anexado quando presente (obrigatório na criação — validado
// pelo Yup antes do submit; ausente na edição preserva o anexo, SE-02).
function buildOfxImportFormData(
  payload: CreateOfxImportPayload | UpdateOfxImportPayload
): FormData {
  const fd = new FormData();
  fd.append('description', payload.description);
  fd.append('account_uuid', payload.account_uuid);
  fd.append('start_date', payload.start_date);
  fd.append('end_date', payload.end_date);
  if (payload.ofx_file) {
    fd.append('ofx_file', payload.ofx_file);
  }
  return fd;
}

async function createOfxImport(payload: CreateOfxImportPayload) {
  const fd = buildOfxImportFormData(payload);
  const { data } = await api.V2.post<Response<OfxImportDetail>>('/ofx-imports', fd);
  return data;
}

// PUT + multipart — method spoofing (`_method=PUT`), mirror `site-service.ts`
// (Laravel não faz parse nativo de `multipart/form-data` em PUT verdadeiro).
async function updateOfxImport(ofxImportUuid: string, payload: UpdateOfxImportPayload) {
  const fd = buildOfxImportFormData(payload);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<OfxImportDetail>>(
    `/ofx-imports/${ofxImportUuid}`,
    fd
  );
  return data;
}

async function deleteOfxImport(ofxImportUuid: string) {
  const { data } = await api.V2.delete(`/ofx-imports/${ofxImportUuid}`);
  return data;
}

// GET /ofx-imports/{uuid}/download — binário puro (Storage::download), SEM
// envelope ApiResponse, mirror `getExpenseReceipt`.
async function downloadOfxImportAttachment(ofxImportUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/ofx-imports/${ofxImportUuid}/download`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// GET /ofx-imports/report — agregação "Meses Conciliados" (TASK-065-OFX-FE-03).
// SEM query params (o backend não aceita nenhum, `OfxReportRequest::rules()`
// vazio) e SEM paginação (`meta: null`) — mirror `getOfxReconciliationPreview`
// (GET puro, sem efeito colateral, `report.d.ts`).
async function getOfxImportsReport() {
  const { data } = await api.V2.get<Response<OfxImportReportItem[]>>('/ofx-imports/report');
  return data;
}

// -----------------------------------------------------------------------------
// tryPersistOfxImport — função PURA (Lei 3) chamada pela mutation de
// `CreateOrUpdateOfxImport.tsx`. Monta o payload a partir do `OfxImportForm`
// (RHF) e decide create/update pelo `isEditing` recebido — mirror
// `tryPersistAccount` (`account-service.ts`).
// -----------------------------------------------------------------------------

export interface TryPersistOfxImportParams {
  data: OfxImportForm;
  isEditing: boolean;
  ofxImportUuid?: string;
}

async function tryPersistOfxImport({ data, isEditing, ofxImportUuid }: TryPersistOfxImportParams) {
  const payload = {
    description: data.description.trim(),
    account_uuid: data.account_uuid?.value ?? '',
    start_date: data.start_date,
    end_date: data.end_date,
    ofx_file: data.ofx_file ?? undefined,
  };

  if (isEditing && ofxImportUuid) {
    return await updateOfxImport(ofxImportUuid, payload);
  }
  return await createOfxImport(payload as CreateOfxImportPayload);
}

export {
  createOfxImport,
  deleteOfxImport,
  downloadOfxImportAttachment,
  getOfxImport,
  getOfxImportsReport,
  listOfxImports,
  tryPersistOfxImport,
  updateOfxImport,
};
