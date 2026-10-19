// src/constants/languages/languagePtBr/languageCostingAreaReport.ts
// Tradução PT-BR do módulo "Custeio/Área" (relatório agrícola — F-252,
// esteira 079, TASK-252-FE-01).
//
// `pageTitle` (C-13, mirror F-298): string exata confirmada por leitura
// direta de `agro365/lang/pt-BR/trad.php:139` (`trad.custeio_area` =
// "Custeio/Área") — DIVERGE de propósito do rótulo do item de MENU (mesmo
// texto aqui, mas ambos tratados como campos independentes por convenção,
// fidelidade ao legado: menu e título de tela/PDF nunca foram sincronizados
// à força).

import { ModuleCostingAreaReport } from '@/@types/language/module-costing-area-report';

export const languageCostingAreaReport: ModuleCostingAreaReport = {
  report: {
    pageTitle: 'Custeio/Área',
    pageSubtitle: 'Relatório de custeio agrupado por área.',
    fields: {
      productionCycle: 'Ciclo de Produção',
      areas: 'Áreas',
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
    },
    productionCyclePlaceholder: 'Selecione o ciclo de produção',
    areasPlaceholder: 'Selecione as áreas',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    periodRequiredHint: 'Informe o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    validation: {
      periodRequired: 'O período (Dt. Início e Dt. Fim) é obrigatório.',
    },
  },
};
