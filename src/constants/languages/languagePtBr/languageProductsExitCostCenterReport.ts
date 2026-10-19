// src/constants/languages/languagePtBr/languageProductsExitCostCenterReport.ts
// Tradução PT-BR do módulo "Saídas x Centro Custo" (relatório de Estoque —
// F-301, execução 97-Esteiras/078, TASK-F301-F01). Mirror estrutural de
// `languageSavingsReport.ts`.

import { ModuleProductsExitCostCenterReport } from '@/@types/language/module-products-exit-cost-center-report';

export const languageProductsExitCostCenterReport: ModuleProductsExitCostCenterReport = {
  report: {
    pageTitle: 'Saídas x Centro Custo',
    pageSubtitle: 'Relatório de saídas de produtos agrupadas por centro de custo.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      center: 'Centro de Custo',
      warehouse: 'Armazém',
      product: 'Produto',
    },
    centerPlaceholder: 'Todos',
    warehousePlaceholder: 'Todos',
    productPlaceholder: 'Selecione',
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    exportFileName: 'relatorio_saida_prod_x_centro_custo',
    popupBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      endDateAfterStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
