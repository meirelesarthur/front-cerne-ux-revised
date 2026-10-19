// src/services/v2/FinancialCategories/financial-category-service.ts
// -----------------------------------------------------------------------------
// Financial Category Service — API v1 do backend Laravel GB.Cerne. Nasceu
// ENXUTO, só de LEITURA, para popular o multi-select de `category_uuids` do
// formulário de Plano de Contas (TASK-PA-03b) — TASK-FE-310 (execução 023)
// ESTENDE com o CRUD completo (create/update/delete/show) para a tela de
// gestão própria (`01-Arquitetura_e_Contratos/FinancialCategory/
// FinancialCategory-Gestao-Contrato`), EDITANDO este arquivo (não duplicado).
//
// Inspeção obrigatória confirmada nesta rodada (GB.Cerne.Api):
//   - Rota: `Route::apiResource('financial-categories', FinancialCategoryController::class)`
//     (routes/api.php) — `GET /api/v1/financial-categories` = `index`.
//   - `FinancialCategoryController::index()` usa
//     `ApiResponse::paginated(FinancialCategoryResource::collection($categories), ...)`
//     e `ListFinancialCategoryAction::handle()` retorna `LengthAwarePaginator`
//     (`FinancialCategoryRepository::listPaginated`) — ou seja, o endpoint É
//     PAGINADO (mesmo padrão de `/plan-accounts`/`/cost-centers`), não devolve
//     tudo de uma vez. `listFinancialCategories` adapta o envelope paginado
//     para o shape `ResponsePagination` que `SelectAsyncPaginate` consome —
//     idêntico ao truque de `listPlanAccounts`/`listCostCenters`.
//   - `FinancialCategoryResource` expõe `uuid`/`code`/`description` (entre
//     outros campos fora do escopo deste multi-select) — confirma DA-PA-09
//     (`category_uuids`, não `category_ids`).
//   - Permissão do `index`: `financialcategories_view` (sem hífen — bloco de
//     permissões PRÓPRIO de `FinancialCategory`, diferente do bloco com
//     hífen `plan-accounts_*` reaproveitado do legado — DA-PA-10). Usuários
//     sem essa permissão recebem 403 do backend ao tentar carregar o
//     multi-select; não há tratamento especial aqui além do genérico de
//     `SelectAsyncPaginate` (toast de erro já embutido no componente).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  FinancialCategoriesListEnvelope,
  FinancialCategoryDetail,
  FinancialCategoryListItem,
  FinancialCategoryOption,
  FinancialCategoryOptionsListEnvelope,
  FinancialCategoryPayload,
  FinancialCategoryTreeNode,
} from '@/@types/v2/FinancialCategories';

export interface ListFinancialCategoriesParams {
  search?: string;
  page?: number;
  per_page?: number;
  is_enabled?: 'true' | 'false';
  classification?: 'N' | 'C' | 'O';
  // TASK-CP-FE-FIX-03 — `FinancialCategoryFilterData` (backend, `SnakeCaseMapper`)
  // aceita `type_id` (CategoryType, ex.: 1 = "Saídas") e `class` (1 = sintética,
  // 2 = analítica). Consumido pelo Select de Categoria Financeira de
  // CreateOrUpdateCategoriaProduto.tsx (`findParams`) para replicar o filtro
  // do legado (só analíticas de Saídas aparecem para vínculo com Categoria de
  // Produto) — sem forwarding aqui, os params eram descartados antes de
  // chegar ao axios e o fix ficava inerte.
  type_id?: number;
  class?: number;
}

