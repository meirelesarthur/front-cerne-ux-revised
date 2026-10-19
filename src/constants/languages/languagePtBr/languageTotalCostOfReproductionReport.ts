// src/constants/languages/languagePtBr/languageTotalCostOfReproductionReport.ts
// Tradução PT-BR do módulo "Custo Total de Reprodução" (domínio Pecuária,
// F-328, esteira 97-Esteiras/008, TASK-FE-CTR-01). Mirror ESTRUTURAL do
// bloco `reproductiveHistoryReport` (`languageBreedingMating.ts:380-403`) —
// rótulos literais do Blade legado (`report.blade.php:21,24,27`,
// `trad.php:494`).

import { ModuleTotalCostOfReproductionReport } from '@/@types/language/module-total-cost-of-reproduction-report';

export const languageTotalCostOfReproductionReport: ModuleTotalCostOfReproductionReport = {
  report: {
    pageTitle: 'Custo Total de Reprodução',
    pageSubtitle: 'Gere o relatório de custo total de reprodução em PDF ou Excel.',
    filters: {
      startDate: 'Data Inicial',
      endDate: 'Data Final',
    },
    fields: {
      reportType: 'Tipo de Relatório',
    },
    submitButton: 'Gerar Relatório',
    successToast: 'Relatório gerado com sucesso.',
    errorToast: 'Não foi possível gerar o relatório.',
    hint: {
      datesRequired: 'Preencha a data inicial e final para gerar o relatório.',
    },
  },
};
