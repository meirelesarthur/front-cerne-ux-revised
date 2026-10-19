// src/constants/languages/languagePtBr/languageMonthlyCalculationReport.ts
// Tradução PT-BR do módulo "Apuração Mensal" (relatório — domínio
// Relatórios > Gestão Pessoal, F-285, `97-Esteiras/007`, TASK-07-57). Mirror
// estrutural de `languageDre.ts` — tela de filtro + PDF inline em nova aba,
// sem grid/prévia. `typeOptions` reusa os 3 labels já existentes de
// `Administrativo/Earning/FilterSideEarning.tsx::TYPE_OPTIONS` (fidelidade —
// não inventar wording novo).

import { ModuleMonthlyCalculationReport } from '@/@types/language/module-monthly-calculation-report';

export const languageMonthlyCalculationReport: ModuleMonthlyCalculationReport = {
  report: {
    pageTitle: 'Apuração Mensal',
    pageSubtitle: 'Gere o relatório de apuração mensal em PDF.',
    filters: {
      month: 'Mês',
      year: 'Ano',
      reportType: 'Tipo de Relatório',
      type: 'Tipo',
      employees: 'Funcionários',
    },
    reportTypeOptions: {
      1: 'Sintético',
      2: 'Analítico',
      3: 'Remessa Folha',
      4: 'Remessa Cheque',
    },
    typeOptions: {
      N: 'Folha Normal',
      A: 'Adiantamento 13º',
      D: '13º Salário',
    },
    submitButton: 'Gerar Relatório',
    successToast: 'Relatório gerado com sucesso.',
    errorToast: 'Não foi possível gerar o relatório.',
    hint: {
      requiredFieldsMissing: 'Preencha mês, ano e tipo de relatório para gerar o relatório.',
    },
  },
};
