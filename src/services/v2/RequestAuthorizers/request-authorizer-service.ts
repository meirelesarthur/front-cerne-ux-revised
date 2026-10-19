// src/services/v2/RequestAuthorizers/request-authorizer-service.ts
// -----------------------------------------------------------------------------
// RequestAuthorizer Service — API v1 do backend Laravel GB.Cerne (Autorizador
// de Solicitação de Compras). NOVO ARQUIVO (`TASK-RP-FE-07`, esteira
// 97-Esteiras/022) — só a função `listRequestAuthorizerOptions`, consumida
// pelo Select "Autorizador" do cabeçalho do formulário de Solicitação de
// Compras (`TASK-RP-FE-09`, ainda não construído). NÃO é o service completo
// do CRUD de Autorizadores — listagem/formulário próprios do módulo
// `RequestAuthorizer` ficam para `TASK-AU-FE-01`/`02`
// (`status: AGUARDANDO DECISÃO DO DONO`, contrato de tela daquele módulo
// ainda sem gate) — fora de escopo aqui, mesma fronteira já declarada pelo
// Arquiteto em `RequestPurchase-FrontEnd-contrato.md §2`.
//
// ⚠️ Instrução explícita da Tarefa cumprida: "o Executor DEVE ler esse
// contrato antes de codar esta função específica" —
// `Autorizadores-contrato.md` §3 (Endpoints) lido nesta execução:
//   - `GET /api/v1/request-authorizers` → `index` (paginado, `search` ILIKE
//     no NOME DO USUÁRIO vinculado — `RequestAuthorizerFilterData`,
//     `per_page` default 15), permissão `request-authorizers_view`, filtra
//     por TENANT INTEIRO (DA-AU-04).
//   - "Sem endpoint `/active` (...) sem precedente no legado de uso em
//     select assíncrono fora do próprio módulo" — ou seja, o contrato já
//     antecipa que NÃO há (nem have de haver) um `/request-authorizers/options`
//     dedicado.
//
// ⚠️ Correção de premissa (transparência, não fabricação): o task-packet
// original registrava o endpoint como "NÃO CONFIRMADO nesta rodada". Além do
// contrato, esta execução LEU DIRETAMENTE `api_root`
// (`GB.Cerne.Api/routes/api.php:1449`, `Route::apiResource('request-authorizers',
// RequestAuthorizerController::class)`) e confirmou que o Controller, as
// rotas (`index`/`show`/`store`/`update`/`destroy`) e o
// `RequestAuthorizerResource` (`uuid`, `user: {uuid, name}`, `auth`,
// `max_value`, `is_active`, `number_quotes`, `expense_organizer`,
// `is_conditional`, `farms[]`, `rules[]`, `created_at`/`updated_at` — NUNCA
// `id`/`description`/`min_value`/`is_manager`, Lei 10/DA-AU-05/DA-AU-07) JÁ
// EXISTEM e estão implementados no fork. A premissa fica PARCIALMENTE
// corrigida: o endpoint de listagem existe de verdade (não é fictício), mas
// não é um `/options` enxuto dedicado — é o `index` completo do CRUD,
// reaproveitado tal como é (sem Resource "light" próprio, diferente de
// `CostCenterRef`/`ProductOptionItem`). GRUPO A desta esteira — leitura de
// código, NÃO chamada contra servidor rodando; reconciliar contra resposta
// real quando o GRUPO B desta esteira (ou uma Tarefa própria de
// Autorizadores) rodar o "Teste do dev" com o backend no ar.
//
// Label da opção resolvida no `mapOptions` do `SelectAsyncPaginate`
// (`RequestItemRow.tsx`/formulário) = `user.name` — único campo textual de
// identificação do Resource (`description`/`code` não existem neste módulo).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  RequestAuthorizerFilterForm,
  RequestAuthorizerListItem,
  RequestAuthorizerPayload,
  RequestAuthorizersListEnvelope as RequestAuthorizersIndexEnvelope,
} from '@/@types/v2/RequestAuthorizers';

export interface RequestAuthorizerFarmRef {
  farm_uuid: string;
  name: string;
  level: number;
}

export interface RequestAuthorizerRuleRef {
  type: string;
  value: number;
  apply_on: string;
}

/** Mirror `RequestAuthorizerResource` (`api_root`, lido nesta execução) — só
 *  os campos relevantes para consumo como option-source do
 *  `SelectAsyncPaginate`; `id`/`description`/`min_value`/`is_manager` NUNCA
 *  existem no Resource real (Lei 10/DA-AU-05/DA-AU-07). Tipo inline (não em
 *  `@/@types/v2/*` — não existe pasta de tipos própria para
 *  `RequestAuthorizer` no frontend ainda, fora de escopo criar o módulo
 *  completo aqui, mesma fronteira do cabeçalho do arquivo). */
