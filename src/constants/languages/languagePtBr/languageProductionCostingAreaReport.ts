// src/constants/languages/languagePtBr/languageProductionCostingAreaReport.ts
// Tradução PT-BR do módulo "Produção/Custeio/Área" (relatório agrícola —
// F-298, esteira 051, TASK-298-FE-01).
//
// `pageTitle` (C-13, roteiro-front-F298 §"FID-G3F"): mirror do título do
// PDF/tela ("Produção/Custeio/Área") — DIVERGE de propósito do rótulo do
// item de MENU ("Produção/Custo/Área", `navigationTree.ts`), fidelidade ao
// legado (menu e título sempre foram textos distintos, não sincronizar).

import { ModuleProductionCostingAreaReport } from '@/@types/language/module-production-costing-area-report';

export const languageProductionCostingAreaReport: ModuleProductionCostingAreaReport = {
  report: {
    pageTitle: 'Produção/Custeio/Área',
    pageSubtitle: 'Relatório de produção e custeio agrupado por área.',
    fields: {
      productionCycle: 'Ciclo de Produção',
      areas: 'Áreas',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    productionCyclePlaceholder: 'Selecione o ciclo de produção',
    areasPlaceholder: 'Selecione as áreas',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
