// src/constants/languages/languagePtBr/languageAccountsPayableReceivableReport.ts
// -----------------------------------------------------------------------------
// Tradução PT-BR do módulo "Consolidado Pagar/Receber" (relatório financeiro —
// F-214, esteira 97-Esteiras/052, TASK-052-214-FE-01/02).
// -----------------------------------------------------------------------------

import { ModuleAccountsPayableReceivableReport } from '@/@types/language/module-accounts-payable-receivable-report';

export const languageAccountsPayableReceivableReport: ModuleAccountsPayableReceivableReport = {
  report: {
    pageTitle: 'Consolidado (Pagar/Receber)',
    pageSubtitle: 'Relatório consolidado de contas a pagar e a receber, com status de baixa.',
    fields: {
      startEmissionDate: 'Data Emissão Início',
      endEmissionDate: 'Data Emissão Fim',
      startWriteOffDate: 'Data Baixa Início',
      endWriteOffDate: 'Data Baixa Fim',
      provider: 'Fornecedor',
      client: 'Cliente',
      center: 'Centro de Custo',
      account: 'Conta',
      category: 'Categoria Financeira',
      status: 'Status',
      format: 'Formato',
    },
    providerPlaceholder: 'Todos os fornecedores',
    clientPlaceholder: 'Todos os clientes',
    centerPlaceholder: 'Todos os centros de custo',
    accountPlaceholder: 'Todas as contas',
    categoryPlaceholder: 'Todas as categorias',
    statusOptions: {
      open: 'Em Aberto',
      partial: 'Parcial',
      settled: 'Quitado',
      advance: 'Adiantamento',
    },
    lookupSearchPlaceholder: 'Buscar...',
    selectAll: 'Marcar todos',
    deselectAll: 'Desmarcar todos',
    lookupEmptyMessage: 'Nenhum item encontrado.',
    generateButton: 'Gerar relatório',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    validation: {
      emissionRequired: 'A data de emissão é obrigatória.',
      invalidEmissionDateRange: 'A data de emissão fim deve ser igual ou posterior à data início.',
      invalidWriteOffDateRange: 'A data de baixa fim deve ser igual ou posterior à data início.',
      formatRequired: 'O formato é obrigatório.',
    },
  },
};