export interface RequestAuthorizerOptionItem {
  uuid: string;
  user: { uuid: string; name: string };
  auth: { uuid: string; name: string } | null;
  max_value: number | null;
  is_active: boolean;
  number_quotes: number | null;
  expense_organizer: boolean;
  is_conditional: boolean;
  farms: RequestAuthorizerFarmRef[];
  rules: RequestAuthorizerRuleRef[];
  created_at: string;
  updated_at: string;
}

interface RequestAuthorizersListEnvelope {
  success: boolean;
  message: string;
  data: RequestAuthorizerOptionItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

export interface ListRequestAuthorizerOptionsParams extends PaginationQueryParams {
  search?: string;
}

// `GET /request-authorizers` (index do CRUD, reaproveitado como
// option-source — ver cabeçalho do arquivo). Adaptação envelope
// ApiResponse::paginated → ResponsePagination, mesmo adaptador de
// `listCostCenterOptions`/`listProductOptions` (meta REAL, nunca fallback
// fake).
async function listRequestAuthorizerOptions(
  params: ListRequestAuthorizerOptionsParams
): Promise<ResponsePagination<RequestAuthorizerOptionItem[]>> {
  const { data } = await api.V2.get<RequestAuthorizersListEnvelope>('/request-authorizers', {
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

// -----------------------------------------------------------------------------
// SLICE 1 (Lote 06 / esteira 089, Frente C, F-141 — Lista + visibilidade) —
// CRUD PRÓPRIO do módulo de Autorizadores (`GET`/`DELETE /request-authorizers`),
// ADITIVO a `listRequestAuthorizerOptions` acima (option-source do form de
// Solicitação de Compras, intocada — mesmo endpoint `index`, Resource
// completo reaproveitado, envelope idêntico). Fatia de escrita (create/
// update) fica para o Slice 2 (`TASK-AU-FE-02`/form), fora de escopo aqui.
// -----------------------------------------------------------------------------

export interface ListRequestAuthorizersParams extends PaginationQueryParams {
  search?: string;
}

// `GET /request-authorizers` — listagem paginada real da tela (permissão
// `request-authorizers_view`, filtro `search` ILIKE no nome do usuário
// vinculado). Adaptação envelope ApiResponse::paginated → ResponsePagination,
// mesmo adaptador de `listRequestAuthorizerOptions`/`listCostCenters`.
async function listRequestAuthorizers(
  params: ListRequestAuthorizersParams
): Promise<ResponsePagination<RequestAuthorizerListItem[]>> {
  const { data } = await api.V2.get<RequestAuthorizersIndexEnvelope>('/request-authorizers', {
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

// `GET /request-authorizers/{uuid}` — detalhe (Slice 1 só usa para a ação
// "Visualizar"/"Editar" da lista navegarem à tela; o Slice 2 é quem consome
// de fato o preenchimento do form).
async function getRequestAuthorizerByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<RequestAuthorizerListItem>>(
    `/request-authorizers/${uuid}`
  );
  return data;
}

// `DELETE /request-authorizers/{uuid}` — 204; erro de negócio (message do
// envelope) vira toast, mesmo padrão de `deleteCostCenter`.
async function deleteRequestAuthorizer(uuid: string) {
  const { data } = await api.V2.delete(`/request-authorizers/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// SLICE 2 (Lote 06 / esteira 089, Frente C, F-141 — Form criar/editar) —
// ADITIVO a tudo acima (listagem/delete do Slice 1 e option-source de
// Solicitação de Compras, INTOCADOS). `RequestAuthorizerRequest` (backend)
// exige o payload COMPLETO em ambos os verbos — sem PATCH parcial —, por isso
// `updateRequestAuthorizer` também recebe o payload inteiro.
// -----------------------------------------------------------------------------

// `POST /request-authorizers` — 201, `RequestAuthorizerResource` do registro criado.
async function createRequestAuthorizer(payload: RequestAuthorizerPayload) {
  const { data } = await api.V2.post<Response<RequestAuthorizerListItem>>(
    '/request-authorizers',
    payload
  );
  return data;
}

// `PUT /request-authorizers/{uuid}` — payload SEMPRE completo (farms[]/rules[]
// inclusos por inteiro — RequestAuthorizerRequest exige todos os campos,
// exceto `max_value`, nullable).
async function updateRequestAuthorizer(uuid: string, payload: RequestAuthorizerPayload) {
  const { data } = await api.V2.put<Response<RequestAuthorizerListItem>>(
    `/request-authorizers/${uuid}`,
    payload
  );
  return data;
}

export type { RequestAuthorizerFilterForm };
export {
  listRequestAuthorizerOptions,
  listRequestAuthorizers,
  getRequestAuthorizerByUuid,
  deleteRequestAuthorizer,
  createRequestAuthorizer,
  updateRequestAuthorizer,
};
