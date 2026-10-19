// src/constants/languages/languagePtBr/languageMachinesReport.ts
// Tradução PT-BR do módulo "Máquinas" (domínio Frotas, F-278, esteira
// 97-Esteiras/052, TASK-052-278-FE-01). Mirror estrutural de
// `languageStockProviderLotReport.ts`.

import { ModuleMachinesReport } from '@/@types/language/module-machines-report';

export const languageMachinesReport: ModuleMachinesReport = {
  report: {
    pageTitle: 'Máquinas',
    pageSubtitle: 'Relatório de manutenções de máquinas da fazenda ativa.',
    fields: {
      equipmentIds: 'Máquinas',
      farmIds: 'Fazendas',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      maintenanceType: 'Tipo de Executor',
      maintenanceExecutor: 'Executor',
      format: 'Formato',
    },
    equipmentsSearchPlaceholder: 'Buscar máquina...',
    equipmentsSelectAll: 'Marcar todos',
    equipmentsDeselectAll: 'Desmarcar todos',
    equipmentsSelectedCount: 'Máquinas selecionadas',
    equipmentsEmptyLabel: 'Nenhuma máquina encontrada.',
    equipmentsErrorLabel: 'Erro ao carregar as máquinas.',
    equipmentsRetryLabel: 'Tentar novamente',
    farmsSearchPlaceholder: 'Buscar fazenda...',
    farmsSelectAll: 'Marcar todas',
    farmsDeselectAll: 'Desmarcar todas',
    farmsSelectedCount: 'Fazendas selecionadas',
    farmsEmptyLabel: 'Nenhuma fazenda encontrada.',
    maintenanceExecutorPlaceholder: 'Selecione o executor',
    maintenanceTypeOptions: {
      employee: 'Funcionário',
      provider: 'Fornecedor',
    },
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      equipmentsRequired: 'Selecione ao menos uma máquina.',
      endDateBeforeStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
