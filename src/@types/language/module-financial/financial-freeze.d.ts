// src/@types/language/module-financial/financial-freeze.d.ts
// -----------------------------------------------------------------------------
// Tipo de tradução da feature "Congelamentos Financeiros" (FinancialFreeze —
// F-110, esteira 97-Esteiras/008, Tarefa 31/32). Chave NOVA irmã de
// `expense`/`mercadoPago`/`ofxImport` dentro de `ModuleFinancial`
// (`financial.financialFreeze.*`) — mirror da convenção real já em uso neste
// módulo (contrato de tela §8).
//
// `form.*` já nasce completo nesta Tarefa (31) — consumido pela Tarefa 32
// (formulário + histórico), que não precisa reabrir este arquivo.
// -----------------------------------------------------------------------------

export interface FinancialFreezeLanguage {
  singularLabel: string;
  pluralLabel: string;

  /** 12 rótulos — fonte da fábrica `financialFreezeMonthOptions`. */
  months: {
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
  };

  list: {
    pageTitle: string;
    pageSubtitle: string;
    table: {
      month: string;
      year: string;
      responsible: string;
      isFrozen: string;
      createdAt: string;
      updatedAt: string;
    };
    actions: {
      view: string;
      edit: string;
      delete: string;
    };
    emptyState: {
      titleEmpty: string;
      descriptionEmpty: string;
      titleFiltered: string;
      descriptionFiltered: string;
      cta: string;
    };
    deletedToast: string;
  };

  filter: {
    title: string;
    month: string;
    monthAll: string;
    year: string;
    yearPlaceholder: string;
  };

  form: {
    title: {
      create: string;
      edit: string;
      view: string;
    };
    fields: {
      month: string;
      year: string;
      isFrozen: string;
    };
    validation: {
      monthRequired: string;
      yearRequired: string;
      yearDigits: string;
      isFrozenRequired: string;
    };
    createdToast: string;
    updatedToast: string;
    historySection: {
      title: string;
      emptyLabel: string;
      columns: {
        isFrozen: string;
        responsible: string;
        date: string;
      };
    };
  };
}
