// src/constants/languages/languagePtBr/languageSupplyDashboard.ts
// Tradução pt-BR do módulo "Suprimentos" (SupplyDashboard — Dashboards,
// esteira 97-Esteiras/019, Tarefas 55-58, reformulação v2). Ver
// `@/@types/language/module-supply-dashboard` para o contrato completo.

import { ModuleSupplyDashboard } from '@/@types/language/module-supply-dashboard';

export const languageSupplyDashboard: ModuleSupplyDashboard = {
  titleModule: 'Suprimentos',
  pageTitle: 'Suprimentos',
  filter: {
    title: 'Filtrar Suprimentos',
    farms: 'Fazendas',
    farmsSearchPlaceholder: 'Buscar fazenda...',
    farmsSelectedCount: 'Selecionadas',
    harvest: 'Safra',
    harvestPlaceholder: 'Buscar safra...',
    startDate: 'Dt. Início',
    endDate: 'Dt. Fim',
  },
  errors: {
    loadFailed: 'Não foi possível carregar o dashboard.',
  },
  period: {
    label: 'Período',
  },
  kpis: {
    vsPreviousPeriod: 'vs. mês anterior',
    noBaseline: 'Sem base no período anterior',
  },
  funnel: {
    title: 'Funil de suprimentos',
    finalConversionRate: 'taxa final',
    conversionSuffix: 'conv.',
    averageValue: 'Valor médio',
    leadTime: 'Lead time',
    actualDuration: 'Prazo médio',
  },
  providers: {
    title: 'Top fornecedores',
    empty: 'Nenhum fornecedor no período filtrado',
    badge: {
      excellent: 'Excelente',
      good: 'Bom',
      regular: 'Regular',
    },
  },
};
