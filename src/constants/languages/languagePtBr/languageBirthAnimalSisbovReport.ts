// src/constants/languages/languagePtBr/languageBirthAnimalSisbovReport.ts
// Tradução PT-BR do módulo "Nascimentos/SISBOV" (domínio Pecuária, F-235,
// esteira 97-Esteiras/052, TASK-052-235-FE-01). Mirror estrutural de
// `languageDre.ts` — tela de filtro + download de PDF, sem grid/prévia.

import { ModuleBirthAnimalSisbovReport } from '@/@types/language/module-birth-animal-sisbov-report';

export const languageBirthAnimalSisbovReport: ModuleBirthAnimalSisbovReport = {
  report: {
    pageTitle: 'Nascimentos/SISBOV',
    pageSubtitle: 'Relatório de nascimentos com identificação SISBOV da fazenda ativa.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    downloadPdfButton: 'Baixar PDF',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      endDateBeforeStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
