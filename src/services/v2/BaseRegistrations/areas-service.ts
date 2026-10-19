// src/services/v2/BaseRegistrations/areas-service.ts
// -----------------------------------------------------------------------------
// Service MÍNIMO de Área ("Piquete"/"Talhão") — TASK-GZ-FE-03, task-packet
// item 3: "criar um service mínimo... só com a função de listagem necessária
// aqui... não duplique um service completo de Área fora do escopo desta
// Tarefa". Só 2 funções, ambas consumidas pelo mapa de seleção de piquetes
// (`GrazingMap.tsx`):
//   - `listAreas`      → GET /api/v1/areas?farm_uuid=&per_page=&page=
//   - `validateAreaInsert` → GET /api/v1/areas/valid-insert?area_uuid=&grazing_uuid=
//
// Mirror estrutural de `fodders-service.ts` (adapta `ApiResponse::paginated`
// para `ResponsePagination`). `api.V2.get(url, params)` passa `params` como
// query string do axios — NUNCA template string concatenada (checklist item
// 19: um `grazing_uuid` ausente vira chave OMITIDA da query, nunca a string
// literal "undefined").
//
// ⚠️ `GET /api/v1/areas` exige `farm_uuid` (query obrigatória, confirmado por
// leitura direta de `AreaIndexRequest::rules()`) — diferente de
// `grazings`/`fodders`, que resolvem a fazenda só pelo header `X-Farm-Id`
// (injetado automaticamente pelo interceptor). `AreaTenantScope` sozinho dá
// visibilidade TENANT-WIDE (todas as Áreas de todas as Fazendas do tenant);
// sem `farm_uuid` explícito o índice misturaria Áreas de Fazendas distintas.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  AreaBatchRequest,
  AreaData,
  AreaListItem,
  AreaOption,
  AreaOptionsListEnvelope,
  AreasListEnvelope,
  AreaValidInsertResponse,
  CreateAreaRequest,
  UpdateAreaRequest,
} from '@/@types/v2/BaseRegistrations/areas';

// ⚠️ RISCO DE TRUNCAMENTO (execução 029, `contrato-fe-lote-area.md §3` —
// Select "Área" de `CreateBatchArea.tsx`, TASK-FE-2104): `GET /api/v1/areas`
// aplica `per_page` MÁXIMO = 100 no backend (`AreaIndexRequest::rules()`,
// `'per_page' => ['sometimes', 'integer', 'min:1', 'max:100']`) — um único
// `listAreas({ farm_uuid, per_page: 100 })` NUNCA garante "todas as Áreas
// ativas da fazenda" se a fazenda tiver mais de 100 Áreas cadastradas.
// Reaproveitar este service para popular o Select de Área SEM truncar exige
// UM dos 2 padrões já em produção no FrontEnd (nenhum wrapper novo):
//   1. `SelectAsyncPaginate` (mirror `measurement_uuid` de
//      `CreateOrUpdateEmbalagem.tsx`/`CreateOrUpdateContador.tsx`) — carrega
//      mais opções incrementalmente ao rolar/buscar no dropdown, nunca busca
//      "tudo" de uma vez, então nunca trunca. `service={listAreas}` exige
//      `farm_uuid` via `findParams` (mirror `findParams` dos exemplos
//      acima), já que `ListAreasParams.farm_uuid` é obrigatório.
//   2. Loop de páginas client-side (mirror `GrazingMap.tsx`,
//      `AREAS_PER_PAGE = 100` + laço até `data.meta.last_page`) — só se a
//      tela precisar do universo completo em memória (não é o caso de um
//      `Select` simples).
// NÃO usar `listAreas` numa única chamada sem paginação real — decisão
// registrada aqui para a Tarefa de feature (TASK-FE-2104) não reintroduzir o
// truncamento.
export interface ListAreasParams {
  farm_uuid: string;
  per_page?: number;
  page?: number;
}

