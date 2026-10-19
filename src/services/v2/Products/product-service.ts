// src/services/v2/Products/product-service.ts
// -----------------------------------------------------------------------------
// Product Service — API v1 do backend Laravel GB.Cerne (Produtos/Catálogo).
// Contrato: Product-Frontend-Contrato.md (v1.1) + Product-contrato.md
// (backend, APROVADO 2026-07-30) §4/§4b/§5.
//
// ⚠️ `ProductController`/rotas `/products` AINDA NÃO EXISTEM no fork
// (`TASK-BE-503` retida por `GAP-BE-262`) — este service é escrito CONTRA O
// CONTRATO, não contra um endpoint testável agora. Não inventar fallback:
// quando `TASK-BE-503` publicar as rotas reais, confirmar aqui (a) payload
// full vs. parcial em PUT/PATCH (não especificado explicitamente em nenhum
// dos 2 contratos — full-payload é o default de trabalho adotado, mesmo
// padrão de Kind/ProductGroup/CategoryProduct) e (b) se o Route Model
// Binding de `{product}` resolve por `uuid` — ver "Teste do dev (sugerido)"
// da Tarefa.
//
//   GET    /products              → data: ProductListItem[], meta com
//                                    paginação REAL, per_page default 10,
//                                    teto 100 (`ProductIndexRequest`,
//                                    max:100 — NÃO 200, decisão consciente do
//                                    backend, ver Product-Frontend-
//                                    Contrato.md nota de topo)
//   GET    /products/{product}    → data: ProductData
//   POST   /products              → payload ProductPayload — `code` NUNCA
//                                    enviado (gerado pelo servidor)
//   PUT    /products/{product}    → payload ProductPayload (full, default de
//                                    trabalho — ver nota acima)
//
// SEM `deleteProduct` — CONFIRMADO pelo contrato backend que `DELETE
// /products` não existe (`->except(['destroy'])`, fiel à API legada). Não
// implementar, nem condicionalmente.
//
// `listProducts` ADAPTA o envelope { data: [], meta: {} } para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listKinds`/`listProductGroups`/`listCategoryProducts`
// (meta REAL, NÃO o fallback de `meta: null` de `listActiveCategoryProducts`
// — ver nota de risco (3) da Tarefa, "não copiar cegamente" o adaptador
// errado).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ProductData,
  ProductFilterRequest,
  ProductListItem,
  ProductOption,
  ProductOptionsListEnvelope,
  ProductPayload,
  ProductsListEnvelope,
} from '@/@types/v2/Products';
import type { WarehouseWithStock } from '@/@types/v2/Warehouses';

export interface ListProductsParams extends PaginationQueryParams, ProductFilterRequest {}

