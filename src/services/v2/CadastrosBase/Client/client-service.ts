// src/services/v2/CadastrosBase/Client/client-service.ts
// -----------------------------------------------------------------------------
// Client Service — API v1 do backend Laravel GB.Cerne ("Clientes").
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (TASK-CL-FE-01/02/03) — a fachada
// dedicada `/api/v1/clients` ainda NÃO existe (Arquiteto de API formalizando
// em paralelo; tracker.md mostra o módulo `Client` em estágio BRUTO). Este
// service aponta para as rotas REAIS esperadas (`/clients`), SEM MOCK —
// nenhuma resposta é inventada; a fiação/E2E real fica para quando o
// endpoint existir. CÓDIGO-INCOMPLETO / sujeito a reconciliação quando
// `Client-contrato.md` fechar — reconfirmar contra
// `app/Http/Controllers/Api/V1/ClientController.php` real quando existir.
//
// Client é um PAPEL de Person (mesma independência arquitetural de
// `ProprietaryRequest`/`ProviderRequest`, "não estende `PersonRequest` por
// herança") — este service NÃO importa nada de `@/services/v2/People`
// (grep confirma), mesmo padrão de `proprietary-service.ts`/
// `provider-service.ts`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /clients          → data: ClientListItem[], meta paginação REAL
//                               (mesmo adaptador de listProprietaries/
//                               listProviders). Filtros server-side:
//                               search/is_enabled.
//   GET    /clients/{uuid}   → data: ClientDetail — `{uuid}` é o uuid do
//                               PAPEL Client, NÃO o da Person.
//   POST   /clients          → payload CreateClientRequest; `is_enabled`
//                               AGORA enviado pelo cliente (AJUSTE DE
//                               HOMOLOGAÇÃO 2026-07-30 — campo `Switch`
//                               obrigatório no form, diverge do mirror
//                               original Proprietary/Provider; reconfirmar
//                               contra `ClientController` real).
//   PUT    /clients/{uuid}   → payload UpdateClientRequest — campos raiz
//                               SEMPRE completos (mesmo padrão
//                               `$rootDefaults` de `PersonController::update()`).
//   DELETE /clients/{uuid}   → 204; HARD-DELETE FÍSICO por DEFAULT (evidência
//                               real do legado: `app/Client.php` sem
//                               `SoftDeletes`, `ClientController::destroy()`
//                               chama `$item->delete()`) — guarda 422
//                               `errors.in_use[]` (`ClientInUseError`) quando
//                               há dependentes; nunca 500. FORK DEPENDENTE DO
//                               CONTRATO — se a fachada dedicada fechar por
//                               SOFT-delete via `is_enabled` (como
//                               `Provider`), esta função muda em
//                               `TASK-CL-FE-02`.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts` quando há
// fazenda ativa; este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

import { normalizeDocument } from '@/utils/masks/document';

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ClientByNifDetail,
  ClientDetail,
  ClientListItem,
  ClientsListEnvelope,
  CreateClientRequest,
  UpdateClientRequest,
} from '@/@types/v2/CadastrosBase/client';

export interface ListClientsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: boolean;
}

