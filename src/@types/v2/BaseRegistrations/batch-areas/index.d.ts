// src/@types/v2/BaseRegistrations/batch-areas/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do vínculo Lote/Área (BatchArea, N:N Batch×Area) — API v1 do backend
// Laravel GB.Cerne. TASK-FE-2100 (fundação de dados — execução 029). Irmã
// estrutural de `BatchGrazing` (`@/@types/v2/BaseRegistrations/batch-grazings`),
// trocando Módulo por Área.
//
// Contrato de API (`contrato-lote-area.md`, v1.0 AUTOAPROVADO, GATE
// resolvido — envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /batch-areas                          → data: BatchAreaListItem[],
//                                                   meta REAL (`ApiResponse::paginated`,
//                                                   10/página default). Agregados de
//                                                   ÍNDICE (§7, nota) — DIFERENTES dos
//                                                   agregados de detalhe abaixo.
//   GET    /batch-areas/{uuid}                   → data: BatchAreaData — agregados de
//                                                   VISUALIZAÇÃO (§7), conjunto
//                                                   DIFERENTE do índice.
//   POST   /batch-areas                          → payload BatchAreaPayload.
//   DELETE /batch-areas/{uuid}                   → 204 (não-destrutivo, D12).
//   DELETE /batch-areas/{uuid}/batches/{batchUuid} → 204 (não-destrutivo, D12).
//
// ⚠️ DIVERGÊNCIA REAL, NÃO É BUG (contrato de API §7): `ua_total` (soma de UA
// de todos os lotes vinculados, existe SÓ no preview de criação) e
// `average_ua_per_batch` (UA do peso MÉDIO por animal, persistido, exposto no
// detalhe) NÃO são a mesma métrica — são 2 perguntas diferentes. `ua_total`
// NUNCA aparece em `BatchAreaData` (DoD da TASK-FE-2100) — só existe no tipo
// de preview de criação (`BatchAreaCreatePreviewMetrics`, abaixo).
//
// `ua_suporte` ("UA/Suporte") — decisão do dono (D9, GATE aprovado 2026-08-05):
// exibida LITERAL (cabeças/hectare, `animals_quantity ÷ hectares`), NÃO
// corrigida para UA verdadeira apesar do rótulo. Sem coluna própria
// persistida — só existe como preview de criação, recalculada no client a
// partir de valores já disponíveis.
//
// `employee` — mesma cautela de `BatchGrazingListItem`: a coluna física
// `employee_id` nunca é preenchida por este fluxo (D11 do contrato de API) —
// consumidores usam sempre `?.`.
//
// `uuid` sempre; `id` sequencial nunca.
//
// Fonte: `contrato-lote-area.md` (API) + `contrato-fe-lote-area.md` (tela),
// `TASK-FE-2100`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// BATCH AREA — ÍNDICE (`GET /batch-areas`) — agregados de ÍNDICE (§7, nota:
// "índice legado usa os agregados diferentes do show()").
// ============================================

export interface BatchAreaListItem {
  uuid: string;
  code: string;
  area: { uuid: string; description: string };
  batches: Array<{ uuid: string; description: string }>;
  date: string;
  employee: { uuid: string; name: string | null } | null;
  animals_quantity: number;
  ua_total: number;
  taxa_lotacao_ua: number;
}

// ============================================
// BATCH AREA — DETALHE (`GET /batch-areas/{uuid}`) — agregados de
// VISUALIZAÇÃO (§7 do contrato de API), conjunto DIFERENTE do índice acima.
// SEM `ua_total` — NUNCA declarar esse campo aqui (é métrica de preview de
// criação, não dado persistido do vínculo, DoD da TASK-FE-2100).
// ============================================

export interface BatchAreaData {
  uuid: string;
  code: string;
  area: { uuid: string; description: string };
  date: string;
  employee: { uuid: string; name: string | null } | null;
  batches: Array<{ uuid: string; description: string }>;
  animals_quantity: number;
  weight_total_kg: number;
  weight_average_kg: number;
  average_ua_per_batch: number;
  hectares: number;
}

// ============================================
// REQUEST TYPES
// ============================================

// `farm_id`/`code`/`user_id` NUNCA aqui — resolvidos pelo backend (§9 do
// contrato de API). `batches` é `min:1` no servidor (§5.1).
export interface BatchAreaPayload {
  area_uuid: string;
  date: string;
  batches: string[];
}

// ============================================
// PREVIEW DE CRIAÇÃO (client-side, `CreateBatchArea.tsx`) — `ua_total` SÓ
// existe AQUI (DoD da TASK-FE-2100: nunca no tipo de detalhe persistido
// acima). `hectares` é o ÚNICO valor com preview REAL (vem da Área
// selecionada, `AreaListItem.total_area`) — os demais ficam `null` até
// salvar: `GET /batches/options` (`BatchOption`) só expõe `{ uuid, label }`,
// sem peso/quantidade de animal por lote (achado factual documentado em
// `CreateBatchArea.tsx`).
// ============================================

