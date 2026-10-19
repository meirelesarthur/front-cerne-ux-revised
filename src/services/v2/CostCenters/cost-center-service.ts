// src/services/v2/CostCenters/cost-center-service.ts
// -----------------------------------------------------------------------------
// Cost Center Service — API v1 do backend Laravel GB.Cerne (Centros de Custo).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /cost-centers            → data: CostCenterListItem[] + meta de paginação Laravel (fixa 50/página)
//   GET    /cost-centers/{uuid}     → data: CostCenterDetail (com categories/apportionments)
//   POST   /cost-centers            → payload CostCenterPayload (parent_uuid aceito)
//   PUT    /cost-centers/{uuid}     → payload CostCenterPayload (parent_uuid PROIBIDO — imutável)
//   DELETE /cost-centers/{uuid}     → 204; erro de negócio (message) se referenciado (FK RESTRICT)
//
// `listCostCenters` ADAPTA o envelope paginado do backend ({ data: [], meta: {} })
// para o shape `ResponsePagination` ({ data: { items, pagination } }) que a
// infra de grid do projeto (useCustomGridQuery/TableProvider) consome — idêntico
// ao truque de `listRoles` — nenhum hook global precisa ser alterado.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CostCenterDetail,
  CostCenterListItem,
  CostCenterOptionsListEnvelope,
  CostCenterPayload,
  CostCenterRef,
  CostCenterTreeNode,
  CostCentersListEnvelope,
} from '@/@types/v2/CostCenters';

// Params aceitos pela listagem — paginação padrão + busca + filtros reais do
// backend (`type`/`is_enabled`). O backend ignora `per_page` (fixo em 50).
export interface ListCostCentersParams extends PaginationQueryParams {
  search?: string;
  type?: 'productive' | 'apportioned';
  is_enabled?: 'true' | 'false';
  only_global_top_level?: boolean;
  // TASK-BE-358/TASK-FE-336 (companheiro) — opt-in, mirror de
  // `only_global_top_level`: só Centros de Custo ANALÍTICOS (folhas),
  // excluindo SINTÉTICOS. Consumido pelo select "Centro de Custo" da etapa
  // Funcionário do wizard de Pessoas via `/cost-centers/options`.
  only_analytic?: boolean;
  // F-245 (TASK-245-FE-01) — filtro ADITIVO opcional: escopa o lookup pela
  // fazenda informada (pivot `cost_center_farm` no backend,
  // `F-245-api-arquitetura.md §3.2/§3.6`). Omitido preserva 100% o
  // comportamento atual de todos os consumidores existentes.
  farm_uuid?: string;
  // 088 — `scope=allocation`: catálogo de rateio (Compra/Venda de Animais,
  // Transferência entre Fazendas) = TODOS os centros ANALÍTICOS do contratante
  // (não só da fazenda), ordenado por código. Sem `farm_uuid`/`only_analytic`.
  scope?: 'allocation';
}

