// src/constants/languages/languagePtBr/languageCostingLivestockAreaReport.ts
// Tradução PT-BR do módulo "Custeio/Área Pecuária" (relatório pecuário —
// F-251, CusteioAreaPecuaria-contrato-api.md, lote 076).
//
// `pageTitle` mirror do título do contrato/PDF ("Custeio/Área Pecuária") —
// PODE divergir do rótulo do item de MENU (`navigationTree.ts`), mesmo
// racional já documentado em `languageProductionCostingAreaReport.ts` (C-13).

import { ModuleCostingLivestockAreaReport } from '@/@types/language/module-costing-livestock-area-report';

export const languageCostingLivestockAreaReport: ModuleCostingLivestockAreaReport = {
  report: {
    pageTitle: 'Custeio/Área Pecuária',
    pageSubtitle: 'Relatório de custeio agrupado por área de pastagem.',
    fields: {
      productionCycle: 'Ciclo de Produção',
      areas: 'Área',
      grazings: 'Módulo de Pastejo',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    productionCyclePlaceholder: 'Selecione o ciclo de produção',
    areasPlaceholder: 'Selecione as áreas',
    grazingsPlaceholder: 'Selecione os módulos de pastejo',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
