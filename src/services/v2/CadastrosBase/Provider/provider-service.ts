// src/services/v2/CadastrosBase/Provider/provider-service.ts
// -----------------------------------------------------------------------------
// Provider Service — API v1 do backend Laravel GB.Cerne ("Fornecedores").
// Fachada dedicada `/api/v1/providers` (Provider-contrato.md DA-PR-02) —
// Provider é um PAPEL de Person, reaproveitando 100% as Actions do módulo
// People por baixo do capô; este service NÃO importa nada de
// `@/services/v2/People` (independência arquitetural espelhando
// `ProviderRequest`, contrato §4.2).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /providers          → data: ProviderListItem[], meta paginação
//                                 REAL (mesmo adaptador de listBanks/
//                                 listNatureOperations). Filtros server-side:
//                                 search/type/city_uuid/is_enabled.
//   GET    /providers/{uuid}   → data: ProviderDetail — `{uuid}` é o uuid do
//                                 PROVIDER (DA-PR-14), NÃO o da Person.
//                                 GAP-PR-FE-02 RESOLVIDO (TASK-PR-06/
//                                 GAP-PR-07, revalidado pelo Tester em
//                                 2026-07-29): a resposta agora INCLUI os 10
//                                 campos raiz de Person (nif/name/nickname/
//                                 email/phone/address/number/district/
//                                 zip_code/city) + o bloco do papel Provider
//                                 num único payload (ver @types) — usado pela
//                                 pré-carga da aba "Dados" em TASK-PR-FE-03.
//   POST   /providers          → payload CreateProviderRequest; `is_enabled`
//                                 NUNCA enviado pelo cliente (forçado `true`
//                                 no Controller).
//   PUT    /providers/{uuid}   → payload UpdateProviderRequest — campos raiz
//                                 SEMPRE completos (`ProviderRequest` exige
//                                 nif/name/nickname/address/number/district/
//                                 city_uuid em ambos os verbos); bloco
//                                 `provider.*` é presence-aware (`sometimes`,
//                                 TASK-BE-362) — enviar só o que mudou.
//   PATCH  /providers/{uuid}/deactivate → 200 + ProviderDetail; desativa
//                                 (`is_enabled:false`); permissão `providers_edit`.
//   PATCH  /providers/{uuid}/activate   → 200 + ProviderDetail; reativa
//                                 (`is_enabled:true`); permissão `providers_edit`.
//   DELETE /providers/{uuid}   → 204; EXCLUI o registro (095, permissão
//                                 `providers_delete`). Com vínculos devolve 422
//                                 genérico (`errors:null`, `message` traduzida)
//                                 — a tela exibe a `message` no toast.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts` quando
// há fazenda ativa (mesmo mecanismo de `nature-operation-service.ts`); este
// service não manipula o header manualmente.
//
// Params SEMPRE repassados ao axios (armadilha #10 do checklist `## 9` —
// nunca descartar `params` no service).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateProviderRequest,
  ProviderDetail,
  ProviderListItem,
  ProvidersListEnvelope,
  UpdateProviderRequest,
} from '@/@types/v2/CadastrosBase/provider';

export interface ListProvidersParams extends PaginationQueryParams {
  search?: string;
  type?: number; // ProviderTypeEnum (1-6) — escrita sempre em INT
  city_uuid?: string;
  is_enabled?: boolean;
  // D5 (UT-000773): `GET /providers` devolve só ativos por padrão; opt-in
  // explícito (cadastro de Fornecedores com status "Todos") traz inativos.
  include_inactive?: boolean;
}

