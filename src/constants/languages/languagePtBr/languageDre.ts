// src/constants/languages/languagePtBr/languageDre.ts
// Tradução PT-BR do módulo "DRE" (domínio Financeiro, F-259, esteira
// 97-Esteiras/049, TASK-DRE-FE-01). Mirror estrutural do bloco `report` de
// `languageAccountingEntries.ts` — tela de filtro + download de PDF, sem
// grid/prévia.

import { ModuleDre } from '@/@types/language/module-dre';

export const languageDre: ModuleDre = {
  report: {
    pageTitle: 'DRE',
    pageSubtitle: 'Demonstrativo de Resultado do Exercício da fazenda ativa.',
    fields: {
      typeReport: 'Visão',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      centerId: 'Centro de Custo',
    },
    typeReportOptions: {
      synthetic: 'Sintético',
      analytical: 'Analítico',
    },
    centerIdPlaceholder: 'Todos os centros de custo',
    periodRequiredHint: 'Informe o período (Data Início e Data Fim) para gerar o relatório.',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      typeReportRequired: 'A visão (Sintético/Analítico) é obrigatória.',
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
