// src/@types/language/module-monthly-calculation-report/index.ts
// Interface de tradução do módulo "Apuração Mensal" (relatório — domínio
// Relatórios > Gestão Pessoal, F-285, `97-Esteiras/007`, TASK-07-57). Módulo
// top-level próprio (mirror `module-dre`/`module-dre-annual`), tela de
// filtro + PDF inline em nova aba, SEM grid/prévia — mesma forma reduzida
// dos módulos irmãos de relatório "gerar e sair".

export interface ModuleMonthlyCalculationReport {
  report: {
    pageTitle: string;
    pageSubtitle: string;
    filters: {
      month: string;
      year: string;
      reportType: string;
      type: string;
      employees: string;
    };
    reportTypeOptions: {
      1: string;
      2: string;
      3: string;
      4: string;
    };
    typeOptions: {
      N: string;
      A: string;
      D: string;
    };
    submitButton: string;
    successToast: string;
    errorToast: string;
    hint: {
      requiredFieldsMissing: string;
    };
  };
}
