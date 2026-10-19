// src/services/v2/CadastrosBase/Proprietary/proprietary-service.ts
// -----------------------------------------------------------------------------
// Proprietary Service — API v1 do backend Laravel GB.Cerne ("Proprietários").
// Fachada dedicada `/api/v1/proprietaries` (Proprietary-contrato.md DA-PY-02)
// — Proprietary é um PAPEL de Person, reaproveitando 100% as Actions do
// módulo People por baixo do capô; este service NÃO importa nada de
// `@/services/v2/People` (independência arquitetural espelhando
// `ProprietaryRequest`, contrato §4.2) — mesmo padrão de
// `provider-service.ts`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /proprietaries          → data: ProprietaryListItem[], meta
//                                     paginação REAL (mesmo adaptador de
//                                     listProviders/listBanks). Filtros
//                                     server-side: search/is_enabled.
//   GET    /proprietaries/{uuid}   → data: ProprietaryDetail — `{uuid}` é o
//                                     uuid do PROPRIETARY (DA-PY-09), NÃO o
//                                     da Person.
//   POST   /proprietaries          → payload CreateProprietaryRequest;
//                                     `is_enabled` NUNCA enviado pelo
//                                     cliente (forçado `true` no
//                                     Controller).
//   PUT    /proprietaries/{uuid}   → payload UpdateProprietaryRequest —
//                                     campos raiz SEMPRE completos (mesmo
//                                     padrão `$rootDefaults` de
//                                     `PersonController::update()`); bloco
//                                     `proprietary.*` é presence-aware
//                                     (`sometimes`) — enviar só o que mudou.
//   DELETE /proprietaries/{uuid}   → 204; HARD-DELETE FÍSICO (DA-PY-05,
//                                     diferente do soft-delete de
//                                     `Provider`) — guarda 422
//                                     `errors.in_use[]` (`ProprietaryInUseError`)
//                                     quando há dependentes reais (12
//                                     tabelas RESTRICT); nunca 500.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts` quando
// há fazenda ativa; este service não manipula o header manualmente.
//
// Params SEMPRE repassados ao axios (armadilha já documentada em
// `provider-service.ts` — nunca descartar `params` no service).
//
// -----------------------------------------------------------------------------
// UNIÃO (merge de `develop`, execução 025): o CRUD acima (`listProprietaries`/
// `getProprietaryByUuid`/`createProprietary`/`updateProprietary`/
// `deleteProprietary`) veio do PR 87 (Refatoração de Proprietário para API,
// `develop`). `listProprietaryOptions` abaixo é fachada MÍNIMA distinta
// (TASK-FE-567, fecha `GAP-FE-155`) — options-source do `CheckboxListField`
// "Proprietários" de Contas Bancárias (`CreateOrUpdateContaBancaria.tsx`).
// Os dois convivem: consumidores/assinatura de `listProprietaryOptions` NÃO
// podem mudar (ver nota abaixo).
//
// `GET /api/v1/proprietaries/options` (`TASK-BE-568`, validado pelo Tester
// de API com prova de ciclo fechado — o `uuid` devolvido é aceito por
// `POST /accounts` com `is_ticket=true` → 201):
//   - Devolve `proprietaries.uuid`, NUNCA `people.uuid` — é o que
//     `AccountRequest::proprietary_uuids.*` valida (`Rule::exists
//     ('proprietaries', 'uuid')`).
//   - `label` = `people.name`, via join projetado no Repository (não um
//     `with('people')` completo).
//   - Payload enxuto, NÃO-paginado (`{uuid, label}[]`), mirror do shape mais
//     recente de `/options` do projeto (`TaxRuleController::options()`), NÃO
//     o shape paginado antigo de `Bank`/`CostCenter`.
//   - Gate: `accounts_create|accounts_edit` (superset do consumidor) — não
//     existe `proprietaries_view` dedicada.
//   - Tenancy via pivot `proprietary_tenant` — endpoint corretamente NÃO
//     devolve proprietários órfãos do pivot (achado do Tester de API, 49% da
//     tabela `proprietaries`; pendência de backfill fora do escopo desta
//     Tarefa). Lista vazia/curta para um tenant é um estado de UI honesto,
//     não um erro (`CreateOrUpdateContaBancaria.tsx` trata via `emptyLabel`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateProprietaryRequest,
  ProprietariesListEnvelope,
  ProprietaryDetail,
  ProprietaryListItem,
  UpdateProprietaryRequest,
} from '@/@types/v2/CadastrosBase/proprietary';

