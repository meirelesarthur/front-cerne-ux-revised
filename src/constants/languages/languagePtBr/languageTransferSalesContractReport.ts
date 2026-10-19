// src/constants/languages/languagePtBr/languageTransferSalesContractReport.ts
// Tradução PT-BR do módulo "Romaneio/Vendas/Contrato" (relatório de
// Agricultura, F-331, 97-Esteiras/008, TASK-RVC-FE-01). Mirror estrutural de
// `languageWeighingHarvestReport.ts`.

import { ModuleTransferSalesContractReport } from '@/@types/language/module-transfer-sales-contract-report';

export const languageTransferSalesContractReport: ModuleTransferSalesContractReport = {
  report: {
    pageTitle: 'Romaneio/Vendas/Contrato',
    pageSubtitle: 'Relatório de itens de romaneio por venda/contrato no período.',
    fields: {
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      client: 'Cliente',
      type: 'Tipo',
      product: 'Produto',
      contract: 'Número Contrato',
      format: 'Formato',
    },
    clientPlaceholder: 'Todos os clientes',
    typePlaceholder: 'Todos os tipos',
    productPlaceholder: 'Todos os produtos',
    contractPlaceholder: 'Todos os contratos',
    periodRequiredHint: 'Informe o período (Data Inicial e Data Final) para gerar o relatório.',
    submitButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      startDateRequired: 'A Data Inicial é obrigatória.',
      endDateRequired: 'A Data Final é obrigatória.',
      endDateAfterStartDate: 'A Data Final deve ser igual ou posterior à Data Inicial.',
    },
  },
};
