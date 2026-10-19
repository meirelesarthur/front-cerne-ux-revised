// src/services/v2/Carregamentos/charge-service.ts
// -----------------------------------------------------------------------------
// Charge Service — API v1 do backend Laravel GB.Cerne (`/charges*`),
// TASK-FE-CG-01 (fundação).
//
// Envelope paginado — mesma divergência já documentada em
// `transfer-service.ts`: a API devolve `{ data: [array plano], meta: {
// current_page, last_page, per_page, total, from, to, links } }`
// (`ApiResponse::paginated`), mas o `useCustomGridQuery` espera
// `ResponsePagination<T>` = `{ data: { items, pagination: { total, count,
// per_page, current_page, total_pages } } }`. A adaptação abaixo é
// responsabilidade DESTE service — molde literal `transfer-service.ts`.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
//
// `finish`/`transfer`/`documents`/`storeDocuments` (mesmo arquivo, convenção
// já usada no backend `ChargeController`) são ADICIONADOS aqui pelas
// Tarefas `TASK-FE-CG-05`/`06` — NÃO duplicar este arquivo do zero.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ChargeDetail,
  ChargeDocumentItem,
  ChargeDocumentPayloadItem,
  ChargeFilterRequest,
  ChargeListItem,
  ChargesListEnvelope,
  ChargeTransferDraft,
  CreateChargeRequest,
  FinishChargePayload,
  UpdateChargeRequest,
} from '@/@types/v2/Carregamentos';

// Params aceitos por `GET /charges` — paginação padrão + `ChargeFilterRequest`
// (7 filtros do drawer, `ChargeIndexRequest::rules()`).
export interface ListChargesParams extends PaginationQueryParams, ChargeFilterRequest {}

