// src/constants/languages/languagePtBr/languageMachinesSupplyReport.ts
// Tradução PT-BR do módulo "Abastecimentos" (domínio Frotas, F-277, esteira
// 97-Esteiras/054, TASK-054-277-FE-01). Mirror estrutural de
// `languageMachinesReport.ts`.

import { ModuleMachinesSupplyReport } from '@/@types/language/module-machines-supply-report';

export const languageMachinesSupplyReport: ModuleMachinesSupplyReport = {
  report: {
    pageTitle: 'Abastecimentos',
    pageSubtitle: 'Relatório de abastecimentos de máquinas da fazenda ativa.',
    fields: {
      equipmentIds: 'Máquinas',
      farmIds: 'Fazendas',
      productIds: 'Produtos',
      warehouseId: 'Armazém',
      startDate: 'Data Início',
      endDate: 'Data Fim',
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
    farmsErrorLabel: 'Erro ao carregar as fazendas.',
    farmsRetryLabel: 'Tentar novamente',
    warehousePlaceholder: 'Selecione o armazém',
    productsSearchPlaceholder: 'Buscar produto...',
    productsSelectAll: 'Marcar todos',
    productsDeselectAll: 'Desmarcar todos',
    productsSelectedCount: 'Produtos selecionados',
    productsEmptyLabel: 'Nenhum produto encontrado.',
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      equipmentsRequired: 'Selecione ao menos uma máquina.',
      endDateBeforeStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
