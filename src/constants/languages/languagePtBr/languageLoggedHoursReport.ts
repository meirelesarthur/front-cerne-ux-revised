// src/constants/languages/languagePtBr/languageLoggedHoursReport.ts
// Tradução PT-BR do módulo "Horas Logadas" (relatório de Gestão Pessoal —
// F-275, esteira 97-Esteiras/012, Tarefa 47 + correção pós-QA-manual). Mirror
// ESTRUTURAL do bloco `report` de `languageCustoProducao.ts`, sem drill-down
// e sem prévia/grade em tela.

import { ModuleLoggedHoursReport } from '@/@types/language/module-logged-hours-report';

export const languageLoggedHoursReport: ModuleLoggedHoursReport = {
  report: {
    pageTitle: 'Horas Logadas',
    pageSubtitle: 'Tempo de sessão dos usuários, agrupado por contratante e fazenda.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      tenant: 'Contratante',
      farm: 'Fazenda',
    },
    tenantPlaceholder: 'Selecione o contratante',
    farmPlaceholder: 'Todas',
    filtersSectionTitle: 'Filtros',
    downloadPdfButton: 'Gerar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    popupBlocked:
      'O navegador bloqueou a nova aba. Libere pop-ups para este site e tente novamente.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
      endDateBeforeStartDate: 'A Dt. Fim deve ser igual ou posterior à Dt. Início.',
    },
  },
};
