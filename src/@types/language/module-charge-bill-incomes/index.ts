// src/@types/language/module-charge-bill-incomes/index.ts
// -----------------------------------------------------------------------------
// Interface de tradução do módulo "Contas a Receber" (ChargeBillIncome —
// Operacional / Agricultura / Carregamento). Espelha a convenção de
// `module-fechamento-semana`. O conteúdo mora em
// `src/constants/languages/{idioma}/languageChargeBillIncomes.ts`.
//
// Namespace `chargeBillIncomes` — LIVRE, sem colisão com `incomes`
// (domínio Financeiro homônimo, `module-incomes`).
//
// TASK-CBI-FE-01 cobre `list` (FE-02) + `detail` (FE-04) + a casca de
// `form` (rótulos MÍNIMOS, consumidos só por FE-03, fora do escopo desta
// execução — declarados aqui para FE-03 plugar sem recriar o arquivo).
// -----------------------------------------------------------------------------

export interface ModuleChargeBillIncomes {
  chargeBillIncome: {
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
       *  (contrato de tela §4/§5). */
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
      /** Títulos da casca `FormContainer` (TASK-CBI-FE-03). */
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
        cultivation: string;
        description: string;
      };
      placeholders: {
        code: string; // "Gerado automaticamente ao salvar"
        provider: string; // "Todos Associados"
        cultivation: string; // "Todos"
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
