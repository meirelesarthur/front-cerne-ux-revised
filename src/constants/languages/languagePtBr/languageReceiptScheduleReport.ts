// src/constants/languages/languagePtBr/languageReceiptScheduleReport.ts
// Tradução PT-BR do módulo "Agenda/Recebimentos" (relatório Financeiro —
// F-304, esteira 97-Esteiras/055, TASK-055-F304-FE-01). Mirror estrutural
// do bloco `report` de `languageReceiptsReport.ts` (F-305) — 8 campos
// (contrato de tela §2.1), datas OPCIONAIS (fidelidade ao legado, CF304-05).

import { ModuleReceiptScheduleReport } from '@/@types/language/module-receipt-schedule-report';

export const languageReceiptScheduleReport: ModuleReceiptScheduleReport = {
  receiptScheduleReport: {
    singularLabel: 'Agenda de Recebimentos',
    pluralLabel: 'Agendas de Recebimentos',
  },
  report: {
    pageTitle: 'Agenda/Recebimentos',
    pageSubtitle: 'Relatório de contas a receber por vencimento.',
    submitButton: 'Gerar relatório',
    fields: {
      client: 'Cliente',
      farm: 'Fazenda',
      startDate: 'Data Início Venc.',
      endDate: 'Data Fim Venc.',
      proprietary: 'Proprietário Gestor',
      costCenter: 'Centro de Custo',
      category: 'Categoria Financeira',
      format: 'Formato',
    },
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodOrder: 'A data fim deve ser maior ou igual à data início.',
    },
    empty: 'Nenhum item encontrado.',
    error: 'Erro ao carregar a lista.',
    retry: 'Tentar novamente',
    searchPlaceholder: 'Buscar...',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
  },
};