async function listCharges(
  params: ListChargesParams
): Promise<ResponsePagination<ChargeListItem[]>> {
  const { data } = await api.V2.get<ChargesListEnvelope>('/charges', {
    page: params.page,
    per_page: params.per_page,
    client_uuid: params.client_uuid || undefined,
    user_uuid: params.user_uuid || undefined,
    product_uuid: params.product_uuid || undefined,
    area_uuid: params.area_uuid || undefined,
    status: params.status || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listTransfers`/`listTeams`.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getCharge(uuid: string): Promise<Response<ChargeDetail>> {
  const { data } = await api.V2.get<Response<ChargeDetail>>(`/charges/${uuid}`);
  return data;
}

async function createCharge(payload: CreateChargeRequest): Promise<Response<ChargeDetail>> {
  const { data } = await api.V2.post<Response<ChargeDetail>>('/charges', payload);
  return data;
}

async function updateCharge(
  uuid: string,
  payload: UpdateChargeRequest
): Promise<Response<ChargeDetail>> {
  const { data } = await api.V2.put<Response<ChargeDetail>>(`/charges/${uuid}`, payload);
  return data;
}

// `DELETE /charges/{uuid}` — 204 SEM envelope (mirror `deleteTransfer`). Não
// ler `data.message` da resposta; a mensagem de sucesso é da tela (i18n).
async function deleteCharge(uuid: string): Promise<void> {
  await api.V2.delete(`/charges/${uuid}`);
}

// -----------------------------------------------------------------------------
// TASK-FE-CG-05 — `finish`/`transfer` (2 fluxos de estado sem tela própria na
// API, gate `charge_edit` para os dois — decisão a do dono, já fechada na
// camada `api`).
// -----------------------------------------------------------------------------

// `PUT /charges/{uuid}/finish` — verbo REAL confirmado em `routes/api.php`
// (`Route::put('charges/{uuid}/finish', ...)`), NÃO `POST` (divergência da
// Leitura do dev da Tarefa — precedência `código real > ficha`).
async function finishCharge(
  uuid: string,
  payload: FinishChargePayload
): Promise<Response<ChargeDetail>> {
  const { data } = await api.V2.put<Response<ChargeDetail>>(`/charges/${uuid}/finish`, payload);
  return data;
}

// `POST /charges/{uuid}/transfer` — corpo VAZIO (`ChargeTransferRequest`
// não declara nenhum campo, só gate de autorização); a Action é LEITURA PURA
// (`BuildChargeTransferDraftAction`, sem `DB::transaction()`/`save()`) —
// NUNCA persiste um `Transfer` de verdade (decisão d1 do dono, já fechada).
async function buildChargeTransferDraft(uuid: string): Promise<Response<ChargeTransferDraft>> {
  const { data } = await api.V2.post<Response<ChargeTransferDraft>>(
    `/charges/${uuid}/transfer`,
    {}
  );
  return data;
}

// -----------------------------------------------------------------------------
// TASK-FE-CG-06 — Documentos (anexos PDF), diff único por `document_uuid`
// (`ChargeDocumentRequest`/`ChargeDocumentItemData` reais, `GB.Cerne.Api`).
// Endpoint de leitura DEDICADO (`GET .../documents`) — diferente de
// `MovementSale`, que reusa o detalhe (§ ver docblock de topo de
// `ChargeDocumentsModal.tsx`). Mirror parcial `buildMovementSaleDocumentsFormData`,
// mas contrato PRÓPRIO (`document_uuid`, não `old_document_uuid`).
//
// **Resolução real do "diff vazio via multipart"** (achado B de
// `MovementSaleDocumentsModal.tsx`, que BLOQUEIA o Salvar com 0 linhas por
// não existir forma de o `FormData` representar `documents:[]`): aqui o
// corpo só PRECISA ser multipart quando alguma linha carrega um `File` novo
// (upload binário real). Sem nenhum `File` no diff — inclusive 0 linhas, ou
// linhas só reafirmando `description`/`date` de anexos já persistidos — o
// MESMO payload viaja como JSON puro (`{documents:[...]}`, Content-Type
// aplicado automaticamente pelo axios para um objeto plano). Laravel lê os
// dois wire-formats de forma idêntica na camada de validação
// (`ChargeDocumentRequest::rules()` não distingue JSON de multipart) — a
// regra do servidor (`'documents' => ['present','array']`) passa a ser
// satisfeita de verdade com `[]`, sem sentinela nem relaxamento de contrato.
// -----------------------------------------------------------------------------

async function listChargeDocuments(uuid: string): Promise<Response<ChargeDocumentItem[]>> {
  const { data } = await api.V2.get<Response<ChargeDocumentItem[]>>(`/charges/${uuid}/documents`);
  return data;
}

function buildChargeDocumentsFormData(documents: ChargeDocumentPayloadItem[]): FormData {
  const fd = new FormData();

  documents.forEach((row, index) => {
    if (row.document_uuid) {
      fd.append(`documents[${index}][document_uuid]`, row.document_uuid);
    }
    fd.append(`documents[${index}][description]`, row.description);
    if (row.date) fd.append(`documents[${index}][date]`, row.date);
    if (row.file) fd.append(`documents[${index}][file]`, row.file);
  });

  return fd;
}

async function syncChargeDocuments(
  uuid: string,
  documents: ChargeDocumentPayloadItem[]
): Promise<Response<ChargeDocumentItem[]>> {
  // Só precisa de multipart quando existe upload binário de verdade nesta
  // submissão — ver docblock acima (resolução real do diff vazio).
  const hasFileUpload = documents.some((row) => row.file instanceof File);

  const body = hasFileUpload
    ? buildChargeDocumentsFormData(documents)
    : {
        documents: documents.map((row) => ({
          document_uuid: row.document_uuid ?? undefined,
          description: row.description,
          date: row.date ?? undefined,
        })),
      };

  const { data } = await api.V2.post<Response<ChargeDocumentItem[]>>(
    `/charges/${uuid}/documents`,
    body
  );
  return data;
}

export {
  buildChargeDocumentsFormData,
  buildChargeTransferDraft,
  createCharge,
  deleteCharge,
  finishCharge,
  getCharge,
  listCharges,
  listChargeDocuments,
  syncChargeDocuments,
  updateCharge,
};
