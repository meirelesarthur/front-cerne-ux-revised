// src/constants/languages/languagePtBr/languageAnsReport.ts
// Tradução PT-BR do módulo "ANS" (relatório de Suprimentos — F-229, lote 076,
// `F-229-ans-report-contrato-api.md`). Mirror estrutural de
// `languageCostingAnimalReport.ts` — filtro download-only, SEM prévia, com 2
// botões PDF/Excel, só o par de datas como filtro.

import { ModuleAnsReport } from '@/@types/language/module-ans-report';

export const languageAnsReport: ModuleAnsReport = {
  report: {
    pageTitle: 'ANS',
    pageSubtitle:
      'Relatório de Acordo de Nível de Serviço das solicitações de compra, com filtro por período.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
    },
    exportPdfButton: 'Baixar PDF',
    exportXlsxButton: 'Baixar Excel',
    successToast: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Selecione o período (Data Início e Data Fim) para habilitar o download.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
