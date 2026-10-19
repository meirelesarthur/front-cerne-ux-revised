// src/constants/languages/languagePtBr/languageNfeProductReport.ts
// Tradução PT-BR do módulo "Faturamento" (domínio Gestão Fiscal, F-286,
// esteira 97-Esteiras/054, TASK-054-286-FE-01). Mirror estrutural de
// `languageMachinesReport.ts`.

import { ModuleNfeProductReport } from '@/@types/language/module-nfe-product-report';

export const languageNfeProductReport: ModuleNfeProductReport = {
  report: {
    pageTitle: 'Faturamento',
    pageSubtitle: 'Relatório de faturamento por produto/NF-e da fazenda ativa.',
    fields: {
      startDate: 'Data Início',
      endDate: 'Data Fim',
      clientIds: 'Clientes',
      farmIds: 'Fazendas',
      productIds: 'Produtos',
      issuerId: 'Emissor',
      type: 'Tipo de Arquivo',
    },
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
    productsSearchPlaceholder: 'Buscar produto...',
    productsSelectAll: 'Marcar todos',
    productsDeselectAll: 'Desmarcar todos',
    productsSelectedCount: 'Produtos selecionados',
    productsEmptyLabel: 'Nenhum produto encontrado.',
    issuerPlaceholder: 'Selecione o emissor',
    typeOptions: {
      pdf: 'PDF',
      xlsx: 'Excel',
    },
    downloadButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      endDateBeforeStartDate: 'A Data Fim deve ser igual ou posterior à Data Início.',
    },
  },
};
