// src/@types/v2/BullSeedSeason/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Touros/Sêmen/Embrião" (BullSeedSeason — Operacional /
// Reprodução, 97-Esteiras/005, Tarefas 24/25). Fonte:
// `01-Arquitetura_e_Contratos/spa-contract-touros-semen-embriao.md §7` +
// `api-contract-touros-semen-embriao.md §8`, mirror estrutural de
// `@/@types/v2/BreedingSeasons` (mesmo envelope paginado real).
//
// Decisão de nomenclatura (contrato §1.3): aggregator `BullSeedSeason`
// SINGULAR (mirror exato do Model `App\Models\BullSeedSeason` já migrado na
// API) — deliberadamente diferente do plural `BreedingSeasons` da feature
// irmã, por instrução explícita do task-packet desta execução.
//
// `BullSeedSeasonListItem` (índice) NÃO tem `animals`/`products` — só
// `BullSeedSeasonDetail` (show) os tem (contrato de tela, armadilha 3 da
// Tarefa 24). Fundação completa do módulo: tipos de payload de escrita e das
// 6 opções de lookup nascem aqui (Tarefa 24), consumidos de fato só na
// Tarefa 25 (formulário).
//
// Tipos de FORMULÁRIO (`BullSeedSeasonForm`/`BullSeedSeason{Animal,Product}
// FieldValue`, Tarefa 25) nascem no fim deste arquivo, junto do formulário
// que os consome (`CreateOrUpdateBullSeedSeason.tsx`) — mirror da convenção
// já usada em `@/@types/v2/Requisitions` (`RequisitionCreateForm`/
// `RequisitionItemForm` no mesmo arquivo dos tipos de leitura).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// BULL SEED SEASON (resposta da API)
// ============================================

export interface BullSeedSeasonBreedingSeasonRef {
  uuid: string;
  description: string;
}

export interface BullSeedSeasonListItem {
  uuid: string;
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  description: string;
  /** `employee?.people?.name ?? user?.name`, já resolvido pelo backend —
   *  string pronta, nunca objeto de relação. */
  responsible_name: string;
  breeding_season: BullSeedSeasonBreedingSeasonRef;
}

export interface BullSeedSeasonAnimalRef {
  uuid: string;
  identification: string;
}

export interface BullSeedSeasonProductWarehouseRef {
  uuid: string;
  description: string;
}

export interface BullSeedSeasonProductRef {
  uuid: string;
  description: string;
  warehouse: BullSeedSeasonProductWarehouseRef | null;
  quantity: number;
  measurement: string;
}

// `BullSeedSeasonResource` (show/store/update) — mesmos campos do índice +
// `animals`/`products` (só no Detalhe, fecha `CL-13` — reexibição NOVA de
// quantidade/UM vs. legado) + timestamps. NUNCA usar `animals`/`products`
// daqui na listagem (contrato de tela, armadilha 3).
export interface BullSeedSeasonDetail extends BullSeedSeasonListItem {
  animals: BullSeedSeasonAnimalRef[];
  products: BullSeedSeasonProductRef[];
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface BullSeedSeasonApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface BullSeedSeasonsListEnvelope {
  success: boolean;
  message: string;
  data: BullSeedSeasonListItem[];
  errors: Record<string, string[]> | null;
  meta: BullSeedSeasonApiPaginationMeta | null;
}

// ============================================
// OPTIONS (6 lookups — TODOS planos/não-paginados, `Collection` no
// Repository — `Select` + `useQuery`, NUNCA `SelectAsyncPaginate`, contrato
// de tela §1/armadilha 1 da Tarefa 24). Consumidos de fato só na Tarefa 25.
// ============================================

export interface AnimalOption {
  uuid: string;
  identification: string;
}

export interface ProductOption {
  uuid: string;
  description: string;
  /** Label da unidade de medida. */
  measurement: string;
  /** Quantidade decimal crua em estoque — frontend formata (fecha `CV-03`). */
  stock: number;
}

export interface WarehouseOption {
  uuid: string;
  description: string;
}

export interface BreedingSeasonOption {
  uuid: string;
  description: string;
}

export interface ProductDetailStock {
  warehouse: BullSeedSeasonProductWarehouseRef;
  quantity: number;
}

export interface ProductDetail {
  uuid: string;
  description: string;
  measurement: string;
  stocks: ProductDetailStock[];
}

// ============================================
// REQUEST TYPES (payload wire-level) — NUNCA `farm_id`/`user_id`/
// `employee_id` (contrato de tela §5.4/§8, fecha `GAP-BSS-09` na origem).
// ============================================

export interface BullSeedSeasonProductPayload {
  warehouse_uuid: string | null;
  product_uuid: string;
  quantity: number;
}

export interface BullSeedSeasonUpsertPayload {
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  description: string;
  breeding_season_uuid: string;
  /** Array de uuids — pode vir vazio (`GAP-BSS-06`, sem `min:1`). */
  animals: string[];
  /** Pode vir vazio (`GAP-BSS-06`, sem `min:1`). */
  products: BullSeedSeasonProductPayload[];
}

// ============================================
// FILTRO (drawer da listagem, Tarefa 24 — Contrato B)
// ============================================

export interface BullSeedSeasonFilterRequest {
  /** 'YYYY-MM-DD'. */
  start_date?: string;
  /** 'YYYY-MM-DD'. */
  end_date?: string;
}

// ============================================
// REACT HOOK FORM — formulário único de criação/edição (Tarefa 25, contrato
// de tela §5). 2 subcadastros dinâmicos via `useFieldArray`: `animals`
// (repetidor de 1 `Select` por linha, sobre `animal-options`) e `products`
// (repetidor com cascata OPCIONAL Armazém→Produto por linha). Nenhum dos 2
// arrays tem `.min(1)` no schema Yup (`GAP-BSS-06`, mirror exato — servidor
// aceita vazio, paridade com o legado).
// ============================================

/** Linha do repetidor "Animais" — 1 `Select`+`useQuery` sobre `animal-options`. */
export interface BullSeedSeasonAnimalFieldValue {
  animal: Option<string> | null;
}

/**
 * Linha do repetidor "Produtos" — `warehouse` é OPCIONAL (nullable no pivot,
 * armadilha 3 da Tarefa 25); `product` vem de `product-options` (sem
 * armazém) ou `products-by-warehouse` (com armazém). UM/Estoque NUNCA
 * entram aqui — são derivados de `product-detail` (useQuery por linha,
 * disparado pela seleção do produto), sempre read-only, nunca no payload.
 */
export interface BullSeedSeasonProductFieldValue {
  warehouse: Option<string> | null;
  product: Option<string> | null;
  quantity: number | string;
}

/**
 * Formulário único (`CreateOrUpdateBullSeedSeason.tsx`) — `code` é sempre
 * read-only (sugestão em criação, valor existente em edição) mas VIAJA no
 * payload como está (`GAP-BSS-05`, sem `unique` no backend).
 */
export interface BullSeedSeasonForm {
  code: string;
  /** 'YYYY-MM-DD'. */
  date: string;
  description: string;
  breeding_season: Option<string> | null;
  animals: BullSeedSeasonAnimalFieldValue[];
  products: BullSeedSeasonProductFieldValue[];
}
