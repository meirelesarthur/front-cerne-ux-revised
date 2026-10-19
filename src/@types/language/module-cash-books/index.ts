// src/@types/language/module-cash-books/index.ts
// Interface de tradução do módulo CashBook (LCDPR — Livro Caixa Digital do
// Produtor Rural), domínio Fiscal, execução 045, TASK-LCDPR-FE-01. Namespace
// TOP-LEVEL `cashBooks` (não aninhado sob `fiscal.*`) — mirror do padrão REAL
// já em produção (`nfes`/`dfes`, ver divergência documentada em
// `query-key.ts`), não do namespace `fiscal.cashBook` presumido pelo
// `CONTRATO-FRONT-LCDPR.md §2` (que citava um `fiscal.*` que não existe em
// nenhum outro módulo deste arquivo).
//
// Os rótulos LITERAIS dos 3 enums (`period`/`special`/`verification`) NÃO
// entram aqui — o backend (`CashBookResource`/`CashBookDetailResource`) já
// devolve `{value, label}` com o texto legal fixo (sem i18n, nem no
// backend); o Detalhe usa esse `label` direto da API. As options ESTÁTICAS
// do formulário de Cadastro (Select sem fonte de API) vivem em
// `src/constants/fiscal/cashBook/cash-book-*.ts`, com o mesmo texto literal
// hardcoded (não uma chave de tradução) — decisão documentada no cabeçalho
// desses arquivos.
export interface ModuleCashBooks {
  cashBook: {
    singularLabel: string;
    pluralLabel: string;

    // ============================================
    // Listagem — /fiscal/livro-caixa (TASK-LCDPR-FE-02)
    // ============================================
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        year: string;
        proprietary: string;
        contador: string;
      };
      actions: {
        view: string;
        downloadTxt: string;
        printReport: string;
        delete: string;
      };
      downloadTxtError: string;
      downloadReportError: string;
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
      deleteSuccess: string;
      deleteError: string;
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        titleFiltered: string;
        descriptionFiltered: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };

    // ============================================
    // Filtro do index — FilterSideCashBook (TASK-LCDPR-FE-02)
    // ============================================
    filter: {
      title: string;
      year: string;
      yearPlaceholder: string;
      proprietary: string;
      proprietaryPlaceholder: string;
      proprietaryAll: string;
    };

    // ============================================
    // Cadastro (create-only) — CreateCashBook (TASK-LCDPR-FE-03)
    // ============================================
    form: {
      pageTitle: string;
      pageSubtitle: string;
      fields: {
        startDate: string;
        endDate: string;
        proprietary: string;
        proprietaryPlaceholder: string;
        period: string;
        periodPlaceholder: string;
        special: string;
        specialPlaceholder: string;
        dtSpecial: string;
        verification: string;
        verificationPlaceholder: string;
        contador: string;
        contadorPlaceholder: string;
      };
      validation: {
        startDateRequired: string;
        endDateRequired: string;
        endDateNotBeforeStart: string;
        endDateNotTodayOrFuture: string;
        endDateSameYearAsStart: string;
        dateInvalid: string;
        dateMinYear: string;
        dtSpecialAfterEnd: string;
        proprietaryRequired: string;
        proprietaryCpfRequired: string;
        periodRequired: string;
        specialRequired: string;
        dtSpecialRequired: string;
        verificationRequired: string;
        contadorRequired: string;
      };
      createSuccess: string;
      createGenericError: string;
      cancelButton: string;
      submitButton: string;
    };

    // ============================================
    // Detalhe (show) — CashBookDetalhe (TASK-LCDPR-FE-04)
    // ============================================
    detail: {
      pageTitle: string;
      metadata: {
        year: string;
        proprietary: string;
        period: string;
        special: string;
        dtSpecial: string;
        dtSpecialEmpty: string;
        verification: string;
        contador: string;
      };
      monthly: {
        title: string;
        table: {
          month: string;
          entrance: string;
          exit: string;
          balance: string;
        };
        totalsLabel: string;
      };
      actions: {
        downloadTxt: string;
        printReport: string;
        delete: string;
      };
      downloadTxtError: string;
      downloadReportError: string;
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
      deleteSuccess: string;
      deleteError: string;
      loadError: {
        message: string;
        retry: string;
      };
    };
  };
}
