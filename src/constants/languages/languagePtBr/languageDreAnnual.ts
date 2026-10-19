// src/constants/languages/languagePtBr/languageDreAnnual.ts
// Tradução PT-BR do módulo "DRE Anual" (domínio Financeiro, F-258, esteira
// 97-Esteiras/049, TASK-DRE-FE-03). Mirror estrutural de `languageDre.ts`
// (tela irmã) — troca só a forma do filtro de período (ano).

import { ModuleDreAnnual } from '@/@types/language/module-dre-annual';

export const languageDreAnnual: ModuleDreAnnual = {
  report: {
    pageTitle: 'DRE Anual',
    pageSubtitle: 'Demonstrativo de Resultado do Exercício anual da fazenda ativa.',
    fields: {
      typeReport: 'Visão',
      startYear: 'Ano Início',
      endYear: 'Ano Fim',
      centerId: 'Centro de Custo',
    },
    typeReportOptions: {
      synthetic: 'Sintético',
      analytical: 'Analítico',
    },
    centerIdPlaceholder: 'Todos os centros de custo',
    yearRangeRequiredHint: 'Informe o período (Ano Início e Ano Fim) para gerar o relatório.',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      typeReportRequired: 'A visão (Sintético/Analítico) é obrigatória.',
      yearRangeRequired: 'O período (Ano Início e Ano Fim) é obrigatório.',
    },
  },
};
