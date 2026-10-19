// src/constants/languages/languagePtBr/languagePaymentCashflowReport.ts
// Tradução PT-BR do módulo "Fluxo Mensal de Pagamento"
// (`payment-cashflow.report`, relatório de Financeiro — F-293, execução
// 97-Esteiras/078, TASK-F293-F01). Mirror estrutural de
// `languageRequestQuotationReport.ts` (F-311).

import { ModulePaymentCashflowReport } from '@/@types/language/module-payment-cashflow-report';

export const languagePaymentCashflowReport: ModulePaymentCashflowReport = {
  report: {
    pageTitle: 'Fluxo Mensal de Pagamento',
    pageSubtitle: 'Relatório de fluxo de pagamentos por conta, categoria e centro de custo.',
    fields: {
      accounts: 'Contas',
      categories: 'Categorias',
      proprietary: 'Proprietários',
      costCenter: 'Centro de Custo',
      farm: 'Fazenda',
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    proprietaryPlaceholder: 'Todos',
    costCenterPlaceholder: 'Todos',
    farmPlaceholder: 'Todas',
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    exportFileName: 'fluxo-mensal-pagamento',
    popupBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      endDateAfterStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
    checkbox: {
      selectAll: 'Marcar todos',
      deselectAll: 'Desmarcar todos',
      selectedCount: 'selecionados',
      empty: 'Nenhum registro encontrado.',
      error: 'Erro ao carregar os registros.',
      retry: 'Tentar novamente',
      searchPlaceholder: 'Buscar...',
    },
  },
};
