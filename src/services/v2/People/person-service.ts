// src/services/v2/People/person-service.ts
// -----------------------------------------------------------------------------
// Person Service — API v1 do backend Laravel GB.Cerne (Pessoas Unificado).
// Mirror de `services/v2/PaymentTerms/payment-term-service.ts`, com 2
// diferenças centrais:
//   - `getPersonByNif` trata 404 como retorno `null` (NIF novo — não é erro).
//   - `createPerson` devolve também `created: boolean` (HTTP 201 vs 200 —
//     RN-02, upsert por NIF) para o submit do formulário poder diferenciar o
//     toast de sucesso ("Pessoa criada" vs "Pessoa já cadastrada — dados
//     atualizados"), já que o envelope `ApiResponse` não carrega esse sinal
//     no corpo JSON (só no status code).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /people            → data: PersonListItem[], meta REAL (default
//                                10 — TASK-BE-330 concluído).
//   GET    /people/{uuid}     → data: PersonDetail.
//   GET    /people/by-nif/{nif} → data: PersonListItem | 404 (novo → null).
//   POST   /people            → payload PersonPayload — 201 (criou) | 200
//                                (upsert por nif já existente, RN-02).
//   PUT    /people/{uuid}     → payload PersonPayload (sometimes nos campos
//                                raiz; blocos de papel ausentes preservam o
//                                papel já ativo, RN-04).
//   DELETE /people/{uuid}     → 204, sempre soft-delete incondicional (sem
//                                guarda de bloqueio/vínculo, contrato §12).
//
// `X-Farm-Id` ESTRITO (farm.context, sem bypass) — o interceptor global de
// `services/api.ts` já anexa o header quando há fazenda ativa; nenhuma ação
// extra aqui.
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  PeopleListEnvelope,
  PersonDetail,
  PersonListItem,
  PersonPayload,
} from '@/@types/v2/People';

export interface ListPeopleParams extends PaginationQueryParams {
  search?: string;
  entity?: string;
}

async function listPeople(params: ListPeopleParams): Promise<ResponsePagination<PersonListItem[]>> {
  const { data } = await api.V2.get<PeopleListEnvelope>('/people', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    entity: params.entity || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // meta REAL (`per_page` default 10, TASK-BE-330), mesmo adaptador de
  // listPaymentTerms/listBanks/listRoles.
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

async function getPersonByUuid(personUuid: string) {
  const { data } = await api.V2.get<Response<PersonDetail>>(`/people/${personUuid}`);
  return data;
}

// Busca por NIF — SOB DEMANDA (não é `useQuery` automático, ver
// `usePeople.tsx`). 404 é o caso esperado de "NIF novo" — devolve `null` em
// vez de propagar como erro genérico. Qualquer outro erro (network/5xx) é
// repropagado normalmente.
async function getPersonByNif(nif: string): Promise<PersonListItem | null> {
  try {
    const { data } = await api.V2.get<Response<PersonListItem>>(
      `/people/by-nif/${encodeURIComponent(nif)}`
    );
    return data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function deletePerson(personUuid: string) {
  const { data } = await api.V2.delete(`/people/${personUuid}`);
  return data;
}

// `created` — `true` quando o backend respondeu 201 (Pessoa nova); `false`
// quando respondeu 200 (RN-02 — upsert por NIF já existente, dados
// atualizados). O envelope `ApiResponse` não carrega esse sinal no corpo, só
// no HTTP status — por isso lê-se `status` da resposta axios diretamente
// (não `data.statusCode`, que não é populado pelo backend real).
async function createPerson(
  payload: PersonPayload
): Promise<{ data: PersonDetail; created: boolean }> {
  const response = await api.V2.post<Response<PersonDetail>>('/people', payload);
  return { data: response.data.data, created: response.status === 201 };
}

async function updatePerson(personUuid: string, payload: PersonPayload) {
  const { data } = await api.V2.put<Response<PersonDetail>>(`/people/${personUuid}`, payload);
  return data;
}

export { createPerson, deletePerson, getPersonByNif, getPersonByUuid, listPeople, updatePerson };
