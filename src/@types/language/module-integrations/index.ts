// src/@types/language/module-integrations/index.ts
// Interface de tradução do módulo "Integrações" (Integrations) — módulo
// COMPARTILHADO pelas telas de export contábil do módulo Integrações
// (canário F-119 "Exportação NFS-e → Domínio"; reusável pelas irmãs
// F-116/117/118/120, Decisão E de
// `07-Tarefas_Frontend/ExportNfseDominio-contrato-tela.md`). Chave raiz
// `integrations`, sub-namespace por export (`exportNfseDominio`, e as
// irmãs quando materializadas). Mirror estrutural de `module-sharings`
// (instância simples: um arquivo por módulo, sem decomposição por tela).
// O conteúdo mora em src/constants/languages/{idioma}/languageIntegrations.ts.

export interface ModuleIntegrations {
  integrations: {
    /** Par singular/plural — molde de eventual query-key composto pelas
     *  irmãs (F-116/117/118/120). F-119 (esta tela) NÃO usa query-key —
     *  ver Decisão D do contrato (ação imperativa, sem cache). */
    singularLabel: string;
    pluralLabel: string;
    /** Sub-namespace da tela "Exportação NFS-e → Domínio" (F-119, canário). */
    exportNfseDominio: {
      titleModule: string;
      form: {
        /** "Dt. Início" — fidelidade `trad.php:408`. */
        startDateLabel: string;
        /** "Dt. Fim" — fidelidade `trad.php:410`. */
        endDateLabel: string;
        /** "Exportar Dados". */
        exportButton: string;
        validation: {
          /** Erro do `.test` cross-field `end_date >= start_date` (espelha
           *  `after_or_equal:start_date` do server, corrige OQ-02). */
          endBeforeStart: string;
        };
      };
      toasts: {
        successTitle: string;
        successDescription: string;
        errorTitle: string;
      };
    };
    /** Sub-namespace da tela "Exportação Movimento Bancário → Domínio"
     *  (F-116, irmã do canário F-119). */
    exportMovementsDominio: {
      titleModule: string;
      form: {
        /** "Dt. Início". */
        startDateLabel: string;
        /** "Dt. Fim". */
        endDateLabel: string;
        /** "Tipo Dados". */
        typeLabel: string;
        /** "Exportar Dados". */
        exportButton: string;
        /** Labels do SELECT `type` (1=Entrada/2=Saída), consumidos pela
         *  fábrica `exportMovementsDominioTypeOptions`. */
        typeOptions: {
          income: string;
          expense: string;
        };
        validation: {
          /** Erro do `.test` cross-field `end_date >= start_date` (espelha
           *  `after_or_equal:start_date` do server, corrige OQ-02). */
          endBeforeStart: string;
        };
      };
      toasts: {
        successTitle: string;
        successDescription: string;
        errorTitle: string;
      };
    };
    /** Sub-namespace da tela "Exportação Folha Salarial → Domínio" (F-117,
     *  irmã do canário F-119). */
    exportEarningsDominio: {
      titleModule: string;
      form: {
        /** "Ano" — 4 dígitos, opções `[corrente, corrente-1]`. */
        yearLabel: string;
        /** "Mês" — 1..12. */
        monthLabel: string;
        /** "Exportar Dados". */
        exportButton: string;
        /** Labels do SELECT `month` (1..12), consumidos pela fábrica
         *  `exportEarningsDominioMonthOptions`. */
        months: {
          jan: string;
          feb: string;
          mar: string;
          apr: string;
          may: string;
          jun: string;
          jul: string;
          aug: string;
          sep: string;
          oct: string;
          nov: string;
          dec: string;
        };
        validation: {
          /** Mensagem de obrigatoriedade do select `year`. */
          yearRequired: string;
          /** Mensagem de obrigatoriedade do select `month`. */
          monthRequired: string;
        };
      };
      toasts: {
        successTitle: string;
        successDescription: string;
        errorTitle: string;
      };
    };
    /** Sub-namespace da tela "Exportação Financeira CSV — C. Pagas/Recebidas"
     *  (F-120, irmã do canário F-119). */
    exportFinancialCsv: {
      titleModule: string;
      form: {
        /** "Dt. Início". */
        startDateLabel: string;
        /** "Dt. Fim". */
        endDateLabel: string;
        /** "Exportar Dados". */
        exportButton: string;
        validation: {
          /** Erro do `.test` cross-field `end_date >= start_date` (espelha
           *  `after_or_equal:start_date` do server). */
          endBeforeStart: string;
        };
      };
      toasts: {
        successTitle: string;
        successDescription: string;
        errorTitle: string;
      };
    };
    /** Sub-namespace da tela "Exportação Domínio — Contas a Pagar/Receber"
     *  (F-118, irmã do canário F-119, a mais rica do lote — 11 campos). */
    exportExpensesIncomesDominio: {
      titleModule: string;
      form: {
        /** "Fazenda" — select async opcional, narrows dentro do tenant. */
        farmLabel: string;
        /** "Dt. Emissão Início". */
        startDateLabel: string;
        /** "Dt. Emissão Fim". */
        endDateLabel: string;
        /** "Dt. Venc. Início". */
        startDueDateLabel: string;
        /** "Dt. Venc. Fim". */
        endDueDateLabel: string;
        /** "Proprietário Gestor" — select async opcional. */
        proprietaryLabel: string;
        /** "Status" — select estático, 8 opções. */
        statusLabel: string;
        /** "Centro de Custo" — select async opcional. */
        centerLabel: string;
        /** "Tipo Dados" — select estático, ÚNICO campo obrigatório (1/2). */
        typeLabel: string;
        /** "Categorias" — multiselect async opcional. */
        categoriesLabel: string;
        /** "Exportar Dados". */
        exportButton: string;
        validation: {
          /** Erro do `.test` cross-field `end_date >= start_date`. */
          endBeforeStart: string;
          /** Erro do `.test` cross-field `end_due_date >= start_due_date`. */
          endDueBeforeStartDue: string;
        };
        /** Labels do SELECT `status` (1..8, fiel a `Expense::opStatus`),
         *  consumidos pela fábrica `expenseIncomeStatusOptions`. */
        status: {
          aVencer: string;
          vencido: string;
          baixaParcial: string;
          baixado: string;
          adiantPendente: string;
          adiantBaixado: string;
          faturaPendente: string;
          faturaBaixado: string;
        };
        /** Labels do SELECT `type` (1=Pagar/2=Receber), consumidos pela
         *  fábrica `expenseIncomeTypeOptions`. */
        type: {
          expense: string;
          income: string;
        };
      };
      toasts: {
        successTitle: string;
        successDescription: string;
        errorTitle: string;
      };
    };
  };
}
