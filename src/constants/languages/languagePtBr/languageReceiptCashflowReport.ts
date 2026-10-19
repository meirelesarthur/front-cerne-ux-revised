// src/constants/languages/languagePtBr/languageReceiptCashflowReport.ts
// Tradução PT-BR do módulo "Fluxo Mensal de Recebimento" (relatório
// financeiro — F-303, CONTRATO-F303-fluxo-mensal-recebimento.md, esteira
// 97-Esteiras/059). Mirror estrutural do bloco `report` de
// `languageCashFlowByCategoryReport.ts`.

import { ModuleReceiptCashflowReport } from '@/@types/language/module-receipt-cashflow-report';

export const languageReceiptCashflowReport: ModuleReceiptCashflowReport = {
  report: {
    pageTitle: 'Fluxo Mensal de Recebimento',
    pageSubtitle: 'Relatório de fluxo mensal de recebimentos, por conta, categoria e período.',
    fields: {
      accounts: 'Contas',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      proprietary: 'Proprietário',
      costCenter: 'Centro de Custo',
      categories: 'Categorias',
      farm: 'Fazenda',
      format: 'Formato',
    },
    proprietaryPlaceholder: 'Selecione o proprietário',
    costCenterPlaceholder: 'Selecione o centro de custo',
    farmPlaceholder: 'Selecione a fazenda',
    lookupSearchPlaceholder: 'Buscar...',
    selectAll: 'Selecionar todos',
    deselectAll: 'Remover seleção',
    lookupEmptyMessage: 'Nenhum item encontrado.',
    generateButton: 'Gerar Relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'A data é obrigatória.',
    },
  },
};
