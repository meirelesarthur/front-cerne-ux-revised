// src/services/v2/BaseRegistrations/birthNote-service.ts
// -----------------------------------------------------------------------------
// Birth Note Service — API v1 do backend Laravel GB.Cerne (Observação
// Nascimento). TASK-FE-100 (fundação de dados, sem UI).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /birth-notes            → data: BirthNoteListItem[], meta REAL
//                                     (paginação Laravel, `ApiResponse::paginated`,
//                                     10/página default, teto 100, ordenado por
//                                     `description` asc)
//   GET    /birth-notes/{uuid}     → data: BirthNoteData
//   POST   /birth-notes            → payload BirthNotePayload (create)
//   PUT    /birth-notes/{uuid}     → payload BirthNotePayload (update — SEMPRE
//                                     os 2 campos, nunca delta)
//   DELETE /birth-notes/{uuid}     → 204 SEMPRE que o uuid existir — SEM guarda
//                                     de FK (D6 do contrato de API, §6)
//
// `listBirthNotes` ADAPTA o envelope `ApiResponse::paginated` (meta REAL) para
// o shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo
// adaptador estrutural de `listIdentificationTypes`/`listStates` (lê
// `data.meta.*` de verdade). NÃO fabrica 1 única página a partir do array
// inteiro (comportamento fake de `listDiagnosticTechniques` — este módulo
// pagina de verdade, diferença crítica documentada em TASK-FE-100).
//
// Catálogo GLOBAL — nunca enviar `X-Farm-Id` manualmente (o interceptor
// genérico do `api.ts` anexa o header automaticamente se houver fazenda
// selecionada; o backend simplesmente ignora para este recurso, a rota não
// está no grupo `farm.context`).
//
// Filtro suportado pelo backend: `search` (CONSUMIDO pela UI, drawer de
// filtro TASK-FE-101) — `is_enabled` também aditivo mas NÃO consumido nesta
// rodada (mesma decisão de fidelidade de `IdentificationType`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BirthNoteData,
  BirthNoteFilterForm,
  BirthNoteListItem,
  BirthNoteOptionItem,
  BirthNoteOptionsListEnvelope,
  BirthNotePayload,
  BirthNotesListEnvelope,
} from '@/@types/v2/BaseRegistrations/birthNote';

// Params aceitos pela listagem — paginação real (`page`/`per_page`) + filtro
// `search` (único filtro consumido pela UI, TASK-FE-101).
export interface ListBirthNotesParams extends PaginationQueryParams, BirthNoteFilterForm {}

async function listBirthNotes(
  params: ListBirthNotesParams
): Promise<ResponsePagination<BirthNoteListItem[]>> {
  const { data } = await api.V2.get<BirthNotesListEnvelope>('/birth-notes', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listIdentificationTypes/listStates), NÃO fabrica mais
  // 1 página só a partir do array inteiro.
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

async function getBirthNoteByUuid(birthNoteUuid: string) {
  const { data } = await api.V2.get<Response<BirthNoteData>>(`/birth-notes/${birthNoteUuid}`);
  return data;
}

async function createBirthNote(payload: BirthNotePayload) {
  const { data } = await api.V2.post<Response<BirthNoteData>>('/birth-notes', payload);
  return data;
}

// Payload SEMPRE completo — description/is_enabled são `required` nos dois
// verbos (`BirthNoteRequest::rules()` não diferencia por verbo), mesmo
// racional de updateIdentificationType (full-resource-replace).
async function updateBirthNote(birthNoteUuid: string, payload: BirthNotePayload) {
  const { data } = await api.V2.put<Response<BirthNoteData>>(
    `/birth-notes/${birthNoteUuid}`,
    payload
  );
  return data;
}

// 204 SEMPRE que o uuid existir — sem guarda de FK (D6 do contrato de API,
// §6). Diferente de `deleteIdentificationType`/`deleteVaccine`, nenhum
// tratamento especial de 422 "em uso" é necessário aqui.
async function deleteBirthNote(birthNoteUuid: string) {
  const { data } = await api.V2.delete(`/birth-notes/${birthNoteUuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /birth-notes/options (UT-000729, correção) — lookup ENXUTO para o
// `SelectAsyncPaginate` de `birth_note_uuid` no form de Nascimento de Animais
// (e demais forms que consumirem Observação de Nascimento como lookup), SEM
// gate de `permission:birth_note_view` — quem cria Nascimento sem essa
// permissão (gestão de Observação de Nascimento) recebia 403 em
// `listBirthNotes` (`GET /birth-notes`) e o select ficava vazio. Decisão do
// dono: a listagem do select não deve depender das permissões de birth_note.
// Mirror EXATO de `listEmployeeOptions` (FLAT — a resposta NÃO é paginada,
// `ApiResponse::success`, `meta: null` sempre). `listBirthNotes` (index)
// permanece INTACTO — a tela de GESTÃO (`BaseRegistrations/BirthNotes`)
// continua usando ele, pois lá o gate de permissão é correto.
// -----------------------------------------------------------------------------
export interface ListBirthNoteOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listBirthNoteOptions(
  params: ListBirthNoteOptionsParams
): Promise<ResponsePagination<BirthNoteOptionItem[]>> {
  const { data } = await api.V2.get<BirthNoteOptionsListEnvelope>('/birth-notes/options', {
    search: params.search || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export {
  createBirthNote,
  deleteBirthNote,
  getBirthNoteByUuid,
  listBirthNoteOptions,
  listBirthNotes,
  updateBirthNote,
};