async function listFinancialCategories(
  params: ListFinancialCategoriesParams
): Promise<ResponsePagination<FinancialCategoryListItem[]>> {
  const { data } = await api.V2.get<FinancialCategoriesListEnvelope>('/financial-categories', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    is_enabled: params.is_enabled || undefined,
    classification: params.classification || undefined,
    type_id: params.type_id ?? undefined,
    class: params.class ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid/select).
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
// Árvore completa (TASK-PA-16) — `GET /financial-categories/tree`, sem
// paginação, mesmo padrão de `getPermissionTree()`
// (`services/v2/Roles/permission-service.ts`). Alimenta `CategoryTreeSelector`
// no card "Categorias Financeiras" do formulário de Plano de Contas — ver
// `01-Arquitetura_e_Contratos/FinancialCategory-Tree-Addendum`.
// -----------------------------------------------------------------------------
async function getFinancialCategoryTree() {
  const { data } = await api.V2.get<Response<FinancialCategoryTreeNode[]>>(
    '/financial-categories/tree'
  );
  return data;
}

// -----------------------------------------------------------------------------
// CRUD (TASK-FE-310, execução 023) — extensão do serviço enxuto acima para a
// tela de gestão própria. Contrato §3.3/3.4/3.5/3.6 (fonte: código real do
// backend, não presumido) — `FinancialCategoryController`.
// -----------------------------------------------------------------------------

async function getFinancialCategory(uuid: string) {
  const { data } = await api.V2.get<Response<FinancialCategoryDetail>>(
    `/financial-categories/${uuid}`
  );
  return data;
}

async function createFinancialCategory(payload: FinancialCategoryPayload) {
  const { data } = await api.V2.post<Response<FinancialCategoryDetail>>(
    '/financial-categories',
    payload
  );
  return data;
}

async function updateFinancialCategory(uuid: string, payload: FinancialCategoryPayload) {
  const { data } = await api.V2.put<Response<FinancialCategoryDetail>>(
    `/financial-categories/${uuid}`,
    payload
  );
  return data;
}

// 204 No Content — sem corpo de resposta (contrato §3.6). Erro de FK
// (23503) já vira 422 estruturado no backend desde TASK-BE-340 (commit
// `8203b8815`) — o `onError` genérico do `useRequest` já exibe a `message`.
async function deleteFinancialCategory(uuid: string) {
  const { data } = await api.V2.delete(`/financial-categories/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /financial-categories/options (TASK-BE-508, aditivo TASK-FE-504) —
// lookup ENXUTO para o Select `financial_category_uuid` do formulário de
// Produtos (Aba 2, "Estoque e Financeiro") — SEM gate de
// `financialcategories_view`, PAGINADO (ver nota do tipo
// `FinancialCategoryOptionsListEnvelope`). `listFinancialCategories` (sobre
// `/financial-categories`, gated) CONTINUA existindo — usada pela tela de
// gestão própria, fora de escopo aqui.
// -----------------------------------------------------------------------------
export interface ListFinancialCategoryOptionsParams {
  search?: string;
  page?: number;
  per_page?: number;
  // TASK-BE-612/TASK-FE-979 — mesmos nomes/semântica de
  // `ListFinancialCategoriesParams.type_id`/`.class` (índice paginado):
  // `type_id` (CategoryType, ex.: 1 = "Saídas") + `class` (1 = sintética,
  // 2 = analítica). Consumido pelo Select de Categoria Financeira de
  // CreateOrUpdateCategoriaProduto.tsx para replicar o filtro de
  // `TASK-CP-FE-FIX-03` (só analíticas de Saídas) também no endpoint
  // `/options` — sem forwarding aqui, os params seriam descartados antes de
  // chegar ao axios e o filtro ficaria inerte (mesma classe de bug do
  // companheiro `type_id`/`class` de `listFinancialCategories`).
  type_id?: number;
  class?: number;
  // GAP-FARMTRANSFER-04 — novo parâmetro ADITIVO do backend
  // (`FinancialCategoryOptionsRequest.type_ids`), independente de `type_id`
  // (escalar, intocado). Filtra por MÚLTIPLOS `type_id` via `whereIn`,
  // mirror do legado `FinancialCategoryController@filter`
  // (`whereIn('type_id', [$type, 3])`, onde 3 = tipo neutro "Ambas").
  // Necessário porque `type_id` escalar não permite expressar "Receita OU
  // Ambas" / "Despesa OU Ambas" — usado pelo select de Categoria Financeira
  // do rateio de Trans. Fazendas
  // (`FarmTransferIncomeAllocation.tsx`/`FarmTransferExpenseAllocation.tsx`).
  // O axios (`AxiosURLSearchParams`, `indexes: false` default) serializa
  // array como `type_ids[]=2&type_ids[]=3` — mesmo formato que o
  // `FormRequest` (`'type_ids' => ['sometimes','array']`) espera do
  // Laravel; confirmado lendo `node_modules/axios/lib/helpers/toFormData.js`
  // (sem necessidade de `paramsSerializer` customizado).
  type_ids?: number[];
  // Homologação 036fix3 (item "Categoria Financeira do rateio lista itens
  // errados/inativos") — `FinancialCategoryApiRepository::listOptions()`
  // (backend) NÃO tinha nenhum filtro de `is_enabled` embutido (diferente
  // de `getActiveAndAvailableFilter` do legado, que sempre aplicava
  // `is_enabled=true`, e diferente de `/financial-categories` gated, que
  // também aplica); extensão ADITIVA — aqui só forwarda o param, sem mudar
  // nada para quem não enviar. Consumido por `ExpenseApportionmentTab.tsx`
  // (rateio de Contas a Pagar) para não listar categorias desabilitadas.
  is_enabled?: 'true' | 'false';
  // TASK-BE-1086 v3 (GAP-BE-685, Opção C — caller-scoped, F-084 Entrada/
  // Insumos item 4/C7; reutilizado no Rateio da Autorização, UT-000711,
  // decisão do dono): opt-in — ausente preserva 100%
  // o comportamento atual para os ~47 outros consumidores deste mesmo
  // service/endpoint. Quando `true`, o backend troca a tenancy padrão pelo
  // mirror estrito do legado (tenant exclusivo + `is_enabled` sempre-on +
  // vínculo hierárquico a Centro de Custo habilitado do tenant) e, se
  // `type_id` também for enviado, passa a incluir o tipo neutro "Ambas"
  // (`whereIn([type_id, 3])`). Novos consumidores exigem decisão do dono.
  cost_center_scoped?: 'true' | 'false';
  // F-183 Saldo Inicial (backend 78072846f) - opt-in EXCLUSIVO do Rateio da
  // tela de Saldo Inicial. Quando true, /financial-categories/options passa
  // a expor as categorias de sistema globais 3.01.001.% (inclui "Saldo
  // Inicial de Conta (Bancos/Caixa)"), normalmente ocultas da lista geral.
  // Mutuamente exclusivo com cost_center_scoped - nunca enviar os dois
  // juntos (422 no backend). Ausente preserva 100% o comportamento atual
  // para os demais consumidores deste service. NAO reutilizar em nenhum
  // outro consumidor sem decisao explicita do dono.
  bank_movement_scoped?: 'true' | 'false';
  // Fidelidade ao legado (Admin/CategoryProductController::create()/edit():
  // `whereNull('tenant_id')`) — opt-in EXCLUSIVO do Select de Categoria
  // Financeira do form de Categoria de Produto. Quando `true`, o backend
  // recorta só categorias GLOBAIS (tenant_id IS NULL); combinado com
  // `class=2` + `type_id=1` reproduz 1:1 a lista do legado. category_products
  // é tabela global e só pode referenciar categoria financeira global — sem
  // este recorte o Select trazia categorias de tenant que o store rejeitava
  // com 404. Mutuamente exclusivo com cost_center_scoped/bank_movement_scoped
  // (422 no backend). NÃO reutilizar em outro consumidor sem decisão do dono.
  global?: 'true' | 'false';
}

async function listFinancialCategoryOptions(
  params: ListFinancialCategoryOptionsParams
): Promise<ResponsePagination<FinancialCategoryOption[]>> {
  const { data } = await api.V2.get<FinancialCategoryOptionsListEnvelope>(
    '/financial-categories/options',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      type_id: params.type_id ?? undefined,
      class: params.class ?? undefined,
      type_ids: params.type_ids && params.type_ids.length > 0 ? params.type_ids : undefined,
      is_enabled: params.is_enabled || undefined,
      cost_center_scoped: params.cost_center_scoped || undefined,
      bank_movement_scoped: params.bank_movement_scoped || undefined,
      global: params.global || undefined,
    }
  );

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

// ---- TASK-MV-FE-07: agregação client-side p/ o relatório de impressão -----
// Mirror EXATO de `listAllPlanAccountsForReport` (`plan-account-service.ts`,
// TASK-PA-12) — busca TODAS as páginas do tenant ativo via `GET
// /financial-categories`, SEM aplicar filtro nenhum (catálogo completo,
// decisão do dono, Movement-contrato-tela.md §8.3/2). `per_page=100` é o
// MÁXIMO aceito pelo contrato — minimiza o nº de requisições. Laço
// SEQUENCIAL (não paralelo) — a 1ª resposta é quem informa
// `meta.last_page`; erro em qualquer página propaga e aborta o laço (o
// chamador, no header do card de Rateio, trata isso como falha total —
// nunca abre relatório parcial).
async function listAllFinancialCategoriesForReport(): Promise<FinancialCategoryListItem[]> {
  const perPage = 100;
  const items: FinancialCategoryListItem[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const { data } = await api.V2.get<FinancialCategoriesListEnvelope>('/financial-categories', {
      page,
      per_page: perPage,
    });
    items.push(...data.data);
    lastPage = data.meta?.last_page ?? 1;
    page += 1;
  } while (page <= lastPage);

  return items;
}

export {
  createFinancialCategory,
  deleteFinancialCategory,
  getFinancialCategory,
  getFinancialCategoryTree,
  listAllFinancialCategoriesForReport,
  listFinancialCategories,
  listFinancialCategoryOptions,
  updateFinancialCategory,
};
