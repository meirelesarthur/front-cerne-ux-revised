// src/constants/languages/languagePtBr/languageReceiptsReport.ts
// Tradução PT-BR do módulo "Recebimentos" (relatório de Estoque — F-305,
// esteira 97-Esteiras/074, TASK-RCB-FE-01). Mirror estrutural do bloco
// `report` de `languageCustoProducaoBatidaReport.ts`, com 6 campos (contrato
// front §4, literais fiéis ao legado — sem melhoria de redação).

import { ModuleReceiptsReport } from '@/@types/language/module-receipts-report';

export const languageReceiptsReport: ModuleReceiptsReport = {
  report: {
    pageTitle: 'Recebimentos',
    pageSubtitle: 'Relatório de recebimentos por período.',
    fields: {
      product: 'Produto',
      center: 'Centro de Custo',
      category: 'Categoria',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      reportType: 'Tipo de Relatório',
    },
    productPlaceholder: 'Todos os produtos',
    centerPlaceholder: 'Todos os centros de custo',
    categoryPlaceholder: 'Todas as categorias',
    reportTypeOptions: { pdf: 'PDF', excel: 'Excel' },
    periodRequiredHint: 'Informe o período (Data Início e Data Fim) para gerar o relatório.',
    submitButton: 'Gerar',
    successToast: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      periodOrder: 'A Data Fim não pode ser anterior à Data Início.',
    },
  },
};
