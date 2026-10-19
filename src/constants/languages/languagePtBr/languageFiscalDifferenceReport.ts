// src/constants/languages/languagePtBr/languageFiscalDifferenceReport.ts
// Tradução PT-BR do módulo "Fiscal/Não Fiscal" (relatório financeiro —
// F-266, lote 076, `FiscalDifferenceReport-contrato.md`). Mirror estrutural
// de `languageCashFlowByCategoryReport.ts` — filtro download-only, SEM
// prévia, com 2 botões PDF/Excel (mirror `languageCostingAnimalReport.ts`).

import { ModuleFiscalDifferenceReport } from '@/@types/language/module-fiscal-difference-report';

export const languageFiscalDifferenceReport: ModuleFiscalDifferenceReport = {
  report: {
    pageTitle: 'Fiscal/Não Fiscal',
    pageSubtitle:
      'Relatório financeiro de movimentações classificadas como fiscais ou não fiscais, com filtro por conta, proprietário, centro de custo e categoria.',
    fields: {
      accounts: 'Contas',
      proprietary: 'Proprietário',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      costCenter: 'Centro de Custo',
      categories: 'Categorias Financeiras',
      isFiscal: 'Fiscal/Não Fiscal',
      condition: 'Tipo',
    },
    proprietaryPlaceholder: 'Todos os proprietários',
    costCenterPlaceholder: 'Todos os centros de custo',
    isFiscalOptions: {
      both: 'Ambos',
      yes: 'Sim',
      no: 'Não',
    },
    conditionOptions: {
      withoutCategory: 'Sem Categoria',
      withCategory: 'Com Categoria',
    },
    lookupSearchPlaceholder: 'Buscar...',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    lookupEmptyMessage: 'Nenhum item encontrado.',
    exportPdfButton: 'Baixar PDF',
    exportXlsxButton: 'Baixar Excel',
    successToast: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