async function listClients(
  params: ListClientsParams
): Promise<ResponsePagination<ClientListItem[]>> {
  const { data } = await api.V2.get<ClientsListEnvelope>('/clients', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listProprietaries/listProviders (meta REAL, vem do
  // backend: current_page/last_page/per_page/total).
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

// `{uuid}` é o uuid do CLIENT (papel) — NUNCA o uuid da Person.
async function getClientByUuid(clientUuid: string) {
  const { data } = await api.V2.get<Response<ClientDetail>>(`/clients/${clientUuid}`);
  return data;
}

// GET /clients/by-nif/{nif} (UT-000740) — prefill do Novo Cliente com Pessoa +
// papel Client (se já existir nesta fazenda/tenant, `uuid` não-null). O NIF
// vai SOMENTE com dígitos no path (a `/` da máscara de CNPJ quebra a rota).
// 404 = Pessoa inexistente → `null`; demais erros são repropagados.
async function getClientByNif(nif: string): Promise<ClientByNifDetail | null> {
  const digits = normalizeDocument(nif);
  try {
    const { data } = await api.V2.get<Response<ClientByNifDetail>>(`/clients/by-nif/${digits}`);
    return data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function createClient(payload: CreateClientRequest) {
  const { data } = await api.V2.post<Response<ClientDetail>>('/clients', payload);
  return data;
}

// Payload de update mantém os campos raiz SEMPRE completos (mesmo padrão
// `$rootDefaults` de `PersonController::update()`) — nunca
// `Partial<CreateClientRequest>` inteiro.
async function updateClient(clientUuid: string, payload: UpdateClientRequest) {
  const { data } = await api.V2.put<Response<ClientDetail>>(`/clients/${clientUuid}`, payload);
  return data;
}

// HARD-DELETE FÍSICO por DEFAULT (fork dependente do contrato, ver nota de
// cabeçalho) — a API responde 204 (limpo) ou 422 com `errors.in_use[]`
// (`ClientInUseError`) quando há dependentes reais; nunca 500.
async function deleteClient(clientUuid: string) {
  const { data } = await api.V2.delete(`/clients/${clientUuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /clients/options (LAC-FE-02, TASK-050-271-FE-01, esteira 97-Esteiras/050)
// — lookup ENXUTO para o `CheckboxListField` "Clientes" das telas F-271 (C. a
// Receber) e F-292 (C. Recebidas, reusa esta MESMA função). Rota CONFIRMADA
// real em `routes/api.php:3519` (`ClientController::options()`), mas nenhum
// service do frontend a consumia ainda.
//
// ⚠️ DIVERGÊNCIA REGISTRADA (LAC-FE-02, não é gambiarra — é o shape real da
// API): o plano assumia `ClientOptionResource` no formato `{uuid,label}`
// (mirror `ProviderOptionResource`). A implementação REAL
// (`app/Http/Resources/V1/ClientOptionResource.php`) devolve
// `{uuid, name}` — campo `name` (de `people.name`), NÃO `label`. O type
// abaixo reflete o shape REAL; consumidores mapeiam `item.name` para
// `Option.label`/`CheckboxListItem.label` no `mapItem`.
//
// Também diverge de `listProviderOptions` em NÃO SER PAGINADO:
// `ClientController::options()` responde via `ApiResponse::success()` (não
// `::paginated()`) — `ListClientOptionsAction`/`ClientRepository::
// listOptions()` devolvem a Collection INTEIRA de clientes ATIVOS do tenant
// (`is_enabled=true`, `orderBy('people.name')`), sem paginação real; `meta`
// vem SEMPRE `null`. `ClientOptionsRequest.rules()` só valida `search` —
// `page`/`per_page` enviados pelo cliente são ignorados pelo backend (mantidos
// na assinatura só por paridade de forma com os demais lookups paginados/
// `PaginationQueryParams`, sem efeito real na resposta).
//
// Molde estrutural de `listProviderOptions` (mesmo adaptador de envelope →
// `ResponsePagination`, mesmo fallback de `meta` ausente — aqui SEMPRE
// ausente): `total`/`per_page` caem no tamanho do array recebido,
// `current_page`/`total_pages` caem em `1`.
// -----------------------------------------------------------------------------
export interface ClientOptionItem {
  uuid: string;
  /** `people.name` (Client não tem coluna própria de nome) — NÃO `label` (divergência LAC-FE-02). */
  name: string;
}

export interface ClientOptionsListEnvelope {
  success: boolean;
  message: string;
  data: ClientOptionItem[];
  errors: Record<string, string[]> | null;
  meta: { total: number; per_page: number; current_page: number; last_page: number } | null;
}

export interface ListClientOptionsParams extends PaginationQueryParams {
  search?: string;
  /** PLANO-FIX AUDIT-FILTROS-RELATORIOS §1/§2.1 — filtro opt-in whitelistado
   *  (`has=nfes|sales`, default OFF), estreita o universo a clientes com
   *  fato associado (NFe emitida/venda). Consumidores que não enviam
   *  continuam recebendo o universo atual (sem regressão). */
  has?: 'nfes' | 'sales';
}

async function listClientOptions(
  params: ListClientOptionsParams
): Promise<ResponsePagination<ClientOptionItem[]>> {
  const { data } = await api.V2.get<ClientOptionsListEnvelope>('/clients/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    has: params.has || undefined,
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

export {
  createClient,
  deleteClient,
  getClientByNif,
  getClientByUuid,
  listClientOptions,
  listClients,
  updateClient,
};
