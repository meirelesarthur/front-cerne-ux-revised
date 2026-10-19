// src/constants/languages/languagePtBr/languagePaymentScheduleReport.ts
// Tradução PT-BR do módulo "Agenda/Pagamentos" (relatório Financeiro —
// F-294, CONTRATO-F294-agenda-pagamentos.md, esteira 97-Esteiras/059).
// Mirror estrutural do bloco `report` de `languageReceiptScheduleReport.ts`
// (F-304).

import { ModulePaymentScheduleReport } from '@/@types/language/module-payment-schedule-report';

export const languagePaymentScheduleReport: ModulePaymentScheduleReport = {
  paymentScheduleReport: {
    singularLabel: 'Agenda de Pagamento',
    pluralLabel: 'Agenda de Pagamentos',
  },
  report: {
    pageTitle: 'Agenda/Pagamentos',
    pageSubtitle: 'Relatório de agenda de pagamentos, por período, status e demais filtros.',
    submitButton: 'Gerar Relatório',
    fields: {
      number: 'Número',
      farm: 'Fazenda',
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      proprietary: 'Proprietário',
      status: 'Status',
      costCenter: 'Centro de Custo',
      category: 'Categoria',
      format: 'Formato',
    },
    statusOptions: {
      dueSoon: 'A vencer',
      overdue: 'Vencido',
      partial: 'Parcial',
      settled: 'Quitado',
    },
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodOrder: 'A Data Final deve ser igual ou posterior à Data Inicial.',
    },
    empty: 'Nenhuma categoria encontrada.',
    error: 'Não foi possível carregar as categorias.',
    retry: 'Tentar novamente',
    searchPlaceholder: 'Buscar categoria...',
    selectAll: 'Selecionar todos',
    deselectAll: 'Remover seleção',
  },
};
