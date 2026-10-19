// src/@types/language/module-evolutions/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de EVOLUÇÃO/REBANHO (Evolution —
// Operacional > Pecuária > Transferências / Relatórios > Pecuária,
// spa-contract-evolucao-rebanho.md, Tarefas 26/27). Espelha a convenção de
// `module-separations/index.ts`. Conteúdo mora em
// src/constants/languages/{idioma}/languageEvolutions.ts.
//
// Namespace `evolutions` — LIVRE, sem colisão com `devolutions` (outro
// domínio, mesmo prefixo por acaso).
//
// Tarefa 26 (fundação + listagem) cobre `evolution.{singularLabel,
// pluralLabel,list,filter}`. Tarefa 27 (relatório) acrescenta
// `evolution.report`.
// -----------------------------------------------------------------------------

export interface ModuleEvolutions {
  evolution: {
    singularLabel: string;
    pluralLabel: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        animal: string;
        birthDate: string;
        date: string;
        categoryOld: string;
        categoryNext: string;
      };
      empty: {
        title: string;
        description: string;
      };
      emptyFiltered: {
        title: string;
        description: string;
      };
      error: {
        title: string;
        retry: string;
      };
      report: string;
    };
    filter: {
      title: string;
      animal: string;
      startDate: string;
      endDate: string;
    };
    /**
     * Tela de relatório (contrato §5, Tarefa 27). Botões unificados na
     * esteira 060 (ajuste UX do dono): `filter.format`/`format.{pdf,excel}`
     * + `downloadButton` único substituem `exportPdf`/`exportXlsx`.
     * `scopeHint`/`hint.pdfPeriodLimit` removidos (limite de 90 dias do PDF
     * e escopo de fazenda já corrigidos no backend — avisos obsoletos).
     */
    report: {
      pageTitle: string;
      pageSubtitle: string;
      filter: {
        startDate: string;
        endDate: string;
        format: string;
      };
      format: {
        pdf: string;
        excel: string;
      };
      downloadButton: string;
      toasts: {
        success: string;
        genericError: string;
      };
      hint: {
        datesRequired: string;
      };
    };
  };
}
