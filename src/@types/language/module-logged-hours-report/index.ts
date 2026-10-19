// src/@types/language/module-logged-hours-report/index.ts
// Interface de tradução do módulo "Horas Logadas" (relatório de Gestão
// Pessoal — F-275, esteira 97-Esteiras/012, Tarefa 47 + correção pós-QA-
// manual). Mirror ESTRUTURAL de `module-income-statement-report/index.ts`,
// sem os campos de drill-down e sem prévia/grade em tela — filtro→clique→PDF
// direto, fiel ao legado `logged-hours-report` (agro365).

export interface ModuleLoggedHoursReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    fields: {
      startDate: string;
      endDate: string;
      tenant: string;
      farm: string;
    };
    tenantPlaceholder: string;
    farmPlaceholder: string;
    /** Título da seção de filtros (mirror `CashFlow/index.tsx:406`, Box/VStack
     *  com `Text fontSize="md" fontWeight="semibold"`). */
    filtersSectionTitle: string;
    /** Botão "Gerar PDF" do rodapé (mirror `printButton` de
     *  `module-production-area-report/index.ts`). */
    downloadPdfButton: string;
    /** Erro genérico do export binário (fallback quando `parseBlobError` não
     *  encontra mensagem de campo no 422). */
    downloadError: string;
    /** Toast dedicado quando `window.open` devolve `null` (pop-up
     *  efetivamente bloqueado pelo navegador). */
    popupBlocked: string;
    validation: {
      periodRequired: string;
      endDateBeforeStartDate: string;
    };
  };
}
