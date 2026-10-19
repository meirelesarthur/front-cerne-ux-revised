// src/services/v2/Banks/bank-service.ts
// -----------------------------------------------------------------------------
// Bank Service — API v1 do backend Laravel GB.Cerne (Bancos, dado mestre
// GLOBAL — catálogo de instituições financeiras, seed FEBRABAN).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /banks          → data: BankListItem[], meta com paginação REAL
//                             (TASK-BANK-API-PAG ✅ CONCLUÍDO —
//                             `BankRepository::listWithFilters()` agora usa
//                             `LengthAwarePaginator` de verdade, com
//                             `search`/`page`/`per_page` consumidos pelo
//                             backend). `listBanks` usa o MESMO adaptador de
//                             `listProductGroups`/`listBreeds` (meta real),
//                             NÃO mais o de `listSpecies` (página única —
//                             obsoleto desde TASK-BANK-FE-03). Busca por
//                             code/name é 100% SERVER-SIDE (ver
//                             Bancos/index.tsx, debounce local ~400ms antes de
//                             disparar `search`).
//   GET    /banks/{uuid}   → data: BankDetail (mesmo Resource do index)
//   POST   /banks          → payload BankPayload (create)
//   PUT    /banks/{uuid}   → payload BankPayload — SEMPRE completo
//                             (`BankRequest::rules()` exige `code`+`name` em
//                             ambos os verbos, full-resource-replace, sem
//                             PATCH parcial) — nunca `Partial<BankPayload>`.
//   DELETE /banks/{uuid}   → 204; SEM guarda de FK em `DeleteBankAction`
//                             (existe FK física real `providers.bank_id`) —
//                             hoje pode surfacear um 500 genérico, não um 422
//                             estruturado. `onError` NÃO customizado aqui —
//                             usa o tratamento genérico interno do
//                             `useRequest` (lê `message`/`error` do envelope,
//                             qualquer que seja), sem fabricar uma mensagem de
//                             negócio ("banco em uso") que o backend hoje não
//                             produz.
//
// Rota GLOBAL — SEM header `X-Farm-Id` no contrato (fora de farm.context no
// backend). O client `api.V2` anexa `X-Farm-Id` automaticamente a TODA
// requisição quando há fazenda ativa em `localStorage` (interceptor genérico
// de `src/services/api.ts`, sem mecanismo de opt-out por request hoje) — o
// backend simplesmente não exige/consome esse header nesta rota, então o
// header (se presente) é inofensivo e ignorado. Nenhum código deste serviço
// depende dele.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BankDetail,
  BankListItem,
  BankOptionItem,
  BankOptionsListEnvelope,
  BankPayload,
  BanksListEnvelope,
} from '@/@types/v2/Banks';

// Estende `PaginationQueryParams` — `search`/`page`/`per_page` agora são
// CONSUMIDOS de verdade pelo backend (TASK-BANK-API-PAG ✅ CONCLUÍDO), ao
// contrário do comentário anterior (Achado #1 de TASK-BANK-FE-01, agora
// obsoleto).
export interface ListBanksParams extends PaginationQueryParams {
  search?: string;
}

async function listBanks(params: ListBanksParams): Promise<ResponsePagination<BankListItem[]>> {
  const { data } = await api.V2.get<BanksListEnvelope>('/banks', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // meta REAL (idêntico a listProductGroups/listBreeds), NÃO mais o fallback
  // de página única.
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

async function deleteBank(bankUuid: string) {
  const { data } = await api.V2.delete(`/banks/${bankUuid}`);
  return data;
}

async function getBankByUuid(bankUuid: string) {
  const { data } = await api.V2.get<Response<BankDetail>>(`/banks/${bankUuid}`);
  return data;
}

async function createBank(payload: BankPayload) {
  const { data } = await api.V2.post<Response<BankDetail>>('/banks', payload);
  return data;
}

// UPDATE recebe o payload COMPLETO — `BankRequest::rules()` exige `code`+
// `name` em ambos os verbos (full-resource-replace, confirmado por leitura
// direta). Nunca enviar `Partial<BankPayload>` aqui.
async function updateBank(bankUuid: string, payload: BankPayload) {
  const { data } = await api.V2.put<Response<BankDetail>>(`/banks/${bankUuid}`, payload);
  return data;
}

// GET /banks/options — lookup ENXUTO (GAP-BE-040 addendum, TASK-BE-356),
// SEM gate de `banks_view` (só `auth:sanctum`, herdado do grupo global de
// rota). Alimenta o Select "Banco" das etapas Funcionário/Fornecedor do
// wizard de Pessoas (TASK-FE-332) — usuários sem `banks_view` (ex.: só
// `people_create`/`people_edit`) continuam sem acessar o CRUD completo de
// Bancos, mas conseguem escolher um Banco ao criar/editar Pessoa. MESMO
// adaptador de `listBanks` (ResponsePagination) — só a rota e o Resource
// (`BankOptionResource`, `uuid`+`code`+`name`, SEM o `info` composto)
// mudam. `listBanks` (sobre `/banks`, gated) CONTINUA existindo — usada
// por `Bancos/index.tsx`, fora de escopo aqui.
async function listBankOptions(
  params: Pick<ListBanksParams, 'search' | 'per_page' | 'page'>
): Promise<ResponsePagination<BankOptionItem[]>> {
  const { data } = await api.V2.get<BankOptionsListEnvelope>('/banks/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

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

export { createBank, deleteBank, getBankByUuid, listBankOptions, listBanks, updateBank };
