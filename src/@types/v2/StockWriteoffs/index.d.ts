// src/@types/v2/StockWriteoffs/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo ADMINISTRATIVO — Baixa de Estoque (StockWriteoff) — esteira
// 038, fatia READ (TASK-FE-3001/3002/3003). Modelado por leitura direta do
// contrato de API (`StockWriteoffResource`, branch `feature/038-baixa-estoque`
// do `GB.Cerne.Api` — 100% uuid, SEM D-FRONT-01).
//
//   GET    /api/v1/stock-writeoffs          → paginado (envelope `meta`),
//                                              listagem (`StockWriteoffResource`,
//                                              MESMO shape do show)
//   GET    /api/v1/stock-writeoffs/{uuid}   → detalhe (`StockWriteoffResource`)
//   DELETE /api/v1/stock-writeoffs/{uuid}   → 204 (restaura estoque no backend, D2)
//
// SEM `update`/`edit` (`apiResource(...)->only([index,store,show,destroy])`) —
// a Baixa não tem edição (contrato de tela §2.1). `cost_center` é SEMPRE
// `null` no Resource (D3, fidelidade AS-IS) — NUNCA modelar como objeto
// preenchido nem renderizar no front.
//
// Fatia WRITE (TASK-FE-3004/3005/3006, esteira 038) — tipos de form/payload
// de criação, filtro de relatório e handoff de NFe. `StockWriteoffRequest`
// (`POST /stock-writeoffs`) é 100% uuid (SEM D-FRONT-01); `items[]` recebe
// `product_uuid`+`lot` separados (NÃO `stock_uuid`) — a linha do formulário
// seleciona uma linha de ESTOQUE (`stock.uuid`, `GET /stocks?warehouse_uuid=`)
// só para hidratar saldo/unidade/custo médio/lote; o mapeamento para o
// payload vive em `stock-writeoff-form-mapper.ts` (§4.3 do plano de front).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADOS (leitura — sempre uuid + description/name, `whenLoaded`)
// ============================================

export interface StockWriteoffWarehouseRef {
  uuid: string;
  description: string;
}

export interface StockWriteoffUserRef {
  uuid: string;
  name: string;
}

export interface StockWriteoffProductRef {
  uuid: string;
  code: string;
  description: string;
}

// ============================================
// ITEM (linha do bloco de itens — leitura, `whenLoaded`)
// ============================================

export interface StockWriteoffItem {
  product: StockWriteoffProductRef | null;
  /** Quantidade da linha. */
  quantity: number;
  /** Valor UNITÁRIO reconstituído pelo backend (`amount/quantity`, DV-008/CV-008)
   *  — exibir como está, NUNCA recalcular no front. */
  value: number;
  /** Valor TOTAL da linha (`value * quantity`, calculado pelo backend). */
  amount: number;
  lot: string | null;
}

// ============================================
// RESOURCE (`StockWriteoffResource`) — MESMO shape em index e show (contrato
// de tela §2.2). `items` só vem populado quando a relação foi carregada
// (`whenLoaded` — `undefined` = não carregada, `[]` = carregada sem linhas).
// ============================================

export interface StockWriteoffData {
  uuid: string;
  code: string;
  /** Data de referência da baixa (`Y-m-d`) — distinta de `created_at` (grid/
   *  detalhe exibem `created_at`, D7 do contrato de tela). */
  date: string;
  /** `StockWriteoffTypeEnum` (1..13). */
  type: number;
  type_label: string;
  type_note: string | null;
  justification: string;
  /** `whenLoaded` — `null` quando o armazém não pôde ser carregado/resolvido. */
  warehouse: StockWriteoffWarehouseRef | null;
  /** SEMPRE `null` no Resource (D3 — fidelidade AS-IS); o front NUNCA renderiza. */
  cost_center: null;
  /** `whenLoaded` — `null` quando o usuário responsável não pôde ser carregado/resolvido. */
  user: StockWriteoffUserRef | null;
  /** `whenLoaded` — presente quando já há NFe vinculada (handoff cross-feature,
   *  D-FE-BE-05, ação "Emitir NFe" — fora desta fatia READ). */
  nfe_uuid: string | null;
  items?: StockWriteoffItem[];
  created_at: string;
}

// ============================================
// FILTRO (drawer da listagem) — só `created_at` (`start_date`/`end_date`, D7)
// — mirror EXATO `StockCorrectionFilterForm` (mesma disciplina: sem `search`,
// a API não expõe busca textual nesta listagem, contrato de tela §2.3).
// ============================================