async function listProviders(
  params: ListProvidersParams
): Promise<ResponsePagination<ProviderListItem[]>> {
  const { data } = await api.V2.get<ProvidersListEnvelope>('/providers', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type ?? undefined,
    city_uuid: params.city_uuid || undefined,
    is_enabled: params.is_enabled ?? undefined,
    include_inactive: params.include_inactive || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listBanks/listNatureOperations (meta REAL, vem do
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

// `{uuid}` é o uuid do PROVIDER (DA-PR-14) — NUNCA o uuid da Person.
async function getProviderByUuid(providerUuid: string) {
  const { data } = await api.V2.get<Response<ProviderDetail>>(`/providers/${providerUuid}`);
  return data;
}

async function createProvider(payload: CreateProviderRequest) {
  const { data } = await api.V2.post<Response<ProviderDetail>>('/providers', payload);
  return data;
}

// Payload de update mantém os campos raiz SEMPRE completos (guard
// `Object.keys(dirtyFields).length===0`, contrato `## 6.3`) — só o bloco
// `provider.*` é parcial. Nunca `Partial<CreateProviderRequest>` inteiro.
async function updateProvider(providerUuid: string, payload: UpdateProviderRequest) {
  const { data } = await api.V2.put<Response<ProviderDetail>>(
    `/providers/${providerUuid}`,
    payload
  );
  return data;
}

// Desativa o papel (`is_enabled:false`) via `PATCH /providers/{uuid}/deactivate`
// (095: `DELETE` agora EXCLUI). Resposta 200 com `ApiResponse<ProviderDetail>`.
async function deactivateProvider(providerUuid: string) {
  const { data } = await api.V2.patch<Response<ProviderDetail>>(
    `/providers/${providerUuid}/deactivate`
  );
  return data;
}

// Reativa o papel (`is_enabled:true`) via `PATCH /providers/{uuid}/activate`.
async function activateProvider(providerUuid: string) {
  const { data } = await api.V2.patch<Response<ProviderDetail>>(
    `/providers/${providerUuid}/activate`
  );
  return data;
}

// Exclui o fornecedor (`DELETE /providers/{uuid}`, 204). Com vínculos ativos a
// API responde 422 genérico (sem `errors`), e a `message` já vem traduzida.
async function deleteProvider(providerUuid: string): Promise<void> {
  await api.V2.delete(`/providers/${providerUuid}`);
}

// -----------------------------------------------------------------------------
// GET /providers/options (ADITIVO — TASK-CTR-FE-05, Contract-FrontEnd-
// contrato.md §3) — lookup ENXUTO para o `SelectAsyncPaginate` de
// `provider_uuid` no formulário de Contratos (`TASK-CTR-FE-08`) e pelo filtro
// da listagem (`TASK-CTR-FE-07`). Endpoint CONFIRMADO real no backend
// (leitura direta de `api_root`), mas nenhum service do frontend o consumia
// ainda. Mirror EXATO de `listWarehouseOptions`/`listProductOptions` (mesmo
// adaptador de envelope paginado) — types declarados localmente (não em
// `@/@types/v2/CadastrosBase/provider`) para não tocar em mais nada do
// arquivo além deste aditivo.
// -----------------------------------------------------------------------------
export interface ProviderOptionItem {
  uuid: string;
  label: string;
}

export interface ProviderOptionsListEnvelope {
  success: boolean;
  message: string;
  data: ProviderOptionItem[];
  errors: Record<string, string[]> | null;
  meta: { total: number; per_page: number; current_page: number; last_page: number } | null;
}

export interface ListProviderOptionsParams extends PaginationQueryParams {
  search?: string;
  /** `ProviderTypeEnum` (1-6) — aditivo (`GAP-VD-05`, TASK-VD-FE-01), usado
   *  pela tela de Venda de Animais para restringir `seller_uuid` a
   *  `type: 5` (Comissionado). Não quebra consumidores existentes
   *  (opcional, `undefined` preserva o comportamento anterior).
   *  PLANO-FIX AUDIT-FILTROS-RELATORIOS §2.4 — o backend agora também aceita
   *  `type` como ARRAY (`type[]`), mantendo compat escalar; sem o param o
   *  default do repo continua `[Fornecedor]` (nenhum consumidor regride). */
  type?: number | number[];
}

async function listProviderOptions(
  params: ListProviderOptionsParams
): Promise<ResponsePagination<ProviderOptionItem[]>> {
  const { data } = await api.V2.get<ProviderOptionsListEnvelope>('/providers/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type ?? undefined,
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
  activateProvider,
  createProvider,
  deactivateProvider,
  deleteProvider,
  getProviderByUuid,
  listProviderOptions,
  listProviders,
  updateProvider,
};