export interface ListProprietariesParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: boolean;
}

async function listProprietaries(
  params: ListProprietariesParams
): Promise<ResponsePagination<ProprietaryListItem[]>> {
  const { data } = await api.V2.get<ProprietariesListEnvelope>('/proprietaries', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listProviders/listBanks (meta REAL, vem do backend:
  // current_page/last_page/per_page/total).
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

// `{uuid}` é o uuid do PROPRIETARY (DA-PY-09) — NUNCA o uuid da Person.
async function getProprietaryByUuid(proprietaryUuid: string) {
  const { data } = await api.V2.get<Response<ProprietaryDetail>>(
    `/proprietaries/${proprietaryUuid}`
  );
  return data;
}

async function createProprietary(payload: CreateProprietaryRequest) {
  const { data } = await api.V2.post<Response<ProprietaryDetail>>('/proprietaries', payload);
  return data;
}

// Payload de update mantém os campos raiz SEMPRE completos (mesmo padrão
// `$rootDefaults` de `PersonController::update()`/`ProviderController::update()`)
// — só o bloco `proprietary.*` é parcial. Nunca `Partial<CreateProprietaryRequest>` inteiro.
async function updateProprietary(proprietaryUuid: string, payload: UpdateProprietaryRequest) {
  const { data } = await api.V2.put<Response<ProprietaryDetail>>(
    `/proprietaries/${proprietaryUuid}`,
    payload
  );
  return data;
}

// HARD-DELETE FÍSICO (DA-PY-05) — a API responde 204 (limpo) ou 422 com
// `errors.in_use[]` (`ProprietaryInUseError`) quando há dependentes reais;
// nunca 500. Diferente de `deactivateProvider` (soft-delete) — não confundir.
async function deleteProprietary(proprietaryUuid: string) {
  const { data } = await api.V2.delete(`/proprietaries/${proprietaryUuid}`);
  return data;
}

// Fachada MÍNIMA (TASK-FE-567, fecha GAP-FE-155) — options-source do
// CheckboxListField "Proprietários" de Contas Bancárias. Assinatura e shape
// PRESERVADOS (ver nota de cabeçalho) — não unificar com `listProprietaries`.
export interface ProprietaryOption {
  uuid: string; // proprietaries.uuid — NUNCA people.uuid (confirmado por TASK-BE-568)
  label: string; // people.name
  // UT-000785 (LCDPR): aditivos da API — `document_type` do cadastro e se o
  // documento é um CPF válido (o NIF cru NÃO é exposto). Opcionais: consumidores
  // antigos ignoram; ausente = não bloquear.
  document_type?: 'cpf' | 'cnpj' | null;
  cpf_valid?: boolean;
}

// `scope` é ADITIVO (`GAP-EARNING-07`) — ausente/`'tenant'` preserva 100% o
// comportamento original (consumidor de Contas Bancárias, TASK-FE-567).
// `'farm'` filtra pela fazenda ATIVA via `farm_proprietary` (consumidor de
// Apuração Mensal, mirror do escopo já aplicado por `EarningRequest` na
// escrita — `GAP-EARNING-FE-03`).
//
// `farm_uuid` é ADITIVO (F-348/UT-000446, esteira 067) — filtra pelo uuid de
// uma FAZENDA ESPECÍFICA (via pivô `farm_proprietary`), independente da
// fazenda ATIVA no `X-Farm-Id`/`scope='farm'` acima. Consumidor: campo
// "Proprietário Gestor" de Área (`CreateOrUpdateArea.tsx`/`AreaCard.tsx`),
// onde a fazenda relevante é a fazenda DA ÁREA (rota), não necessariamente a
// fazenda ativa do contexto. Ausente = comportamento 100% inalterado (demais
// ~15 consumidores não quebram).
async function listProprietaryOptions(
  search?: string,
  scope?: 'tenant' | 'farm',
  farmUuid?: string
): Promise<ProprietaryOption[]> {
  const { data } = await api.V2.get<Response<ProprietaryOption[]>>('/proprietaries/options', {
    search: search || undefined,
    scope: scope || undefined,
    farm_uuid: farmUuid || undefined,
  });
  return data.data ?? [];
}

export {
  createProprietary,
  deleteProprietary,
  getProprietaryByUuid,
  listProprietaries,
  listProprietaryOptions,
  updateProprietary,
};
