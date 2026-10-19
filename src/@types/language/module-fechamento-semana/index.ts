// src/@types/language/module-fechamento-semana/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo de FECHAMENTO SEMANA (ClosingWeek —
// Operacional). Espelha a convenção de `module-carregamentos`. O conteúdo
// mora em `src/constants/languages/{idioma}/languageFechamentoSemana.ts`.
//
// Namespace `fechamentoSemana` — LIVRE, sem colisão com nenhum bloco
// existente.
//
// TASK-FE-FS-01 cobre `list` + `deleteDialog` + a casca de `search`/`report`/
// `detail` (rótulos MÍNIMOS consumidos pela Tarefa de fundação — nenhuma tela
// própria aqui). `TASK-FE-FS-02..04` ACRESCENTAM os rótulos completos de cada
// tela dedicada (edição incremental deste mesmo arquivo, nunca recriado do
// zero).
// -----------------------------------------------------------------------------

export interface ModuleFechamentoSemana {
  closingWeek: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      table: {
        code: string;
        week: string;
        startDate: string;
        endDate: string;
      };
      actions: {
        view: string;
        delete: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
      };
      error: {
        message: string;
        retry: string;
      };
    };
    deleteDialog: {
      title: string;
      descriptionTemplate: string;
    };
    search: {
      pageTitle: string;
      pageSubtitle: string;
      fields: {
        startDate: string;
        endDate: string;
      };
      validation: {
        startDateRequired: string;
        endDateRequired: string;
        endDateBeforeStartDate: string;
      };
      generateButton: string;
      emptyReport: string;
      businessErrorFallback: string;
    };
    report: {
      /** Título da tabela agrupada (TASK-FE-FS-04, mirror CL-049 "Demonstrativo
       *  de Formação do Preço Médio"). */
      reportTitle: string;
      table: {
        cultivation: string;
        quality: string;
        quantityFinal: string;
        expenses: string;
        amount: string;
        /** Colunas da tabela ITEMIZADA por grupo (GAP-FS-06, contrato §4.2) —
         *  mirror `create.blade.php:24-104`: Data/Fornecedor/Cliente/
         *  Vencimento/Qtd Kg/Preço/Valor Operação. */
        items: {
          date: string;
          dueDate: string;
          provider: string;
          client: string;
          quantityFinal: string;
          price: string;
          totalAmount: string;
        };
      };
      code: string;
      week: string;
      saveButton: string;
      backButton: string;
      savedToast: string;
    };
    detail: {
      fields: {
        code: string;
        date: string;
        startDate: string;
        endDate: string;
        week: string;
        responsible: string;
      };
      itemsSectionTitle: string;
      itemsTable: {
        cultivation: string;
        quality: string;
        amount: string;
      };
      itemsEmptyState: string;
      backButton: string;
      notFound: string;
    };
  };
}
