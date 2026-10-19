// src/constants/languages/languagePtBr/languageAccumulatedDepreciationReport.ts
// Tradução PT-BR do módulo "Depreciação Acumulada" (relatório de Bens/
// Equipamentos — F-216, CONTRATO-F216-depreciacao-acumulada.md §6). Mirror
// estrutural do bloco `report` de `languageEquipmentInventoryReport.ts`.
// Literais PT fiéis ao contrato de tela, sem melhoria de redação.

import { ModuleAccumulatedDepreciationReport } from '@/@types/language/module-accumulated-depreciation-report';

export const languageAccumulatedDepreciationReport: ModuleAccumulatedDepreciationReport = {
  report: {
    pageTitle: 'Depreciação Acumulada',
    pageSubtitle: 'Relatório de depreciação acumulada de bens/equipamentos por família, status e período.',
    fields: {
      family: 'Família',
      status: 'Status',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
    },
    statusOptions: {
      active: 'Ativo',
      inactive: 'Inativo',
    },
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Selecione Família, Status e o período para gerar o relatório.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      familyRequired: 'A Família é obrigatória.',
      statusRequired: 'O Status é obrigatório.',
      startDateRequired: 'A Data Inicial é obrigatória.',
      endDateRequired: 'A Data Final é obrigatória.',
      endDateBeforeStartDate: 'A Data Final deve ser igual ou posterior à Data Inicial.',
    },
  },
};
