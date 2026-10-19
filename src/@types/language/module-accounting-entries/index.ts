// src/@types/language/module-accounting-entries/index.ts
// Interface de tradução do módulo "Partida Dobrada" (AccountingEntry —
// domínio Fiscal, F-128, esteira 97-Esteiras/068, TASK-PD-FE-02). Módulo
// top-level próprio, mirror estrutural `ModuleDfes`/`ModuleXmlDocuments`
// (mesmo domínio Fiscal) — NÃO um namespace aninhado `fiscal.accountingEntry`
// (ver divergência registrada em `src/constants/query-key.ts`, bloco
// `accountingEntries`).
//
// Fundação (TASK-PD-FE-02): fecha só as chaves consumidas pelas Tarefas de
// tipos/schema/service/constantes desta fatia (fundação). Telas
// subsequentes (grid/form, TASK-PD-FE-06/07) podem estender este arquivo com
// chaves adicionais (ex.: mensagens de toast específicas), mirror do que
// `ModuleDfes` fez entre TASK-DFE-FE-03 e TASK-DFE-FE-05.
//
// Extensão TASK-PD-FE-06 (Listagem + filtro + exclusão): acrescenta
// `list.pageTitle/pageSubtitle/emptyState/error/actions/deletedToast` e
// `filter.title` — chaves consumidas por `pages/Fiscal/AccountingEntry/
// {index.tsx,FilterSideAccountingEntry.tsx}`. ADITIVO, não renomeia nem
// remove nenhuma chave existente da fundação.

export interface ModuleAccountingEntries {
  accountingEntry: {
    singularLabel: string;
    pluralLabel: string;

    titleModule: string;
    createTitle: string;
    editTitle: string;
    viewTitle: string;

    list: {
      pageTitle: string;
      pageSubtitle: string;
      table: {
        code: string;
        origin: string;
        description: string;
        totalAmount: string;
        responsible: string;
        date: string;
      };
      emptyState: {
        titleEmpty: string;
        descriptionEmpty: string;
        cta: string;
        titleFiltered: string;
        descriptionFiltered: string;
      };
      error: {
        message: string;
        retry: string;
      };
      actions: {
        view: string;
        edit: string;
        delete: string;
      };
      deletedToast: string;
    };

    origin: {
      administrative: string;
      agriculture: string;
      livestock: string;
    };

    condition: {
      debit: string;
      credit: string;
    };

    form: {
      fields: {
        date: string;
        description: string;
        origin: string;
        code: string;
        codePlaceholder: string;
        author: string;
        totalAmount: string;
      };
      items: {
        sectionTitle: string;
        sectionHint: string;
        fields: {
          planAccount: string;
          condition: string;
          value: string;
        };
        addRowLabel: string;
        removeRowLabel: string;
        totalDebitLabel: string;
        totalCreditLabel: string;
        differenceHint: string;
      };
    };

    // ⚠️ `itemsMinDebit`/`itemsMinCredit`/`itemsSumMismatch` são MIRROR EXATO
    // do 422 real (`AccountingEntryRequest::withValidator()`) — texto
    // idêntico ao backend, não paráfrase (consumidas por
    // `accounting-entry-schema.ts`, TASK-PD-FE-04, ponto de fidelidade de
    // ALTO RISCO desta esteira).
    validation: {
      itemsMinDebit: string;
      itemsMinCredit: string;
      itemsSumMismatch: string;
      dateRequired: string;
      descriptionRequired: string;
      originRequired: string;
      planAccountRequired: string;
      conditionRequired: string;
      valueRequired: string;
      valueMin: string;
    };

    filter: {
      title: string;
      fields: {
        code: string;
        origin: string;
        description: string;
        startDate: string;
        endDate: string;
        user: string;
      };
    };

    report: {
      pageTitle: string;
      pageSubtitle: string;
      reportTypeLabel: string;
      reportTypeOptions: {
        journal: string;
        generalLedger: string;
        trialBalance: string;
        balanceSheet: string;
      };
      planAccountLabel: string;
      planAccountPlaceholder: string;
      startDate: string;
      endDate: string;
      periodRequiredHint: string;
      orderByLabel: string;
      orderByOptions: {
        recent: string;
        oldest: string;
      };
      downloadPdfButton: string;
      downloadError: string;
      validation: {
        reportTypeRequired: string;
        planAccountProhibited: string;
        periodRequired: string;
      };
    };
  };
}
