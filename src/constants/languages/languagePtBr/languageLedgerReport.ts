// src/constants/languages/languagePtBr/languageLedgerReport.ts
// Tradução PT-BR do módulo "Livro Razão" (relatório financeiro — F-274,
// 97-Esteiras/008, TASK-FE-LR-01). Correção pós-entrega (2026-09-09): SEM
// prévia em tela — download-only (PDF+Excel), fiel ao legado.
//
// Labels de `conditionOptions` literais do select legado (`FL-07`) — os
// labels LONGOS do enum do servidor ("Sem Categoria (linha = movimento)")
// só aparecem no PDF/Excel gerados pelo servidor, não são replicados aqui.

import { ModuleLedgerReport } from '@/@types/language/module-ledger-report';

export const languageLedgerReport: ModuleLedgerReport = {
  report: {
    pageTitle: 'Livro Razão',
    pageSubtitle:
      'Extrato contábil de uma conta bancária no período, com saldo anterior, saldo corrente e totais por mês.',
    fields: {
      account: 'Conta',
      startDate: 'Data Início',
      endDate: 'Data Fim',
      condition: 'Condição',
      proprietary: 'Proprietário Gestor',
      costCenter: 'Centro de Custo',
      planAccount: 'Plano de Contas',
      categories: 'Categorias Financeiras',
    },
    accountPlaceholder: 'Selecione a conta',
    conditionPlaceholder: 'Selecione a condição',
    proprietaryPlaceholder: 'Todos os proprietários',
    costCenterPlaceholder: 'Todos os centros de custo',
    planAccountPlaceholder: 'Todos os planos de contas',
    conditionOptions: {
      withoutCategory: 'Sem Categoria',
      withCategory: 'Com Categoria',
    },
    downloadPdfButton: 'Baixar PDF',
    downloadExcelButton: 'Baixar Excel',
    downloadSuccess: 'Relatório gerado com sucesso.',
    downloadError: 'Não foi possível gerar o relatório.',
    emptyBeforeFilter:
      'Informe a conta e o período (Data Início e Data Fim) para gerar o relatório.',
    validation: {
      accountRequired: 'A conta é obrigatória.',
      periodRequired: 'O período (Data Início e Data Fim) é obrigatório.',
      conditionRequired: 'A condição é obrigatória.',
    },
  },
};
