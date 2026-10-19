// src/constants/languages/languagePtBr/languageDeathAnimalSisbovReport.ts
// Tradução PT-BR do módulo "Mortes/SISBOV" (domínio Pecuária, F-253,
// esteira 97-Esteiras/054, TASK-054-253-FE-01). Mirror estrutural EXATO de
// `languageBirthAnimalSisbovReport.ts` (irmão F-235) — tela de filtro +
// download de PDF, sem grid/prévia.

import { ModuleDeathAnimalSisbovReport } from '@/@types/language/module-death-animal-sisbov-report';

export const languageDeathAnimalSisbovReport: ModuleDeathAnimalSisbovReport = {
  report: {
    pageTitle: 'Mortes/SISBOV',
    pageSubtitle: 'Relatório de mortes com identificação SISBOV da fazenda ativa.',
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
