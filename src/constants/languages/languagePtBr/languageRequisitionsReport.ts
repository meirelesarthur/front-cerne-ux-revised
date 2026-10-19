// src/constants/languages/languagePtBr/languageRequisitionsReport.ts
// Tradução PT-BR do módulo "Requisição/Saída" (relatório de Estoque — F-312,
// execução 97-Esteiras/078, TASK-F312-F01). Mirror estrutural de
// `languageProductsExitCostCenterReport.ts` MENOS o campo `center`.

import { ModuleRequisitionsReport } from '@/@types/language/module-requisitions-report';

export const languageRequisitionsReport: ModuleRequisitionsReport = {
  report: {
    pageTitle: 'Requisição/Saída',
    pageSubtitle: 'Relatório de requisições de saída de produtos do estoque.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      warehouse: 'Armazém',
      product: 'Produto',
    },
    warehousePlaceholder: 'Todos',
    productPlaceholder: 'Selecione',
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    exportFileName: 'relatorio_requisicao_saida',
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
