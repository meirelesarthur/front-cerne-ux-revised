// src/@types/language/module-financial/ofx-import.d.ts
// -----------------------------------------------------------------------------
// Tipo de tradução do Relatório de Conciliação de Contas Consolidadas
// (RelatorioConsolidado — SURF-033/034). Chave irmã de `expense`/
// `mercadoPago` dentro de `ModuleFinancial` (`financial.ofxImport.*`).
//
// ESCOPO REDUZIDO (TASK-065-OFX-FE-01, reconciliação de merge 065 — ver
// 97-Esteiras/065/ROTEIROS/arquitetura-reconciliacao-ofx-frontend.md §8):
// as seções `list`/`filter`/`form`/`reconciliation`/`monthlyReport`
// (Importação OFX, Conciliação OFX, Meses Conciliados — as 4 telas do
// núcleo original desta chave) foram PRUNADAS — telas correspondentes
// descartadas/reconstruídas em módulo próprio (`OfxImport/`,
// `languageOfxImports`). Só `consolidatedReport` sobrevive aqui — único
// consumidor vivo: `RelatorioConsolidado/index.tsx` +
// `account-reconciliation-report-filter-schema.ts`.
//
// AMPLIAÇÃO (F-213 "Conciliação de Contas", lote 079, rework FE 3 ajustes) —
// `filterButton`/`emptyBeforeFilter`/`previewError`/`retryButton`/
// `recordsCount`/`table`/`movementTypes` NOVOS: a tela ganha uma tabela de
// prévia em tela (botão "Filtrar", mirror do legado) além dos 2 botões de
// export já existentes (`downloadPdfButton`/`downloadExcelButton`, mantidos
// — ver plano-frontend-rework §3.3). `emptyState` (JÁ EXISTENTE) passa a ser
// usada como mensagem de "filtrou e não achou nada" (`emptyReport`).
// -----------------------------------------------------------------------------

export interface OfxImportLanguage {
  singularLabel: string;
  pluralLabel: string;

  consolidatedReport: {
    pageTitle: string;
    pageSubtitle: string;
    accountLabel: string;
    startDate: string;
    endDate: string;
    conditionLabel: string;
    /** Mirror exato do FIL-012 do legado (`account_report`, `condition`
     *  0/1): alterna SÓ a presença dos joins de categoria/centro no mesmo
     *  relatório, não uma escolha exclusiva "por categoria OU por centro". */
    conditionOptions: {
      withoutCategory: string;
      withCategory: string;
    };
    providerLabel: string;
    providerPlaceholder: string;
    clientLabel: string;
    clientPlaceholder: string;
    accountPlaceholder: string;
    orderByLabel: string;
    /** Mirror exato do FIL-015 do legado (`order_by`: `ORDER BY date,id`,
     *  valores `desc`/`asc`) — enum FECHADO, front nunca expõe texto livre. */
    orderByOptions: {
      recent: string;
      oldest: string;
    };
    periodRequiredHint: string;
    downloadPdfButton: string;
    downloadExcelButton: string;
    downloadError: string;
    /** "Buscou e não achou nada" (prévia em tela) — mirror da mensagem de vazio do legado. */
    emptyState: string;
    /** Botão "Filtrar" — dispara `GET /account-reconciliation-report` (JSON) e mostra a tabela na tela. */
    filterButton: string;
    /** Mensagem antes de qualquer busca (estado inicial, antes do 1º "Filtrar"). */
    emptyBeforeFilter: string;
    /** Erro ao buscar a prévia (rede/servidor) — acompanha `retryButton`. */
    previewError: string;
    retryButton: string;
    /** Contagem de linhas da prévia (mirror "N. Registros:" do legado) — total client-side. */
    recordsCount: (count: number) => string;
    /** Cabeçalhos da tabela de prévia — mirror `GenerateAccountReconciliationReportAction::FIXED_COLUMNS`/`CONDITIONAL_COLUMNS`. */
    table: {
      document: string;
      participant: string;
      movementType: string;
      date: string;
      account: string;
      value: string;
      category: string;
      center: string;
    };
    /** Mirror LITERAL de `App\Enums\MovementType::description()` (E/S/A/T/M/F). */
    movementTypes: {
      income: string;
      expense: string;
      both: string;
      internalTransaction: string;
      movement: string;
      financing: string;
    };
  };
}