async function listProducts(
  params: ListProductsParams
): Promise<ResponsePagination<ProductListItem[]>> {
  const { data } = await api.V2.get<ProductsListEnvelope>('/products', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    group_uuid: params.group_uuid || undefined,
    category_uuid: params.category_uuid || undefined,
    kind_uuid: params.kind_uuid || undefined,
    has_lot: params.has_lot || undefined,
    is_equipment: params.is_equipment || undefined,
    // ERRO-FE-016: campo descartado em silêncio (declarado em
    // `ProductFilterRequest`/`ProductFilterForm`, TASK-FE-946, mas nunca
    // repassado à querystring aqui) — o filtro "É Produto Fiscal" do drawer
    // não tinha nenhum efeito na listagem. Mesmo shape string 'true'/'false'
    // dos 2 campos acima — nunca tratar como boolean (ver nota de topo do
    // arquivo e ERRO-FE-016 em 11-Erros_Frontend_UI/).
    is_fiscal: params.is_fiscal || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listKinds`/`listProductGroups`/`listCategoryProducts` (meta
  // REAL, não fallback fake).
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

async function getProduct(uuid: string) {
  const { data } = await api.V2.get<Response<ProductData>>(`/products/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /products/{uuid}/warehouses (TASK-BE-036-B17 Entrega 1, GAP-036-B17) —
// armazéns da fazenda ativa com linha de estoque para o Produto informado,
// SEM filtro de saldo positivo (Regra E.5 do legado, inclui `quantity` 0).
// Resposta FLAT (`ApiResponse::success`, `meta` sempre `null`, mesmo
// adaptador de `listWarehouseOptions`) — mesmo client/envelope do resto do
// service. Consumido por `NfeItemsTab.tsx` (TASK-FE-036-B17-2), 1 `useQuery`
// por linha de item.
// -----------------------------------------------------------------------------
async function getProductWarehouses(productUuid: string) {
  const { data } = await api.V2.get<Response<WarehouseWithStock[]>>(
    `/products/${productUuid}/warehouses`
  );
  return data;
}

async function createProduct(payload: ProductPayload) {
  const { data } = await api.V2.post<Response<ProductData>>('/products', payload);
  return data;
}

// Full-payload adotado como default de trabalho (reconciliável — ver
// cabeçalho do arquivo e "Teste do dev (sugerido)" da Tarefa).
async function updateProduct(uuid: string, payload: ProductPayload) {
  const { data } = await api.V2.put<Response<ProductData>>(`/products/${uuid}`, payload);
  return data;
}

// SEM deleteProduct — confirmado que DELETE /products não existe (contrato
// backend §4, fiel à API legada `->except(['destroy'])`).

// -----------------------------------------------------------------------------
// GET /products/options (TASK-BE-705, GAP-BE-040 Opção B) — lookup ENXUTO, SEM
// gate de `products_view`, PAGINADO (mesmo adaptador de `listProducts`).
// Consumido por múltiplas telas com filtros OPCIONAIS aditivos (mirror do
// backend `ProductOptionsRequest`, que aceita todos):
//   • `group_uuid[]` (TASK-FE-612/GAP-BE-612) — UNIÃO dos grupos informados
//     (`group_id IN (...)` no legado), aba Produção do Apontamento (AP-10).
//   • `category_type` (Contrato/Compras) — filtra por `CategoryProductType`
//     (INPUT); RequestPurchase NÃO envia (paridade legado, todas as categorias).
//   • `food_eligibility` ('food'|'feedstock', TASK-FOOD-FE-04/05 + TASK-FOOD-06
//     ✅ CONCLUÍDO) — mirror EXATO de `category_type` (mesmo `when()`
//     condicional, enum backed-string `FoodEligibilityType` do backend) para
//     os Selects de Formulação/Ração (Food/FoodBeat).
// Omitir todos = comportamento anterior (todos os produtos do tenant). Usa os
// tipos compartilhados `ProductOption`/`ProductOptionsListEnvelope`
// (`@/@types/v2/Products`), superset compatível com os consumidores de ambas
// as frentes (uuid/code/description/requires_coffee_fields + campos opcionais).
// -----------------------------------------------------------------------------
export interface ListProductOptionsParams extends PaginationQueryParams {
  search?: string;
  group_uuid?: string[];
  category_type?: number;
  food_eligibility?: 'food' | 'feedstock';
  /** TASK-BE-1076/TASK-FE-2778 (FID-057-06) — filtro semântico
   *  OPCIONAL/ADITIVO, mirror `?protocol=true` do legado
   *  (`Api\ProductController::index()`, mesmo trio group 15/cat 28/kinds do
   *  lookup de estoque). Só o item SEM armazém do subcadastro do
   *  Protocolo/Estação envia; os demais consumidores de `listProductOptions`
   *  (Inventário/Estoques Iniciais/Contrato/RequestPurchase/Apontamento)
   *  continuam sem enviar — omitir a prop para não filtrar. */
  protocol?: boolean;
  /** TASK-BE-1076/TASK-FE-2781 (FID-040-02) — filtro semântico
   *  OPCIONAL/ADITIVO pelo Enum `GroupProductReference` (nunca literal
   *  numérico solto no service), mirror `?group=8` do legado da Colheita de
   *  Frutas. Parâmetro LOCAL da tela que enviar — os demais consumidores
   *  continuam sem enviar. */
  group_reference?: number;
  /** PLANO-FIX AUDIT-FILTROS-RELATORIOS §1/§2.2 — filtro opt-in whitelistado
   *  (`has=nfes|sales|weighings`, default OFF), estreita o universo a
   *  produtos com fato associado. Consumidores que não enviam continuam
   *  recebendo o universo atual (sem regressão). */
  has?: 'nfes' | 'sales' | 'weighings';
  /** PLANO-FIX §2.2/DECISÃO DE ESCOPO #1 — filtro opt-in (F-277 Abastecimentos)
   *  que restringe a categoria de Suprimento (combustível/lubrificante,
   *  `CATEGORY_ID_SUPPLY`, mesma const que `WarehouseRepository` já usa). */
  supply_only?: boolean;
  /** GAP-VENDAS-FE-07 (EST-03, execução 016, item 4) — filtro opt-in aditivo,
   *  mesma convenção de `protocol`/`supply_only` acima. Migra o Select de
   *  Produto de `NfeItemsTab.tsx` (`listFiscalProducts`) do CRUD `GET
   *  /products` (que dava bypass total de tenant a `Gestor_Plataf` via
   *  `ProductTenantScope`) para este lookup, JÁ estrito por tenant — fecha o
   *  422 `items.0.product_uuid` ao selecionar produto de outro tenant. */
  is_fiscal?: boolean;
  /** Execução 086 (API-04) — filtro semântico opt-in por finalidade. `epi` =
   *  EPI da Ordem de Serviço (grupo 3 + categoria EPI + `is_enabled`); lista
   *  vazia é estado honesto (NUNCA cai para "sem filtro"). Sem o param o
   *  catálogo continua byte-a-byte o de antes. */
  purpose?: ProductOptionsPurpose;
}

/** Valores aceitos por `purpose` em `GET /products/options`. */
export type ProductOptionsPurpose = 'epi';

async function listProductOptions(
  params: ListProductOptionsParams
): Promise<ResponsePagination<ProductOption[]>> {
  const { data } = await api.V2.get<ProductOptionsListEnvelope>('/products/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    group_uuid: params.group_uuid?.length ? params.group_uuid : undefined,
    category_type: params.category_type || undefined,
    food_eligibility: params.food_eligibility || undefined,
    protocol: params.protocol ?? undefined,
    group_reference: params.group_reference ?? undefined,
    has: params.has || undefined,
    supply_only: params.supply_only ?? undefined,
    is_fiscal: params.is_fiscal ?? undefined,
    purpose: params.purpose ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // idêntico a `listProducts` (meta REAL, não fallback fake).
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

/**
 * Alias de `ProductOption` (`@/@types/v2/Products`) mantido para os consumidores
 * do Saldo Estoque/Contrato que importavam `ProductOptionItem` antes da
 * unificação dos tipos de options na reconciliação de merge (execução 034 ×
 * develop). `ProductOption` é superset compatível (mesmos
 * uuid/code/description/requires_coffee_fields).
 */
export type ProductOptionItem = ProductOption;

export {
  createProduct,
  getProduct,
  getProductWarehouses,
  listProductOptions,
  listProducts,
  updateProduct,
};
