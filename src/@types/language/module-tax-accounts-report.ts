// src/@types/language/module-tax-accounts-report.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Contas Tributárias" (relatório —
// domínio Financeiro, F-327, esteira 060,
// `CORE_WORKSPACE/97-Esteiras/060/ROTEIROS/ROTEIRO-F327-FRONT.md` §3.H).
// Módulo top-level próprio (mirror `module-weighing-stock-client-report.ts`),
// tela de filtro + download binário, SEM grid/prévia.
//
// `validation` (mirror `module-transfer-difference-report.ts`) alimenta o
// schema Yup (`tax-accounts-report-filter-schema.ts`) — zero string literal
// de mensagem de validação no código.
// -----------------------------------------------------------------------------

export interface ModuleTaxAccountsReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      isTaxation: string;
      costCenter: string;
      provider: string;
      format: string;
    };
    taxationOptions: {
      yes: string;
      no: string;
    };
    formatOptions: {
      pdf: string;
      xlsx: string;
    };
    downloadButton: string;
    downloadSuccess: string;
    downloadError: string;
    validation: {
      datesRequired: string;
      invalidDateRange: string;
    };
  };
}
