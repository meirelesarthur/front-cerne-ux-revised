// src/constants/languages/languagePtBr/languageCostCenterReport.ts
// Tradução PT-BR do módulo "Centro de Custo" (relatório financeiro — F-247,
// esteira 97-Esteiras/052, TASK-052-247-FE-02). Mirror estrutural do bloco
// `report` de `languageApuracaoCusto.ts` — filtro + prévia + 2 downloads.

import { ModuleCostCenterReport } from '@/@types/language/module-cost-center-report';

export const languageCostCenterReport: ModuleCostCenterReport = {
  report: {
    pageTitle: 'Centro de Custo',
    pageSubtitle: 'Relatório de resultado agrupado por Centro de Custo.',
    fields: {
      regime: 'Regime',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      accounts: 'Contas',
      proprietary: 'Proprietário',
      costCenter: 'Centro de Custo',
      farm: 'Fazenda',
    },
    regimePlaceholder: 'Selecione o regime',
    proprietaryPlaceholder: 'Todos os proprietários',
    costCenterPlaceholder: 'Todos os centros de custo',
    farmPlaceholder: 'Todas',
    regimeOptions: {
      cash: 'Caixa',
      accrual: 'Competência',
    },
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    previewError: 'Não foi possível carregar a prévia do relatório.',
    retryButton: 'Tentar novamente',
    emptyBeforeFilter: 'Informe o regime e o período (Data Início e Data Fim) para ver a prévia.',
    emptyReport: 'Nenhuma informação encontrada.',
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
    },
  },
};
