// src/constants/languages/languagePtBr/languageMachinesMaintenanceReport.ts
// Tradução PT-BR do módulo "Manutenções" (domínio Frotas, F-276, execução
// 97-Esteiras/078, TASK-F276-F01). Mirror DUPLO `languageMachinesSupplyReport`
// (checkbox equipment/farm) + `languageRequisitionsReport` (warehouse/
// product single + 2 botões PDF/Excel).

import { ModuleMachinesMaintenanceReport } from '@/@types/language/module-machines-maintenance-report';

export const languageMachinesMaintenanceReport: ModuleMachinesMaintenanceReport = {
  report: {
    pageTitle: 'Manutenções',
    pageSubtitle: 'Relatório de manutenções de máquinas da fazenda ativa.',
    fields: {
      equipmentIds: 'Máquinas',
      farmIds: 'Fazendas',
      warehouse: 'Armazém',
      product: 'Produto',
      startDate: 'Data Início',
      endDate: 'Data Fim',
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
    farmsErrorLabel: 'Erro ao carregar as fazendas.',
    farmsRetryLabel: 'Tentar novamente',
    warehousePlaceholder: 'Todos',
    productPlaceholder: 'Selecione',
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    exportFileName: 'relatorio_manutencoes',
    popupBlocked: 'Não foi possível abrir a nova aba. Verifique o bloqueador de pop-ups.',
    toasts: {
      success: 'Relatório gerado com sucesso.',
      genericError: 'Não foi possível gerar o relatório.',
    },
    validation: {
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      endDateAfterStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
      equipmentRequired: 'Selecione ao menos uma máquina.',
    },
  },
};
