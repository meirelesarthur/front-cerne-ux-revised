// src/constants/languages/languagePtBr/languageIdentificationAnimalSisbovReport.ts
// Tradução PT-BR do módulo "Identificação/SISBOV" (domínio Pecuária, F-270,
// esteira 97-Esteiras/078, TASK-F270-F01). Mirror estrutural de
// `languageBirthAnimalSisbovReport.ts`, + `validation.periodRequired`
// (datas OBRIGATÓRIAS, fidelidade ao contrato F-270).

import { ModuleIdentificationAnimalSisbovReport } from '@/@types/language/module-identification-animal-sisbov-report';

export const languageIdentificationAnimalSisbovReport: ModuleIdentificationAnimalSisbovReport = {
  report: {
    pageTitle: 'Identificação/SISBOV',
    pageSubtitle: 'Relatório de identificação com código SISBOV da fazenda ativa por período.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    downloadPdfButton: 'Baixar PDF',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período é obrigatório.',
      endDateBeforeStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
