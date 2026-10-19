// src/constants/languages/languagePtBr/languageWeighingHarvestReport.ts
// Tradução PT-BR do módulo "Pesagens/Colheita" (relatório de Agricultura,
// F-335, execução 053, TASK-053-335-FE-01). Mirror estrutural de
// `languageStockProviderLotReport.ts`.

import { ModuleWeighingHarvestReport } from '@/@types/language/module-weighing-harvest-report';

export const languageWeighingHarvestReport: ModuleWeighingHarvestReport = {
  report: {
    pageTitle: 'Pesagens/Colheita',
    pageSubtitle: 'Relatório de pesagens da colheita da fazenda ativa.',
    fields: {
      startDate: 'Data Inicial',
      endDate: 'Data Final',
      product: 'Produto',
      area: 'Área',
      warehouse: 'Armazém',
      client: 'Cliente',
      type: 'Tipo de Pesagem',
      format: 'Formato',
    },
    productPlaceholder: 'Todos os produtos',
    areaPlaceholder: 'Todas as áreas',
    warehousePlaceholder: 'Todos os armazéns',
    clientPlaceholder: 'Todos os clientes',
    typePlaceholder: 'Todos os tipos',
    periodRequiredHint: 'Informe o período (Data Inicial e Data Final) para gerar o relatório.',
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Inicial e Data Final) é obrigatório.',
    },
  },
};
