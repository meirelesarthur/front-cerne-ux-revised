// src/constants/languages/languagePtBr/languageFinancialOfxImport.ts
// Tradução PT-BR do Relatório de Conciliação de Contas Consolidadas
// (RelatorioConsolidado — SURF-033/034). Composto dentro de
// `languageFinancial.ts` (chave `financial.ofxImport`, mirror
// `expense`/`mercadoPago`) — ver
// `@/@types/language/module-financial/ofx-import.d.ts` para o tipo.
//
// ESCOPO REDUZIDO (TASK-065-OFX-FE-01, reconciliação de merge 065): só
// `consolidatedReport` sobrevive — as demais seções (Importação/Conciliação
// OFX, Meses Conciliados) foram prunadas, telas descartadas/reconstruídas
// em `languageOfxImports` (módulo próprio).

import type { OfxImportLanguage } from '@/@types/language/module-financial/ofx-import';

export const languageFinancialOfxImport: OfxImportLanguage = {
  singularLabel: 'Importação OFX',
  pluralLabel: 'Importações OFX',

  consolidatedReport: {
    pageTitle: 'Relatório de Conciliação de Contas Consolidadas',
    pageSubtitle: 'Relatório consolidado de conciliação por categoria/centro.',
    accountLabel: 'Conta',
    accountPlaceholder: 'Todas as contas',
    startDate: 'Dt. Início',
    endDate: 'Dt. Fim',
    conditionLabel: 'Categoria/Centro de Custo',
    // Mirror FIL-012 do legado — toggle único (0/1) que acrescenta os joins
    // de categoria+centro, não uma escolha exclusiva entre os dois.
    conditionOptions: { withoutCategory: 'Sem Categoria', withCategory: 'Com Categoria' },
    providerLabel: 'Fornecedor',
    providerPlaceholder: 'Todos os fornecedores',
    clientLabel: 'Cliente',
    clientPlaceholder: 'Todos os clientes',
    orderByLabel: 'Ordenar por',
    // Mirror FIL-015 do legado (`ORDER BY date,id`) — enum fechado, front
    // nunca expõe `order_by` como texto livre.
    orderByOptions: { recent: 'Mais recente', oldest: 'Mais antigo' },
    periodRequiredHint: 'Selecione o período (Dt. Início e Dt. Fim) para gerar o relatório.',
    downloadPdfButton: 'Exportar PDF',
    downloadExcelButton: 'Exportar Excel',
    downloadError: 'Não foi possível gerar o relatório.',
    emptyState: 'Nenhum resultado para os filtros informados.',
    // NOVOS (F-213, lote 079, rework FE) — tabela de prévia em tela.
    filterButton: 'Filtrar',
    emptyBeforeFilter: 'Preencha o período e clique em "Filtrar" para ver o relatório.',
    previewError: 'Não foi possível carregar o relatório.',
    retryButton: 'Tentar novamente',
    recordsCount: (count: number) => `N. Registros: ${count}`,
    table: {
      document: 'Documento',
      participant: 'Participante',
      movementType: 'Tipo de Movimento',
      date: 'Data da Consolidação',
      account: 'Conta',
      value: 'Valor',
      category: 'Categoria',
      center: 'Centro',
    },
    movementTypes: {
      income: 'Entrada',
      expense: 'Saída',
      both: 'Ambos',
      internalTransaction: 'Transação Interna',
      movement: 'Movimento',
      financing: 'Financiamento',
    },
  },
};
