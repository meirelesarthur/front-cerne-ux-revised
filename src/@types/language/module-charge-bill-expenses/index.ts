// src/@types/language/module-charge-bill-expenses/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Contas a Pagar" (ChargeBillExpense —
// Operacional / Agricultura / Carregamento). Mirror ESTRUTURAL de
// `module-charge-bill-incomes` (gêmeo, execução 059). O conteúdo mora em
// `src/constants/languages/{idioma}/languageChargeBillExpenses.ts`.
//
// Namespace `chargeBillExpenses` — LIVRE, sem colisão com `expenses`
// (domínio Financeiro homônimo, `Financeiro/ContasAPagar`) nem com
// `chargeBillIncomes` (gêmeo).
//
// TASK-CBE-04 cobre `list` (CBE-05) + `detail` (CBE-07) + a casca de `form`
// (rótulos MÍNIMOS, consumidos só por CBE-06, fora do escopo desta execução —
// declarados aqui para o CBE-06 plugar sem recriar o arquivo). `fields.branch`
// + `form.hints.*` são EXCLUSIVOS desta feature (cascata provider→branch, sem
// precedente no gêmeo).
// -----------------------------------------------------------------------------

export interface ModuleChargeBillExpenses {
  chargeBillExpense: {
    singularLabel: string;
    pluralLabel: string;
    titleModule: string;
    list: {
      pageTitle: string;
      pageSubtitle: string;
      deletedToast: string;
      columns: {
        code: string;
        dueDate: string;
        provider: string;
        cultivation: string;
        amount: string;
        actions: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      /** Fallbacks fiéis ao legado quando `provider`/`cultivation` são `null`
       *  (contrato de tela §2.1). */
      fallback: {
        provider: string; // "Todos Associados"
        cultivation: string; // "Todos"
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
      deleteConfirm: {
        title: string;
        description: string;
        warning: string;
      };
    };
    form: {
      /** Títulos da casca `FormContainer` (TASK-CBE-06). */
      title: {
        create: string;
        edit: string;
      };
      fields: {
        code: string;
        dtEmission: string;
        dueDate: string;
        number: string;
        amount: string;
        provider: string;
        /** EXCLUSIVO desta feature — cascata provider→branch (contrato §2.2
         *  FLD-07). */
        branch: string;
        cultivation: string;
        description: string;
      };
      placeholders: {
        code: string; // "Gerado automaticamente ao salvar"
        provider: string; // "Todos Associados"
        cultivation: string; // "Todos"
      };
      /** EXCLUSIVO desta feature — mirror
       *  `Financeiro/ContasAPagar/CreateOrUpdateExpense.tsx:formText.hints`. */
      hints: {
        branchRequiresProvider: string;
        providerHasNoBranches: string;
      };
      toasts: {
        createdSuccess: string;
        updatedSuccess: string;
      };
    };
    detail: {
      fields: {
        code: string;
        dtEmission: string;
        dueDate: string;
        number: string;
        amount: string;
        provider: string;
        cultivation: string;
        description: string;
      };
      actions: {
        edit: string;
        back: string;
      };
      notFound: {
        title: string;
        description: string;
        back: string;
      };
    };
  };
}
