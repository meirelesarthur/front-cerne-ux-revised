// src/constants/languages/languagePtBr/languageBankStatementReport.ts
// Tradução PT-BR do módulo "Extrato Financeiro" (`bankEstatement.report`,
// relatório de Financeiro — F-233, execução 97-Esteiras/079,
// TASK-F233-FE-01). Mirror estrutural de
// `languagePaymentCashflowReport.ts` (F-293).

import { ModuleBankStatementReport } from '@/@types/language/module-bank-statement-report';

export const languageBankStatementReport: ModuleBankStatementReport = {
  report: {
    pageTitle: 'Extrato Financeiro',
    pageSubtitle: 'Relatório de extrato de movimentações por conta, categoria e centro de custo.',
    fields: {
      account: 'Conta Bancária',
      proprietary: 'Proprietários',
      costCenter: 'Centro de Custo',
      categories: 'Categorias',
      farm: 'Fazenda',
      condition: 'Tipo',
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    accountPlaceholder: 'Selecione a conta',
    proprietaryPlaceholder: 'Todos',
    costCenterPlaceholder: 'Todos',
    farmPlaceholder: 'Todas',
    condition: {
      semCategoria: 'Sem Categoria',
      comCategoria: 'Com Categoria',
    },
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    exportFileName: 'extrato-financeiro',
    popupBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      accountRequired: 'A Conta Bancária é obrigatória.',
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
