// src/@types/language/module-system-logs/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do "Visualizador de Logs" (SystemLogs — Administrativo
// › Sistema › Logs do Sistema, execução 079). Chave PLANA de primeiro nível em
// `LanguageDate` (`systemLogs`), mirror de `supplyStatusSlas`. O conteúdo mora
// em src/constants/languages/{idioma}/languageSystemLogs.ts.
//
// Placeholders `{nome}` são substituídos pela tela (`.replace`) — nenhuma
// string de UI fica hardcoded nos componentes.
// -----------------------------------------------------------------------------

export interface ModuleSystemLogs {
  systemLog: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;

    // ============================================
    // EXPLORADOR (/administrativo/logs)
    // ============================================
    explorer: {
      pageTitle: string;
      pageSubtitle: string;
      breadcrumbAriaLabel: string;
      breadcrumbRoot: string;
      table: {
        name: string;
        size: string;
        modifiedAt: string;
        actions: string;
        folder: string;
        file: string;
        sortBy: string;
      };
      actions: {
        open: string;
        download: string;
        refresh: string;
      };
      filter: {
        placeholder: string;
        ariaLabel: string;
        clear: string;
      };
      truncatedNotice: string;
      emptyState: { title: string; description: string };
      noResultsState: { title: string; description: string; clear: string };
      notFoundState: { title: string; description: string; back: string };
      error: { message: string; retry: string };
    };

    // ============================================
    // VISUALIZADOR (/administrativo/logs/arquivo)
    // ============================================
    viewer: {
      pageTitle: string;
      pageSubtitle: string;
      fields: { size: string; modifiedAt: string };
      actions: {
        refresh: string;
        download: string;
        backToFolder: string;
        loadOlder: string;
        wrapLines: string;
        backToEnd: string;
        retry: string;
      };
      contentAriaLabel: string;
      emptyFile: string;
      startOfFile: string;
      /** `{lines}` e `{size}` */
      loadedSummary: string;
      limitReached: string;
      lineTruncated: string;
      partialLine: string;
      sizeChangedWarning: string;
      contextNotice: string;
      loadMoreError: string;
      error: { message: string };
      notFoundState: { title: string; description: string; back: string };
      binaryState: { title: string; description: string };
      invalidCursorState: { title: string; description: string; action: string };
      missingPathState: { title: string; description: string; back: string };
    };

    // ============================================
    // BUSCA NO ARQUIVO INTEIRO (feita pela API, parâmetro `q`)
    // ============================================
    search: {
      placeholder: string;
      ariaLabel: string;
      submit: string;
      clear: string;
      scopeNote: string;
      /** `{min}` */
      minChars: string;
      resultsTitle: string;
      /** `{count}` */
      resultCount: string;
      noResults: string;
      loadMore: string;
      moreAvailable: string;
      openContext: string;
      lineTruncated: string;
      error: string;
    };

    // ============================================
    // DOWNLOAD (blob com progresso)
    // ============================================
    download: {
      success: string;
      error: string;
      /** `{percent}` */
      progress: string;
      inProgress: string;
      /** `{name}` */
      ariaLabel: string;
    };
  };
}
