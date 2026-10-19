// src/constants/languages/languagePtBr/languageNfeReport.ts
// Tradução PT-BR do módulo "NFe/Emitidas" (domínio Gestão Fiscal, F-287,
// esteira 97-Esteiras/079, TASK-F287-FE-01). Mirror estrutural de
// `languageNfeProductReport.ts`. Rótulos fiéis ao legado (contrato
// `screen_contract.campos`): "Dt. Início"/"Dt. Fim"/"Status"/"Cliente"/
// "Fazenda"/"Centro de Custo"/"Emissor NF-e"/"Prestador de serviço"/
// "Tipo de Relatório".

import { ModuleNfeReport } from '@/@types/language/module-nfe-report';

export const languageNfeReport: ModuleNfeReport = {
  report: {
    pageTitle: 'NFe/Emitidas',
    pageSubtitle: 'Relatório de NF-e emitidas da fazenda ativa.',
    fields: {
      startDate: 'Dt. Início',
      endDate: 'Dt. Fim',
      status: 'Status',
      clientIds: 'Cliente',
      farmIds: 'Fazenda',
      centerIds: 'Centro de Custo',
      issuerId: 'Emissor NF-e',
      providerId: 'Prestador de Serviço',
      format: 'Tipo de Relatório',
    },
    statusPlaceholder: 'Selecione o status',
    clientsSearchPlaceholder: 'Buscar cliente...',
    clientsSelectAll: 'Marcar todos',
    clientsDeselectAll: 'Desmarcar todos',
    clientsSelectedCount: 'Clientes selecionados',
    clientsEmptyLabel: 'Nenhum cliente encontrado.',
    farmsSearchPlaceholder: 'Buscar fazenda...',
    farmsSelectAll: 'Marcar todas',
    farmsDeselectAll: 'Desmarcar todas',
    farmsSelectedCount: 'Fazendas selecionadas',
    farmsEmptyLabel: 'Nenhuma fazenda encontrada.',
    centersSearchPlaceholder: 'Buscar centro de custo...',
    centersSelectAll: 'Marcar todos',
    centersDeselectAll: 'Desmarcar todos',
    centersSelectedCount: 'Centros de custo selecionados',
    centersEmptyLabel: 'Nenhum centro de custo encontrado.',
    issuerPlaceholder: 'Selecione o emissor',
    providerPlaceholder: 'Selecione o prestador de serviço',
    formatOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      endDateBeforeStartDate: 'A Dt. Fim deve ser igual ou posterior à Dt. Início.',
    },
  },
};
