// src/constants/languages/languagePtBr/languageApplicationManagementReport.ts
// Tradução PT-BR do módulo "Aplicação/Manejo" (relatório pecuário — F-230,
// esteira 97-Esteiras/077, F-230-plano-front.md §5).
//
// `pageTitle` mirror do título do contrato/PDF ("Aplicação/Manejo") — PODE
// divergir do rótulo do item de MENU (`navigationTree.ts`), mesmo racional
// já documentado em `languageCostingLivestockAreaReport.ts` (C-13).

import { ModuleApplicationManagementReport } from '@/@types/language/module-application-management-report';

export const languageApplicationManagementReport: ModuleApplicationManagementReport = {
  report: {
    pageTitle: 'Aplicação/Manejo',
    pageSubtitle: 'Insumos aplicados e mão de obra/serviços por área da fazenda ativa, no período.',
    fields: {
      productionCycle: 'Ciclo de Produção',
      areas: 'Áreas',
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    productionCyclePlaceholder: 'Todos os ciclos',
    areasPlaceholder: 'Todas as áreas',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Selecione o período (Data Início e Data Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'Informe a Data Início e a Data Fim.',
    },
  },
};