async function listCostCenters(
  params: ListCostCentersParams
): Promise<ResponsePagination<CostCenterListItem[]>> {
  const { data } = await api.V2.get<CostCentersListEnvelope>('/cost-centers', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    type: params.type || undefined,
    is_enabled: params.is_enabled || undefined,
    only_global_top_level: params.only_global_top_level || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
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

async function getCostCenter(costCenterUuid: string) {
  const { data } = await api.V2.get<Response<CostCenterDetail>>(`/cost-centers/${costCenterUuid}`);
  return data;
}

// TASK-BE-351/TASK-FE-317 — árvore completa (Sintético→Analítico, já
// filtrada por tenant no backend), mirror exato de
// `getFinancialCategoryTree()`. Consumida por `useCostCenterTree()`
// (`CentroCusto/useCostCenters.tsx`) para alimentar o `CategoryTreeSelector`
// do campo "Centros de Custo vinculados" em `CreateOrUpdateFinancialCategory.tsx`.
export interface GetCostCenterTreeParams {
  /**
   * TASK-FE-1087 — opt-in, mirror do parâmetro homônimo do backend
   * (`GET /cost-centers/tree?only_top_level=true`, default `false`). Sem o
   * parâmetro o comportamento é bit-a-bit o anterior (árvore completa) —
   * preserva `PlanAccount/CategoryTreeSelector` via `CentroCusto/useCostCenters
   * .tsx` intocado. `true` devolve só os nós de topo (Sintéticos globais),
   * sem `children`, consumido por `CreateOrUpdateFinancialCategory.tsx`.
   */
  onlyTopLevel?: boolean;
}

async function getCostCenterTree(params: GetCostCenterTreeParams = {}) {
  const { data } = await api.V2.get<Response<CostCenterTreeNode[]>>('/cost-centers/tree', {
    only_top_level: params.onlyTopLevel || undefined,
  });
  return data;
}

async function createCostCenter(payload: CostCenterPayload) {
  const { data } = await api.V2.post<Response<CostCenterDetail>>('/cost-centers', payload);
  return data;
}

async function updateCostCenter(costCenterUuid: string, payload: CostCenterPayload) {
  const { data } = await api.V2.put<Response<CostCenterDetail>>(
    `/cost-centers/${costCenterUuid}`,
    payload
  );
  return data;
}

async function deleteCostCenter(costCenterUuid: string) {
  const { data } = await api.V2.delete(`/cost-centers/${costCenterUuid}`);
  return data;
}

// GET /cost-centers/options — lookup ENXUTO (GAP-BE-040 addendum,
// TASK-BE-355), SEM gate de `costcenters_view` (herda só `farm.context.
// optional` do grupo de rota — mesma tenancy híbrida de `/cost-centers`).
// Alimenta o Select "Centro de Custo" da etapa Funcionário do wizard de
// Pessoas (TASK-FE-332) — usuários sem `costcenters_view` (ex.: só
// `people_create`/`people_edit`) continuam sem acessar o CRUD completo,
// mas conseguem escolher um Centro de Custo ao criar/editar Pessoa. MESMO
// adaptador de `listCostCenters` (ResponsePagination) — só a rota e o
// Resource (`CostCenterOptionResource`, `uuid`+`code`+`description`, mesmo
// shape de `CostCenterRef`) mudam. `listCostCenters` (sobre
// `/cost-centers`, gated) CONTINUA existindo — usada por
// `CentroCusto/index.tsx`, fora de escopo aqui.
async function listCostCenterOptions(
  params: Pick<
    ListCostCentersParams,
    | 'search'
    | 'per_page'
    | 'page'
    | 'only_analytic'
    | 'is_enabled'
    | 'only_global_top_level'
    | 'farm_uuid'
    | 'scope'
  >
): Promise<ResponsePagination<CostCenterRef[]>> {
  const { data } = await api.V2.get<CostCenterOptionsListEnvelope>('/cost-centers/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    // TASK-BE-358/TASK-FE-336 (companheiro) — `only_analytic=true` filtra
    // só Centros de Custo folha (ANALÍTICOS); omitido preserva o
    // comportamento atual (ambos os níveis).
    only_analytic: params.only_analytic || undefined,
    // three-state (ausente = sem filtro): `is_enabled=true` restringe a
    // Centros de Custo ATIVOS. Opt-in por consumidor — hoje só o seletor
    // da Fazenda (`useFarmCostCenterOptions`) envia esse filtro.
    is_enabled: params.is_enabled || undefined,
    // TASK-BE-611/TASK-FE-978 — mirror de `only_analytic`: filtra só
    // Sintéticos GLOBAIS de nível raiz. Antes desta Tarefa o parâmetro era
    // aceito pelo TIPO (`ListCostCentersParams.only_global_top_level`) mas
    // DESCARTADO aqui — nunca chegava à querystring (achado desta Tarefa,
    // mesma classe de bug do companheiro `only_analytic`/`TASK-FE-336`).
    only_global_top_level: params.only_global_top_level || undefined,
    // F-245 (TASK-245-FE-01) — aditivo, opt-in; ausente preserva o
    // comportamento atual de TODOS os consumidores existentes (Dre,
    // ExportCPagarReceberDominio, wizard de Pessoas, etc.).
    farm_uuid: params.farm_uuid || undefined,
    scope: params.scope || undefined,
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

// TASK-TN-FE-07 / GAP-TN-FE-04 (origem) → REPONTADO em ajuste de homologação
// (TASK-TN-11/GAP-TN-13, backend ✅ validado) de `/cost-centers/options`
// (que ainda EXIGE `X-Farm-Id` via `farm.context.optional` para quem não é
// Gestor_Plataf — a causa raiz real do erro "Header X-Farm-Id é
// obrigatório." relatado pelo usuário de revenda sem fazenda) para
// `/cost-centers/options/global` — endpoint DEDICADO, auth-only, FORA de
// qualquer grupo `farm.context`, filtro hardcoded no backend
// (`is_enabled=true`, `depth<=1`, mirror do legado
// `Admin\TenantController::create()`), reusando o MESMO `CostCenterOptionResource`
// (`uuid`+`code`+`description`, idêntico a `CostCenterRef` — nenhum tipo
// novo necessário). `skipFarmHeader` REMOVIDO — inócuo neste endpoint (o
// Controller (`CostCenterController::globalOptions()`) nem recebe `Request`,
// não olha o header em nenhuma camada). O endpoint TAMBÉM não aceita
// NENHUM query param (nem `search`, nem paginação) e responde via
// `ApiResponse::success` (SEM paginação, `meta: null` sempre) — devolve o
// universo INTEIRO dos centros globais/raiz numa única resposta, mirror
// EXATO de `listPlatformRoleOptions`/`/roles/options` (`role-service.ts`,
// mesmo lote de ajuste). Usado SÓ pelo select `centers[]` de Contratantes
// (`CreateOrUpdateContratante.tsx`, filtragem ao digitar migrada para
// client-side sobre a lista completa já carregada — universo pequeno,
// paridade com o select2 do legado) — `listCostCenterOptions`
// (`/cost-centers/options`, tenant-scoped) permanece INALTERADA e continua
// servindo todo outro consumidor (ex.: `useFarmCostCenterOptions`, wizard de
// Pessoas), que depende do corte tenant-scoped funcionando normalmente.
async function listGlobalCostCenterOptions(): Promise<ResponsePagination<CostCenterRef[]>> {
  const { data } = await api.V2.get<CostCenterOptionsListEnvelope>('/cost-centers/options/global');

  // Adaptação envelope ApiResponse::success (SEM paginação) → ResponsePagination
  // (grid/CheckboxListField), simulando uma única "página" com tudo — mirror
  // de `listPlatformRoleOptions`.
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

// TASK-FE-036-103 (esteira 036, Contas a Pagar) — cascata categoria→centro
// do rateio (GAP-FE-036-102), `CostCenterController::byCategory`. Devolve
// ARRAY (0..n Centros de Custo vinculados à Categoria Financeira) — o front
// auto-seleciona o PRIMEIRO item, usuário pode trocar depois (contrato de
// tela §5.1). Caller nunca chama sem `categoryUuid`.
// Sem `params` = restrito à fazenda (default dos demais consumidores). 088: o
// rateio de Compra/Venda de Animais e Transferência entre Fazendas passa
// `{ scope: 'allocation' }` (universo do rateio do contratante).
async function listCostCentersByCategory(
  categoryUuid: string,
  params?: { scope?: 'allocation' }
): Promise<Response<CostCenterRef[]>> {
  const { data } = await api.V2.get<Response<CostCenterRef[]>>(
    `/cost-centers/by-category/${categoryUuid}`,
    params ? { params } : undefined
  );
  return data;
}

export {
  createCostCenter,
  deleteCostCenter,
  getCostCenter,
  getCostCenterTree,
  listCostCenterOptions,
  listCostCenters,
  listGlobalCostCenterOptions,
  listCostCentersByCategory,
  updateCostCenter,
};