export interface StockWriteoffFilterForm {
  start_date?: string;
  end_date?: string;
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`)
// ============================================

export interface StockWriteoffsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface StockWriteoffsListEnvelope {
  success: boolean;
  message: string;
  data: StockWriteoffData[];
  errors: Record<string, string[]> | null;
  meta: StockWriteoffsApiPaginationMeta | null;
}

// ============================================
// FORM — bloco de itens (create, TASK-FE-3004). A linha seleciona uma
// LINHA DE ESTOQUE (`GET /stocks?warehouse_uuid=`, value = `stock.uuid`,
// label "produto — lote") para hidratar readonly `unit`/`saldo`/
// `average_cost`/`lot` — o payload usa `product_uuid`+`lot` (embutidos na
// própria Option pelo `mapOptions`, mirror `AppropriationStockTab.tsx`/
// `ServiceOrderProductTab.tsx`), NUNCA `stock_uuid` (não existe no wire).
// ============================================

export type StockWriteoffStockOption = Option<string> & {
  product_uuid: string;
  lot: string | null;
  unit: string;
  /** Saldo disponível (`StockListItem.quantity`) — usado no clamp CV-002
   *  (`NumberInput max`) e na exibição readonly da linha. */
  saldo: number;
  average_cost: number;
};

export interface StockWriteoffItemForm {
  stock: StockWriteoffStockOption | null;
  quantity: number | null;
  /** Valor UNITÁRIO — editável (autofill de `average_cost` na seleção do
   *  estoque, sem travar o campo); `amount` (total) é SÓ EXIBIÇÃO
   *  (`quantity * value`, CV-004), nunca um campo RHF (não vai ao payload,
   *  o backend recalcula). */
  value: number | null;
}

// ============================================
// FORM — bloco de anexos (create, TASK-FE-3004). `file: null` com `name`
// preenchido é um estado transitório (linha ainda incompleta) — o mapper
// filtra linhas sem `file` antes do submit (attachments é `sometimes`).
// ============================================

export interface StockWriteoffAttachmentForm {
  name: string;
  file: File | null;
}

// ============================================
// FORM — formulário de criação completo (TASK-FE-3004). `cost_center` é
// UI-ONLY (D-FE-BE-04/D3) — exibido por fidelidade ao legado, NUNCA
// obrigatório, e o mapper o envia como `center` (nome de campo do legado)
// mesmo sabendo que o backend aceita e DESCARTA (não persiste, não valida).
// ============================================

export interface StockWriteoffForm {
  date: string;
  type: Option<number> | null;
  type_note: string | null;
  warehouse: Option<string> | null;
  justification: string;
  cost_center: Option<string> | null;
  items: StockWriteoffItemForm[];
  attachments: StockWriteoffAttachmentForm[];
}

// ============================================
// PAYLOAD — `POST /stock-writeoffs` (`StockWriteoffRequest`/
// `StockWriteoffData` do backend — mesmo nome de tipo do Resource de
// leitura acima NÃO colide porque este vive só no service, nunca importado
// junto do tipo de leitura no mesmo arquivo de página).
// ============================================

export interface StockWriteoffItemPayload {
  product_uuid: string;
  quantity: number;
  value: number;
  lot: string | null;
}

export interface StockWriteoffAttachmentPayload {
  name: string;
  file: File;
}

export interface StockWriteoffCreatePayload {
  date: string;
  warehouse_uuid: string;
  type: number;
  type_note?: string;
  justification: string;
  items: StockWriteoffItemPayload[];
  attachments?: StockWriteoffAttachmentPayload[];
  /** D3/D-FE-BE-04 — fidelidade AS-IS ao legado (campo `center` do Blade
   *  legado, `GAP-038-BE-baixa-estoque-decisoes-do-dono.md`). A API aceita e
   *  DESCARTA silenciosamente (NÃO persiste, NÃO valida, NÃO gera 422) —
   *  nunca modelar como se fosse um `center_uuid` real do contrato. */
  center?: string;
}

// ============================================
// RELATÓRIO (TASK-FE-3005) — `GET /stock-writeoffs/report`, PDF cru
// (`application/pdf`, `Content-Disposition: inline`) — NÃO envelope
// `ApiResponse`. `warehouse` é required (FM-003); `product`/datas opcionais
// (FM-004..006, sobre `date`, não `created_at`).
// ============================================

export interface StockWriteoffReportFilterForm {
  warehouse: Option<string> | null;
  product: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

export interface GetStockWriteoffReportParams {
  warehouse_uuid: string;
  product_uuid?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// HANDOFF "EMITIR NFE" (TASK-FE-3006/exec-038, D-FE-BE-05 — cross-feature).
// `nfe-draft` pré-preenche a CRIAÇÃO da Nfe (feature Nfe, `/fiscal/nfe-
// emitidas/novo`) a partir da baixa — mirror legado `StockWriteoffController
// @nfe()` (monta `session('nfe')` + `redirect()->route('nfe.create')`).
// Shape CONFIRMADO por leitura direta de
// `App\Actions\StockWriteoff\PrepareNfeDraftFromStockWriteoffAction::handle()`
// (GB.Cerne.Api, branch feature/038-baixa-estoque-lista-os) — campos
// obrigatórios (a Action sempre os popula; `items` pode ser `[]` quando a
// baixa não tem itens, nunca `undefined`). Unitário = `amount/quantity`
// (CV-007/CV-008, DV-008 preservado). `date`/`warehouse_uuid` não têm campo
// de cabeçalho equivalente em `NfeForm` (a Nfe não tem "armazém"/"data" no
// cabeçalho — só por item) — usados apenas para hidratar `items[].
// warehouse_uuid` no front (`CreateOrUpdateNfe.tsx`); `date` fica sem uso,
// mirror o legado (`StockWriteoffController@nfe` também não mapeia nenhuma
// data para o form da Nfe).
// ============================================

export interface StockWriteoffNfeDraftItem {
  product_uuid: string;
  product_description: string;
  quantity: number;
  unit_value: number;
  total: number;
}

export interface StockWriteoffNfeDraft {
  warehouse_uuid: string;
  date: string;
  items: StockWriteoffNfeDraftItem[];
  total: number;
}

export interface LinkNfeToStockWriteoffPayload {
  nfe_uuid: string;
}
