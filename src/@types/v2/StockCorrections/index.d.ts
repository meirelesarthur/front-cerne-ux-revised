// src/@types/v2/StockCorrections/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de CORREÇÃO DE ESTOQUE (StockCorrection) — API v1 do backend
// Laravel GB.Cerne (Administrativo → Estoque).
//
// Contrato ([[CorrecaoEstoque-contrato]], APROVADO):
//   GET    /api/v1/stock-corrections                    → data: StockCorrectionListItem[] + meta (paginação FIXA 15/página, sem `per_page` configurável)
//   GET    /api/v1/stock-corrections/{uuid}              → data: StockCorrectionDetail (TASK-FE-COR-02)
//   GET    /api/v1/stock-corrections/import/template     → binário .xlsx em branco
//   POST   /api/v1/stock-corrections/import              → multipart `file`; sucesso: StockCorrectionImportResult
//   DELETE /api/v1/stock-corrections/{uuid}               → 204 (reverte saldo + recalcula custo médio da fazenda)
//
// Sem `POST`/`PUT`/`PATCH` de CRUD unitário — o legado nunca teve
// create/store/edit/update de campo a campo para este recurso (fidelidade,
// contrato de API §1). Import de planilha é o ÚNICO ponto de criação.
//
// TASK-FE-COR-01 (listagem + import + exclusão) cobre `StockCorrectionListItem`/
// `StockCorrectionsListEnvelope`/`StockCorrectionFilterForm`/
// `StockCorrectionImportResult`. TASK-FE-COR-02 (detalhe read-only) ACRESCENTA
// `StockCorrectionItem`/`StockCorrectionDetail`, sem reescrever o que já existia.
// -----------------------------------------------------------------------------

// ============================================
// STOCK CORRECTION — LISTAGEM (StockCorrectionResource)
// ============================================

export interface StockCorrectionListItem {
  uuid: string;
  code: string;
  /** Data de referência da correção (`Y-m-d`) — distinta de `created_at` (contrato de tela §2.3). */
  date: string;
  /** `whenLoaded` — `null` quando o usuário responsável não pôde ser carregado/resolvido. */
  user: { uuid: string; name: string } | null;
  created_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — mirror `PlanAccountsListEnvelope`
// ============================================

export interface StockCorrectionsApiPaginationMeta {
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

export interface StockCorrectionsListEnvelope {
  success: boolean;
  message: string;
  data: StockCorrectionListItem[];
  errors: Record<string, string[]> | null;
  meta: StockCorrectionsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem) — só `created_at` (start_date/end_date), sem `search`
// (a API não expõe busca textual nesta listagem, contrato de tela §2.3).
// ============================================

export interface StockCorrectionFilterForm {
  start_date?: string;
  end_date?: string;
}

// ============================================
// IMPORT EXCEL — resultado ENXUTO (StockCorrectionImportResultResource),
// bem mais simples que `PlanAccountImportResult` (sem created/updated/
// deleted/preserved — a Correção de Estoque é sempre ADITIVA, nunca
// substitui/exclui correções existentes).
// ============================================

export interface StockCorrectionImportResult {
  code: string;
  rows_processed: number;
}

// ============================================
// DETALHE READ-ONLY (StockCorrectionDetailResource, TASK-FE-COR-02)
// ============================================

// Linha afetada pela correção (pivot `stock_stock_correction`) — `product`/
// `warehouse` nullable (o `Stock` associado pode não ter produto/armazém
// resolvido, contrato de tela §4.1).
export interface StockCorrectionItem {
  product: { uuid: string; description: string } | null;
  warehouse: { uuid: string; description: string } | null;
  lot: string | null;
  quantity: number;
  difference_quantity: number;
  average_cost: number;
  average_cost_value: number;
}

export interface StockCorrectionDetail extends StockCorrectionListItem {
  items: StockCorrectionItem[];
}
