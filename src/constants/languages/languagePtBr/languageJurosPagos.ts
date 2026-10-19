// src/constants/languages/languagePtBr/languageJurosPagos.ts
// Tradução PT-BR do módulo "Juros Pagos" (relatório financeiro — F-290,
// esteira 97-Esteiras/073, TASK-290-FE-02). Mirror estrutural do bloco
// `report` de `languageDre.ts` — tela de filtro + download de PDF, sem
// grid/prévia.

import { ModulePaidInterestReport } from '@/@types/language/module-paid-interest-report';

export const languageJurosPagos: ModulePaidInterestReport = {
  report: {
    pageTitle: 'Juros Pagos',
    pageSubtitle: 'Relatório de juros pagos da fazenda ativa.',
    fields: {
      providers: 'Fornecedor',
      proprietary: 'Proprietário',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      farm: 'Fazenda',
    },
    providersPlaceholder: 'Todos os fornecedores',
    proprietaryPlaceholder: 'Todos os proprietários',
    farmPlaceholder: 'Todas',
    periodRequiredHint: 'Informe o período (Data Início e Data Fim) para gerar o relatório.',
    downloadPdfButton: 'Baixar PDF',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
