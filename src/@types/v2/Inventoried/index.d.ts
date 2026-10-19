// src/@types/v2/Inventoried/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo INVENTARIADO (Inventoried) — API v1 do backend Laravel
// GB.Cerne (Operacional → Pecuária → Inventariado), F-041, execução
// CORE_WORKSPACE/97-Esteiras/060.
//
// Contrato (contract-inventoried-animals-screen.md + contract-inventoried-
// animals-slice.md, CONTRATO_AUTOAPROVADO):
//   GET    /api/v1/inventoried-animals            → data: InventoriedListItem[] + meta (paginação FIXA 10/página)
//   GET    /api/v1/inventoried-animals/{uuid}      → data: InventoriedDetail (TASK-INV-FE-04)
//   GET    /api/v1/inventoried-animals/download    → binário .xlsx (template)
//   POST   /api/v1/inventoried-animals/import      → multipart `file`; sucesso (201): InventoriedDetail (mesmo shape do show); 422: errors.rows: string[]
//   GET    /api/v1/inventoried-animals/{uuid}/report → binário PDF
//   DELETE /api/v1/inventoried-animals/{uuid}       → 204 (hard delete transacional)
//
// Sem `POST`/`PUT`/`PATCH` de CRUD unitário — a feature NÃO tem create/edit
// de campo a campo (fidelidade, legacy-contract-inventoried-animals.md
// SR-06). Import de planilha é o ÚNICO ponto de criação.
//
// Shapes abaixo casam EXATAMENTE com `InventoriedResource`/
// `InventoriedDetailResource` do backend (app/Http/Resources/V1/), lidos
// diretamente do código-fonte da API (não são um "shape resiliente"
// genérico — a [PARA ANÁLISE] §7.2/§7.3 do contrato de tela ficou resolvida
// por leitura direta do Resource já implementado):
//   - `date` é o NOME DO CAMPO no JSON (internamente = `created_at`, DEF-02)
//     — NÃO renomear para `created_at` no tipo, quebraria o consumo real.
//   - `responsavel` já vem FLAT (string | null) — resolvido server-side
//     (`user.people.name`), NÃO um objeto aninhado.
//   - `status` no detalhe já vem como objeto `{ value, label, color }` — o
//     `color` é o HEX FIEL AO LEGADO (`#4ade80`/`#fbbf24`/`#f87171`); o
//     front NUNCA renderiza esse hex cru — mapeia `value` para o token do
//     DS (`green.400`/`yellow.400`/`red.400`, ver
//     `src/constants/inventoried/inventoried-status.ts`), preferindo o
//     `label` da API para o texto (fonte única de verdade do rótulo).
// -----------------------------------------------------------------------------

// ============================================
// INVENTORIED — LISTAGEM (InventoriedResource)
// ============================================

export interface InventoriedListItem {
  uuid: string;
  /** "Data" da coluna — internamente `created_at` (DEF-02), NUNCA renomear aqui. */
  date: string;
  animals_count: number;
  em_lote: number;
  fora_do_lote: number;
  faltantes: number;
  /** `user.people.name` já resolvido pelo backend — `null` quando o responsável não pôde ser carregado. */
  responsavel: string | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — mirror `StockCorrectionsListEnvelope`
// ============================================

export interface InventoriedApiPaginationMeta {
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

export interface InventoriedListEnvelope {
  success: boolean;
  message: string;
  data: InventoriedListItem[];
  errors: Record<string, string[]> | null;
  meta: InventoriedApiPaginationMeta | null;
}

// ============================================
// STATUS DO ANIMAL NO INVENTÁRIO (InventoriedAnimalStatus, pivot 1/2/3)
// ============================================

export interface InventoriedAnimalStatusData {
  /** 1 = Em Lote · 2 = Fora do Lote · 3 = Faltantes na Planilha. */
  value: 1 | 2 | 3;
  /** Rótulo já resolvido pela API (`InventoriedAnimalStatus::label()`) — preferir este texto. */
  label: string;
  /** HEX fiel ao legado (`#4ade80`/`#fbbf24`/`#f87171`) — NUNCA renderizar cru; só a `value` decide o token do DS. */
  color: string;
}

// ============================================
// DETALHE (InventoriedDetailResource) — show E resultado de sucesso do import
// ============================================

export interface InventoriedDetailAnimal {
  /** `identification` do animal. */
  animal: string;
  /** Descrição do lote resolvida — `''` quando o lote não existe mais (FLD-SHOW-03). */
  lote: string;
  status: InventoriedAnimalStatusData;
}

export interface InventoriedDetail {
  uuid: string;
  /** "Data" — internamente `created_at` (DEF-02), NUNCA renomear aqui. */
  date: string;
  responsavel: string | null;
  animals: InventoriedDetailAnimal[];
}

// Resultado de sucesso do import (POST 201) — MESMO shape do detalhe
// (`InventoriedController::import()` devolve `InventoriedDetailResource`).
export type InventoriedImportResult = InventoriedDetail;
