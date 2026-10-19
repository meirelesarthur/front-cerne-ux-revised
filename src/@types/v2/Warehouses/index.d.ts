// src/@types/v2/Warehouses/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de ARMAZÉNS — API v1 do backend Laravel GB.Cerne.
//
// Contratos (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /warehouses            → data: WarehouseListItem[] + meta (paginação
//                                    DINÂMICA: default 15, teto 100 — nunca constante local)
//   GET    /warehouses/{uuid}     → data: WarehouseDetail (idêntico ao index — sem agregação extra)
//   POST   /warehouses            → payload WarehousePayload
//   PUT    /warehouses/{uuid}     → payload WarehousePayload (mesmos campos — farm_id nunca aceito)
//   DELETE /warehouses/{uuid}     → hard delete + guarda de integridade (422 amigável se houver dependentes)
//
// Fonte: TASK-FE-017 (fundação de dados) + Warehouse-contrato-frontend.md §6.1
// (APROVADO v1.1) + Warehouse-contrato.md §7.7 (WarehouseResource, APROVADO v1.1).
//
// Diferente de CostCenter: `show` NÃO agrega nada além do que `index` já retorna
// — `WarehouseDetail` é alias estrutural de `WarehouseListItem`, NÃO supertipo
// com campos extras. `farm_id`/`id` numérico: NUNCA expostos em nenhuma camada
// (DEC-007 pt.5) — `uuid` em toda parte.
// -----------------------------------------------------------------------------

// ============================================
// WAREHOUSE (resposta da API)
// ============================================

export type WarehouseTypeSlug = 'insumos' | 'producao' | 'formulacao';

export interface WarehouseListItem {
  uuid: string;
  initials: string;
  description: string;
  type: WarehouseTypeSlug;
  type_label: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// show === index no shape — alias estrutural, NÃO supertipo com campos extras
// (diferente de CostCenterDetail, que agrega categories/apportionments no show).
export type WarehouseDetail = WarehouseListItem;

// ============================================
// GET /warehouses/options (TASK-BE-508, aditivo TASK-FE-504) — lookup ENXUTO
// consumido pelo campo `default_warehouse_uuid` de Produtos (Aba 2). Resource
// dedicado (`WarehouseOptionResource`, uuid+initials+description), SEM gate
// de `warehouses_view`. FLAT (`ApiResponse::success`, sem paginação — volume
// real pequeno por fazenda, Product-contrato.md §17.2) — `meta` sempre
// `null`, diferente de `WarehousesListEnvelope` (paginado).
// ============================================

export interface WarehouseOption {
  uuid: string;
  initials: string;
  description: string;
}

// ============================================
// GET /products/{uuid}/warehouses (TASK-BE-036-B17 Entrega 1) — armazéns da
// fazenda ativa com linha de estoque para o Produto informado, SEM filtro de
// saldo positivo (Regra E.5 do legado `ProductWarehouseController` — inclui
// armazém com `quantity` 0). Mirror `WarehouseWithStockResource`
// (`{uuid, description, quantity}`), consumido pelo `Select` síncrono de
// Armazém em `NfeItemsTab.tsx` (TASK-FE-036-B17-2).
// ============================================

export interface WarehouseWithStock {
  uuid: string;
  description: string;
  quantity: number;
}

export interface WarehouseOptionsListEnvelope {
  success: boolean;
  message: string;
  data: WarehouseOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface WarehousesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface WarehousesListEnvelope {
  success: boolean;
  message: string;
  data: WarehouseListItem[];
  errors: Record<string, string[]> | null;
  meta: WarehousesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface WarehousePayload {
  initials: string;
  description: string;
  type: WarehouseTypeSlug;
  is_active: boolean;
  // farm_id: NUNCA — vem do header X-Farm-Id/contexto, imutável após criação (DEC-007 pt.5)
}

// ============================================
// REACT HOOK FORM (TASK-FE-019 — campos do formulário)
// ============================================

export interface WarehouseForm {
  uuid?: string;
  initials: string;
  description: string;
  type?: WarehouseTypeSlug | '';
  is_active: boolean;
}

// ============================================
// FILTRO (drawer da listagem)
// ============================================

export interface WarehouseFilterForm {
  search?: string;
  type?: WarehouseTypeSlug | '';
  is_active?: '' | 'true' | 'false';
}
