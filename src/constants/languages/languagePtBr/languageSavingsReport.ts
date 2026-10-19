// src/constants/languages/languagePtBr/languageSavingsReport.ts
// Tradução PT-BR do módulo "Savings" (relatório de Suprimentos — F-319,
// execução 97-Esteiras/013, TASK-013-F319-FE-01/02). Mirror estrutural de
// `languageMovimentacaoEstoqueReport.ts`.

import { ModuleSavingsReport } from '@/@types/language/module-savings-report';

export const languageSavingsReport: ModuleSavingsReport = {
  report: {
    pageTitle: 'Savings',
    pageSubtitle: 'Relatório de savings aplicados em cotações de compra.',
    fields: {
      farmUuid: 'Fazenda',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      status: 'Status',
      userId: 'Comprador Responsável',
    },
    statusPlaceholder: 'Selecione',
    userIdPlaceholder: 'Selecione',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    farmSearchPlaceholder: 'Buscar fazenda...',
    farmEmptyLabel: 'Nenhuma fazenda encontrada.',
    downloadPdfButton: 'Gerar PDF',
    downloadExcelButton: 'Gerar Excel',
    downloadError: 'Não foi possível gerar o relatório.',
    popupBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups.',
    exportFileName: 'savings',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      farmRequired: 'Selecione ao menos uma fazenda.',
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      endDateAfterStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
