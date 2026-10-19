// src/@types/language/module-dashboards/index.d.ts
// Interface de tradução do módulo DASHBOARDS (execução 046, TASK-DASH-FE-04
// — fundação). Cobre só o CANÔNICO do módulo (`titleModule` + `common`,
// reusado pelas 4 telas: user-analysis, feedlot-dashboard, assets-dashboard,
// abc-indicators). Cada feature acrescenta sua própria chave por-tela aqui
// (`userAnalysis`, `feedlotDashboard`, `assetsDashboard`, `abcIndicators`) —
// arquivo próprio em `module-dashboards/<tela>.d.ts`, mesma convenção de
// `module-cities`/`module-admin` (ver `get_pwa_i18n_pattern §3`).

import type { ModuleDashboardsAbcIndicators } from './abc-indicators';
import type { ModuleDashboardsAssetsDashboard } from './assets-dashboard';
import type { ModuleDashboardsCashbookDashboard } from './cashbook-dashboard';
import type { ModuleDashboardsDepreciationDashboard } from './depreciation-dashboard';
import type { ModuleDashboardsFeedlotDashboard } from './feedlot-dashboard';
import type { ModuleDashboardsFinancialDashboard } from './financial-dashboard';
import type { ModuleDashboardsLivestockDashboard } from './livestock-dashboard';
import type { ModuleDashboardsOverviewPanel } from './overview-panel';
import type { ModuleDashboardsRainfallDashboard } from './rainfall-dashboard';
import type { ModuleDashboardsUserAnalysis } from './user-analysis';

export interface ModuleDashboardsCommon {
  /** Rótulo genérico para célula/eixo sem dado (`LineChart`/`StackedBarChart`/`GroupedBarChart`/`DonutChart` vazios). */
  noData: string;
  /** Rótulo do seletor de período (7/15/30 dias, 3/6/12 meses, safra...). */
  period: string;
  /** Rótulo "Atualizado em" — timestamp do dado agregado. */
  updatedAt: string;
  /** Rótulo da opção "todas as séries" do `useSeriesFocus`/`FocusableChartCard`. */
  allSeries: string;
  /** Rótulos de eixo reutilizados pelos 5 componentes de `src/components/charts/*`. */
  axis: {
    value: string;
    date: string;
    category: string;
  };
  /** Estado vazio (sem dado real, distinto de "carregando" — ver `get_spa_ux_fidelity_pattern §3`). */
  empty: {
    title: string;
    description: string;
  };
  /** Estado de erro (fetch falhou) — mensagem + ação de retry. */
  error: {
    title: string;
    description: string;
    retry: string;
  };
  /** `ProxyBadge` (`src/components/Dashboard/ProxyBadge.tsx`) — métrica derivada. */
  proxyBadge: {
    label: string;
  };
  /** Estado "sem fazenda ativa" (Ajuste 3, F-211/exec.062) — mirror `noFarmSelected` já usado em Equipamentos/Produtos/Contas, aplicado aqui como estado de PÁGINA (não de grid) para dashboards que exigem `X-Farm-Id`. */
  noFarm: {
    title: string;
    description: string;
  };
  /** `LacunaNote` (`src/components/Dashboard/LacunaNote.tsx`) — bloco sem fonte de dado. */
  lacunaNote: {
    label: string;
  };
}

export interface ModuleDashboards {
  titleModule: string;
  common: ModuleDashboardsCommon;
  /** Análise de Usuários (execução 046, TASK-UA-FE-01). */
  userAnalysis: ModuleDashboardsUserAnalysis;
  /** Lotação de Currais (execução 046, TASK-LC-FE-01). */
  feedlotDashboard: ModuleDashboardsFeedlotDashboard;
  /** Ativos (execução 046, TASK-AT-FE-01). */
  assetsDashboard: ModuleDashboardsAssetsDashboard;
  /** Programa ABC Corte (execução 046, TASK-ABC-FE-01). */
  abcIndicators: ModuleDashboardsAbcIndicators;
  /** Pluviometria (execução 048, TASK-01-FE). */
  rainfallDashboard: ModuleDashboardsRainfallDashboard;
  /** Livro Caixa (execução 048, TASK-03-FE). */
  cashbookDashboard: ModuleDashboardsCashbookDashboard;
  /** Depreciações (execução 048, TASK-02-FE). */
  depreciationDashboard: ModuleDashboardsDepreciationDashboard;
  /** Financeiro (execução 048, TASK-04-FE). DEC-191: sem heatmap. */
  financialDashboard: ModuleDashboardsFinancialDashboard;
  /** Pecuária de Corte (execução 048, TASK-05-FE). Sem abas Produtivo/Reprodutivo. */
  livestockDashboard: ModuleDashboardsLivestockDashboard;
  /** Painel de Controle / Visão Geral (F-211, execução 062, TASK-FE-211-00). Substitui o launcher em `/home` (Opção A). */
  overviewPanel: ModuleDashboardsOverviewPanel;
}
