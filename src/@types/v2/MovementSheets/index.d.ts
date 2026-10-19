// src/@types/v2/MovementSheets/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de IMPORTAÇÃO DE MOVIMENTOS BANCÁRIOS (MovementSheet) — API
// v1 do backend Laravel GB.Cerne (Financeiro → Importação Mov. Bancários,
// F-112, 97-Esteiras/064).
//
// Contrato (arquitetura-movement-sheets-db-api.md §7, APROVADO):
//   GET  /api/v1/movement-sheets                 → data: MovementSheetListItem[] + meta (paginação CONFIGURÁVEL, default 10, max 100 — `MovementSheetIndexRequest`/`MovementSheetFilterData`, diferente da exceção fixa-15 de StockCorrection)
//   GET  /api/v1/movement-sheets/{uuid}           → data: MovementSheetDetail (TASK-064-MOV-FE-03)
//   GET  /api/v1/movement-sheets/download         → binário .xlsx em branco (TASK-064-MOV-FE-02)
//   POST /api/v1/movement-sheets/import           → multipart `file`; sucesso: MovementSheetImportResult (TASK-064-MOV-FE-02)
//
// Sem `POST`/`PUT`/`PATCH`/`DELETE` de CRUD unitário — o único ponto de
// criação é a importação de planilha (mode_matrix não tem modo `excluir`
// nem `editar`, diferente de StockCorrection que TEM exclusão).
//
// TASK-064-MOV-FE-01 (listagem + filtro + roteamento) cobre
// `MovementSheetListItem`/`MovementSheetsListEnvelope`/`MovementSheetFilterForm`.
// TASK-064-MOV-FE-02 ACRESCENTA `MovementSheetImportResult`, TASK-064-MOV-FE-03
// ACRESCENTA `MovementSheetDetail` — sem reescrever o que já existir.
// -----------------------------------------------------------------------------

// ============================================
// MOVEMENT SHEET — LISTAGEM (MovementSheetResource)
// ============================================

export interface MovementSheetListItem {
  uuid: string;
  code: string;
  /** Data de emissão do lote (`Y-m-d`) — CORRIGIDO (decisão 2): distinta do
   *  usuário responsável, sem a troca de rótulo do legado (CLM-19). */
  date: string;
  /** `whenLoaded` — `null` quando o usuário responsável não pôde ser carregado/resolvido. */
  user: { uuid: string; name: string } | null;
  created_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — mirror `StockCorrectionsListEnvelope`
// ============================================

export interface MovementSheetsApiPaginationMeta {
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

export interface MovementSheetsListEnvelope {
  success: boolean;
  message: string;
  data: MovementSheetListItem[];
  errors: Record<string, string[]> | null;
  meta: MovementSheetsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem) — só `date` (start_date/end_date, decisão 5:
// o filtro morto do legado — CLM-14 — agora tem efeito real no Repository).
// ============================================

export interface MovementSheetFilterForm {
  start_date?: string;
  end_date?: string;
}

// ============================================
// IMPORT EXCEL (ABORT-ALL) — resultado de sucesso (TASK-064-MOV-FE-02)
// ============================================

// Shape REAL confirmado por leitura direta de `MovementSheetImportResultData`/
// `MovementSheetData` (backend, `app/Data/MovementSheet/`) — `spatie/laravel-data`
// sem name-mapping (`config/data.php` não publicado nesta API), então as
// propriedades chegam EXATAMENTE como declaradas em PHP (camelCase
// `userUuid`/`userName`), diferente do `MovementSheetListItem.user` aninhado
// (`{uuid,name} | null`) usado pela listagem/detalhe (Resource, não Data).
// Só existe quando o import teve 100% de sucesso (abort-all: 422 aborta ANTES
// de qualquer persistência, este DTO nunca é construído nesse caso).
export interface MovementSheetImportResult {
  imported: number;
  movementSheet: {
    uuid: string;
    code: string;
    date: string;
    userUuid: string | null;
    userName: string | null;
  };
}

// ============================================
// DETALHE (Show, 100% leitura) — TASK-064-MOV-FE-03
// ============================================

// `MovementSheetResource` (mesmo Resource da listagem) NÃO amplia campos no
// show — idêntico a `MovementSheetListItem` (mirror confirmado contra o
// contrato de API §7; sem array de itens, diferente de StockCorrection).
export interface MovementSheetDetail {
  uuid: string;
  code: string;
  date: string;
  user: { uuid: string; name: string } | null;
  created_at: string;
}