export interface BatchAreaCreatePreviewMetrics {
  hectares: number | null;
  animals_quantity: number | null;
  ua_total: number | null;
  ua_suporte: number | null;
  taxa_lotacao_ua: number | null;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface BatchAreasListEnvelope {
  success: boolean;
  message: string;
  data: BatchAreaListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

// ============================================
// FILTRO (drawer da listagem, TASK-FRONT-1 — esteira 063-est03-9-
// reprovacoes, roteiro `lote-area-f143-roteiro.md §2`, Contrato B).
// Restaura os 2 filtros que existiam no legado (`AreaBatchController::
// index()`) e que a migração (execução 029) tinha deliberadamente omitido
// só para esta tela — `BatchGrazings` (módulo irmão) permanece SEM filtro,
// não é revertido por esta correção.
//
// Mirror estrutural de `WarehouseTransferFilterForm`/`FilterRequest`
// (`@/@types/v2/WarehouseTransfers`) e `NutritionFilterForm`/
// `NutritionFilterRequest` (`@/@types/v2/Nutritions`) — 2 tipos, não 1:
//   `BatchAreaFilterForm`    → Option-based, consumido por `userPaginatedQuery`
//     E pelo formulário RHF interno de `FilterSideBatchAreas.tsx`.
//   `BatchAreaFilterRequest` → querystring REAL de `GET /batch-areas`
//     (`area_uuid`/`batch_uuid`, `BatchAreaFilterData` do backend) —
//     achatamento feito por `toRequestFilter` em `index.tsx`, NUNCA dentro
//     do FilterSide.
// ============================================

export interface BatchAreaFilterForm {
  area_uuid?: Option | null;
  batch_uuid?: Option | null;
}

/** Querystring real de `GET /batch-areas` (`BatchAreaFilterData`, campos
 *  `area_uuid`/`batch_uuid` já aceitos pelo backend — TASK-FRONT-1 só liga
 *  o front, nenhuma mudança de API). */
export interface BatchAreaFilterRequest {
  area_uuid?: string;
  batch_uuid?: string;
}

// ============================================
// LOTES ELEGÍVEIS (`GET /batch-areas/eligible-batches`, adendo pós-E2E
// Achados 3+4 — `contrato-adendo-lotes-elegiveis-metricas.md §3.1`,
// TASK-FE-2105) — alimenta o `CheckboxListField` "Lote" da criação
// (`CreateBatchArea.tsx`), SUBSTITUINDO `GET /batches/options`
// (`BatchOption`, `@/@types/v2/Batches`) nesta tela. Mesma regra de
// elegibilidade de `EligibleBatchGrazing` (mirror exato, §2 do adendo — só
// lotes ACTIVE sem Módulo nem Área vinculado). SEM a entrada sintética "Sem
// lote".
//
// `quantity_animal`/`weight` alimentam o preview ao vivo (Quant/Animais,
// Quant/UA, UA/Suporte, Taxa de Lotação) — front deriva `ua = weight / 450`
// e `ua_suporte = quantity_animal / hectares` (D3/§7 do adendo).
// ============================================
export interface EligibleBatchArea {
  uuid: string;
  label: string;
  quantity_animal: number;
  weight: number;
}

export interface EligibleBatchAreasEnvelope {
  success: boolean;
  message: string;
  data: EligibleBatchArea[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// ÁREAS ELEGÍVEIS (`GET /batch-areas/eligible-areas`, correção pós-
// reprovação de fidelidade — esteira 061-reprovacoes,
// `roteiro-lote-area-fidelidade.md §4.1`) — mirror EXATO de
// `EligibleBatchArea`/`EligibleBatchAreasEnvelope` acima, trocando Lote por
// Área. Alimenta o Select "Área" da criação (`CreateBatchArea.tsx`),
// SUBSTITUINDO o loop de páginas sobre `GET /areas` (que listava TODAS as
// áreas ativas, inclusive já vinculadas — mirror do filtro
// `AreaBatchController::create()` do legado: só áreas SEM módulo e SEM lote
// vinculado). `total_area` preserva o preview de Hectares
// (`CreateBatchArea.tsx`, `selectedArea?.total_area`).
// ============================================
export interface EligibleArea {
  uuid: string;
  label: string;
  total_area: number;
}

export interface EligibleAreasEnvelope {
  success: boolean;
  message: string;
  data: EligibleArea[];
  errors: Record<string, string[]> | null;
  meta: null;
}
