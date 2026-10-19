// src/constants/languages/languagePtBr/languageReceivedInterestReport.ts
// Tradução PT-BR do módulo "Juros Recebidos" (relatório Financeiro —
// esteira 97-Esteiras/014, Tarefa 49). Mirror estrutural do bloco `report`
// de `languageReceiptScheduleReport.ts` (F-304), campo `client` (mirror
// `languageJurosPagos.ts`/F-290 para `validation.periodRequired`, datas
// obrigatórias).

import { ModuleReceivedInterestReport } from '@/@types/language/module-received-interest-report';

export const languageReceivedInterestReport: ModuleReceivedInterestReport = {
  receivedInterestReport: {
    singularLabel: 'Juros Recebidos',
    pluralLabel: 'Juros Recebidos',
  },
  report: {
    pageTitle: 'Juros Recebidos',
    pageSubtitle: 'Relatório de juros recebidos da fazenda ativa.',
    submitButton: 'Gerar relatório',
    fields: {
      client: 'Cliente',
      proprietary: 'Proprietário',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      farm: 'Fazenda',
      format: 'Formato',
    },
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
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
