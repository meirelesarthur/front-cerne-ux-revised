// src/constants/languages/languagePtBr/languageAgricultureApplicationManagementReport.ts
// Tradução PT-BR do módulo "Aplicação/Manejo Talhões" (relatório de
// Agricultura — F-220, execução 059). Mirror estrutural do bloco `report`
// de `languageProductionCostingAreaReport.ts`/`languageStockAbcReport.ts`.

import { ModuleAgricultureApplicationManagementReport } from '@/@types/language/module-agriculture-application-management-report';

export const languageAgricultureApplicationManagementReport: ModuleAgricultureApplicationManagementReport =
  {
    report: {
      pageTitle: 'Aplicação/Manejo Talhões',
      pageSubtitle: 'Relatório de aplicações e manejos por talhão, no período selecionado.',
      fields: {
        productionCycle: 'Ciclo de Produção',
        areas: 'Áreas',
        startDate: 'Data Inicial',
        endDate: 'Data Final',
        reportType: 'Tipo de Relatório',
        group: 'Grupo',
        category: 'Categoria',
        kind: 'Classe',
        format: 'Formato',
      },
      productionCyclePlaceholder: 'Selecione o ciclo de produção',
      areasPlaceholder: 'Selecione as áreas',
      reportTypeOptions: {
        inputs: 'Insumos',
        services: 'Serviços',
        occurrences: 'Ocorrências',
      },
      reportTypePlaceholder: 'Selecione o tipo de relatório',
      groupPlaceholder: 'Selecione o grupo',
      categoryPlaceholder: 'Selecione a categoria',
      categoryDisabledHint: 'Selecione um grupo primeiro',
      kindPlaceholder: 'Selecione a classe',
      kindDisabledHint: 'Selecione uma categoria primeiro',
      formatOptions: {
        pdf: 'PDF',
        xlsx: 'Excel',
      },
      downloadButton: 'Baixar Relatório',
      downloadSuccess: 'Relatório gerado com sucesso.',
      downloadError: 'Não foi possível gerar o relatório.',
      periodRequiredHint: 'Selecione a Data Inicial e a Data Final para gerar o relatório.',
      validation: {
        periodRequired: 'A data é obrigatória.',
      },
    },
  };