async function listAreas(params: ListAreasParams): Promise<ResponsePagination<AreaListItem[]>> {
  const { data } = await api.V2.get<AreasListEnvelope>('/areas', {
    farm_uuid: params.farm_uuid,
    per_page: params.per_page,
    page: params.page,
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

export interface ValidateAreaInsertParams {
  area_uuid: string;
  /** Presente SÓ em edição — exclui o próprio Pastejo em edição da checagem
   *  de conflito (`grazing_uuid`, mirror `excludingGrazingId` do backend).
   *  `undefined` em criação — NUNCA a string `"undefined"` (axios `params`
   *  omite chaves `undefined` da query string, checklist item 19). */
  grazing_uuid?: string;
}

async function validateAreaInsert(
  params: ValidateAreaInsertParams
): Promise<Response<AreaValidInsertResponse>> {
  const { data } = await api.V2.get<Response<AreaValidInsertResponse>>('/areas/valid-insert', {
    area_uuid: params.area_uuid,
    grazing_uuid: params.grazing_uuid,
  });
  return data;
}

// TASK-FRONT-1 (esteira 063-est03-9-reprovacoes, roteiro `lote-area-f143-
// roteiro.md §2`) — lookup ENXUTO do select "Área" do FILTRO da listagem de
// Lote/Área (`FilterSideBatchAreas.tsx`). `GET /areas/options` é farm-scoped
// pela FAZENDA ATIVA (`X-Farm-Id`, resolvida server-side por `FarmContext`)
// — NÃO sofre o vazamento tenant-wide do `AreaTenantScope` que afeta
// `eligible-areas` (item 1 do roteiro, corrigido à parte na API). `search`
// habilita o campo de busca do `SelectAsyncPaginate`; `include_disabled:
// true` é FIXO (a Tarefa pede TODAS as Áreas da fazenda no filtro —
// incluindo desabilitadas e já vinculadas — nunca só as elegíveis). Mirror
// estrutural de `listServiceOrderAreaOptions`
// (`@/services/v2/ServiceOrders/service-order-service.ts`), mesmo
// endpoint/Resource, consumidor diferente — NÃO reaproveitado diretamente
// para não acoplar o filtro de Lote/Área ao módulo de Ordens de Serviço.
export interface ListAreaOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listAreaOptions(
  params: ListAreaOptionsParams
): Promise<ResponsePagination<AreaOption[]>> {
  const { data } = await api.V2.get<AreaOptionsListEnvelope>('/areas/options', {
    search: params.search || undefined,
    include_disabled: true,
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

// UT-000795 — lookup do select "Área" do bloco Pecuária de Contas a Pagar.
// NÃO altera `listAreaOptions` (consumidor: filtro de Lote/Área, que fixa
// `include_disabled`). Legado: só áreas habilitadas (NÃO envia
// `include_disabled`); `without_grazing=1` só na CRIAÇÃO (legado C-19).
export interface ListAreaOptionsForExpenseParams extends PaginationQueryParams {
  search?: string;
  withoutGrazing?: boolean;
}

async function listAreaOptionsForExpense(
  params: ListAreaOptionsForExpenseParams
): Promise<ResponsePagination<AreaOption[]>> {
  const { data } = await api.V2.get<AreaOptionsListEnvelope>('/areas/options', {
    search: params.search || undefined,
    without_grazing: params.withoutGrazing ? 1 : undefined,
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

// -----------------------------------------------------------------------------
// TASK-FE-415 (fundação do módulo Áreas, F-348/UT-000446, esteira 067) — CRUD
// completo, ADICIONADO aos 3 métodos mínimos acima (mantidos intocados, ainda
// consumidos por `GrazingMap.tsx`/`FilterSideBatchAreas.tsx`). Envelope:
// detalhe/mutação `Response<AreaData>` DIRETO (mirror `cost-center-service.ts`
// `getCostCenter`/`createCostCenter`/`updateCostCenter`/`deleteCostCenter` —
// SEM adapter, diferente de `listAreas`/`listAreaOptions` acima, que
// adaptam `ApiResponse::paginated` → `ResponsePagination`).
// -----------------------------------------------------------------------------

// GET /api/v1/areas/{uuid} — `AreaResource` completo (matriz FID-G3A A-02,
// CONSUMÍVEL JÁ). `troughs`/`batches` só vêm populados por este verbo
// (`GetAreaAction` eager-carrega, `store()`/`update()` não).
async function getArea(areaUuid: string): Promise<Response<AreaData>> {
  const { data } = await api.V2.get<Response<AreaData>>(`/areas/${areaUuid}`);
  return data;
}

// POST /api/v1/areas — escrita TRAVADA por TASK-067-AR-05 (regra de soma de
// hectares ≤ `farm.total_area` e limite de plano ainda não implementadas na
// API, matriz FID-G3A GAP-API-02/03) — o método nasce pronto (task-packet
// "Endpoints", "o service pode nascer já"); a Tarefa de tela (TASK-FE-420)
// consome quando a API destravar.
async function createArea(payload: CreateAreaRequest): Promise<Response<AreaData>> {
  const { data } = await api.V2.post<Response<AreaData>>('/areas', payload);
  return data;
}

// PUT /api/v1/areas/{uuid} — mesma trava de TASK-067-AR-05 acima. `farm_uuid`
// é aceito (`sometimes`) mas IGNORADO pela Action (`farm_id` imutável no
// update, matriz FID-G3A A-04) — payload não precisa reenviá-lo.
//
// TASK-FE-420 — payload ALARGADO para `Partial<UpdateAreaRequest>` (era
// `UpdateAreaRequest` cheio): o editor single envia PATCH PARCIAL por
// `dirtyFields` (task-packet, Hooks/Cenários — "dirtyFields no PATCH
// parcial"/"PATCH só campos sujos"), DIFERENTE do full-resource-replace de
// `CentroCusto`/`Farm`/`Evento`. `Partial<>` é só um alargamento de tipo (o
// `PUT` HTTP em si não muda) — sem callsite anterior a este (primeiro
// consumidor real de `updateArea`), então não há regressão.
async function updateArea(
  areaUuid: string,
  payload: Partial<UpdateAreaRequest>
): Promise<Response<AreaData>> {
  const { data } = await api.V2.put<Response<AreaData>>(`/areas/${areaUuid}`, payload);
  return data;
}

// DELETE /api/v1/areas/{uuid} — CONSUMÍVEL JÁ (matriz FID-G3A A-05,
// endurecido: guarda de dependência 33 tabelas + detach de infraestrutura +
// mensagem detalhada no `message` do envelope de erro).
async function deleteArea(areaUuid: string): Promise<Response<null>> {
  const { data } = await api.V2.delete(`/areas/${areaUuid}`);
  return data;
}

// POST /api/v1/areas/batch — "Adicionar Múltiplas Áreas" (SURF-05). Endpoint
// AINDA NÃO EXISTE no backend (matriz FID-G3A GAP-API-01/TASK-067-AR-06,
// depende de AR-05) — contrato de payload fixado pela matriz §3
// (`AreaBatchRequest`, all-or-nothing, validação por índice). O método nasce
// pronto agora (task-packet "deixe o método pronto"); consumido só pela
// TASK-FE-421 quando a API existir. Resposta esperada: `201` com coleção de
// `AreaResource` das N áreas criadas.
async function createAreasBatch(payload: AreaBatchRequest): Promise<Response<AreaData[]>> {
  const { data } = await api.V2.post<Response<AreaData[]>>('/areas/batch', payload);
  return data;
}

export {
  createArea,
  createAreasBatch,
  deleteArea,
  getArea,
  listAreaOptions,
  listAreaOptionsForExpense,
  listAreas,
  updateArea,
  validateAreaInsert,
};
