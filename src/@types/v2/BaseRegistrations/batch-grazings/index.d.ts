// src/@types/v2/BaseRegistrations/batch-grazings/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do vínculo Lote/Módulo (BatchGrazing, N:N Batch×Grazing) — API v1 do
// backend Laravel GB.Cerne. TASK-FE-2000 (fundação de dados — execução 029).
//
// Contrato de API (`contrato-lote-modulo.md`, envelope ApiResponse
// { success, message, data, errors, meta }):
//   GET    /batch-grazings                          → data: BatchGrazingListItem[],
//                                                       meta REAL (`ApiResponse::paginated`,
//                                                       10/página default, §1.2 item 3).
//   GET    /batch-grazings/{uuid}                    → data: BatchGrazingData (mesmas
//                                                       métricas do índice + `batches[]`,
//                                                       §1.2 item 4 — mesmo shape do item
//                                                       de listagem, sem campo adicional).
//   POST   /batch-grazings                           → payload BatchGrazingPayload.
//   DELETE /batch-grazings/{uuid}                    → 204 (não-destrutivo, D3/D12).
//   DELETE /batch-grazings/{uuid}/batches/{batchUuid} → 204 (não-destrutivo, D3/D12).
//
// Métricas SEMPRE calculadas no backend (Action/Resource, D2 do contrato de
// API) — nunca recalculadas no client na listagem/detalhe (só a CRIAÇÃO faz
// preview client-side best-effort, ver `CreateBatchGrazing.tsx`).
//
// "UA/Suporte" NÃO EXISTE nesta feature (decisão G8/D5 do contrato de API —
// depende de `animal_load_ua_hec`, descartado definitivamente no contrato de
// Grazing) — NUNCA declarar esse campo aqui.
//
// `employee` — mirror da mesma cautela de `GrazingListItem`: a coluna física
// `employee_id` nunca é preenchida por este fluxo (§9 do contrato de API,
// D6), então o campo chega tipicamente `null`; consumidores usam `?.`.
//
// Fonte: `contrato-lote-modulo.md` (API, v1.0 AUTOAPROVADO) +
// `contrato-fe-lote-modulo.md` (tela, v1.0), `TASK-FE-2000`.
// -----------------------------------------------------------------------------

// ============================================
// BATCH GRAZING (resposta da API)
// ============================================

export interface BatchGrazingListItem {
  uuid: string;
  code: string;
  date: string;
  grazing: { uuid: string; description: string };
  batches: Array<{ uuid: string; description: string }>;
  employee: { uuid: string; name: string | null } | null;
  hectares: number;
  animals_quantity: number;
  ua_quantity: number;
  taxa_lotacao_ua: number;
}

// Shape do detalhe (`GET /batch-grazings/{uuid}`) — mesmo conjunto de campos
// do índice (contrato de API §1.2 item 4: "mesmo conjunto de métricas do
// índice + lista de lotes vinculados", já presente em `batches[]` acima).
export type BatchGrazingData = BatchGrazingListItem;

// ============================================
// REQUEST TYPES
// ============================================

// `farm_id`/`code`/`user_id` NUNCA aqui — resolvidos pelo backend (§9 do
// contrato de API). `batches` é `min:1` no servidor (§5.1) — o form valida
// isso também no client (TASK-FE-2002).
export interface BatchGrazingPayload {
  grazing_uuid: string;
  date: string;
  batches: string[];
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, 10/página default)
// ============================================

export interface BatchGrazingsListEnvelope {
  success: boolean;
  message: string;
  data: BatchGrazingListItem[];
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

// Sem filtro (mirror `Grazing`/`Fodder` — legado desta feature também não
// tem busca, `contrato-fe-lote-modulo.md §2`) — params da listagem são só
// `page`/`per_page` (`PaginationQueryParams`, `@/@types/pagination`).

// ============================================
// LOTES ELEGÍVEIS (`GET /batch-grazings/eligible-batches`, adendo pós-E2E
// Achados 3+4 — `contrato-adendo-lotes-elegiveis-metricas.md §3.1`,
// TASK-FE-2005) — alimenta o `CheckboxListField` "Lote" da criação
// (`CreateBatchGrazing.tsx`), SUBSTITUINDO `GET /batches/options`
// (`BatchOption`, `@/@types/v2/Batches`) nesta tela. Só lotes ACTIVE SEM
// Módulo nem Área vinculado (elegibilidade pura, §2 do adendo) — SEM a
// entrada sintética "Sem lote" (exclusiva de `BatchOption`, um vínculo
// nunca é "sem lote").
//
// `quantity_animal`/`weight` alimentam o preview ao vivo (Quant/Animais,
// Quant/UA, Taxa de Lotação) — front deriva `ua = weight / 450` (D3 do
// adendo: nenhuma métrica derivada ganha campo persistido no payload).
// ============================================
export interface EligibleBatchGrazing {
  uuid: string;
  label: string;
  quantity_animal: number;
  weight: number;
}

export interface EligibleBatchGrazingsEnvelope {
  success: boolean;
  message: string;
  data: EligibleBatchGrazing[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// MÓDULOS DE PASTEJO ELEGÍVEIS (`GET /batch-grazings/eligible-grazings`,
// correção pós-reprovação de fidelidade — esteira 061-reprovacoes,
// `roteiro-lote-modulo-fidelidade.md §4.1`) — mirror EXATO de
// `EligibleBatchGrazing`/`EligibleBatchGrazingsEnvelope` acima, trocando
// Lote por Módulo. Alimenta o Select "Módulo" da criação
// (`CreateBatchGrazing.tsx`), SUBSTITUINDO o fetch cru de `listGrazings`
// (que listava TODOS os módulos ativos, inclusive já vinculados — mirror do
// filtro `BatchGrazingController::create()` do legado: só módulos SEM lote
// vinculado). `areas_sum_total_area` preserva o preview de Hectares
// (`CreateBatchGrazing.tsx`, `selectedGrazing?.areas_sum_total_area`).
// ============================================
export interface EligibleGrazing {
  uuid: string;
  label: string;
  areas_sum_total_area: number;
}

export interface EligibleGrazingsEnvelope {
  success: boolean;
  message: string;
  data: EligibleGrazing[];
  errors: Record<string, string[]> | null;
  meta: null;
}
