// src/pages/Dashboards/DepreciationDashboard/index.tsx
// Tela "Depreciações" (execução 048, TASK-02-FE) — fiel a
// `DashDepreciacoes.tsx@8663490`, adaptada ao shape FINAL/APROVADO de
// `CONTRATO-API-048-02-depreciation-dashboard.md` (filtro real `year`/
// `asset_type` — o preset 3/6/12 meses do rascunho do ROTEIRO §5.2 não
// existe no contrato de API liberado, resolvido a favor do contrato). Dado
// real via `GET /dashboards/depreciation`; `forecast_24m` reusa
// `CalculateDepreciationForecastAction` (mesmos campos de
// `DepreciationForecastRow`, `vl_depreciate` sempre ao vivo).

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiBarChart2 } from 'react-icons/fi';

import {
  DashboardGrid,
  DashboardKpiCard,
  DashboardRow,
  DashboardSkeleton,
  DashboardStateMessage,
} from '@/components/Dashboard';

import { useAuth } from '@/hooks/useAuth';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { queryKey } from '@/constants/query-key';

import { getDepreciationDashboard } from '@/services/v2/Dashboards/depreciationDashboard-service';

import type { DepreciationDashboardFilterForm } from '@/@types/v2/Dashboards/depreciationDashboard';

import { ComposicaoPorTipo } from './blocks/ComposicaoPorTipo';
import { DepreciacaoPorCategoria } from './blocks/DepreciacaoPorCategoria';
import { ProjecaoChart } from './blocks/ProjecaoChart';
import { FilterSideDepreciationDashboard } from './FilterSideDepreciationDashboard';
import { HeaderDashboard } from './HeaderDashboard';

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULT_FILTER: DepreciationDashboardFilterForm = {
  year: { label: String(CURRENT_YEAR), value: CURRENT_YEAR },
  assetType: { label: 'all', value: 'all' },
};

export default function DepreciationDashboard() {
  const { languageGB, languageInUse } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.dashboards.depreciationDashboard;
  const commonText = languageGB.dashboards.common;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // CORREÇÃO — decisão do dono (048): dashboard NÃO pagina, o filtro NÃO
  // vai mais para a URL (`usePaginatedQueryUrl` removido). Estado LOCAL
  // por requisição — resolve URL suja, flicker do contador e o crash
  // `dateString.match is not a function` no drawer de outros dashboards
  // (aqui não há data, mas mesma correção sistêmica nos 5).
  const [filter, setFilter] = useState<DepreciationDashboardFilterForm>(DEFAULT_FILTER);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(DEFAULT_FILTER);

  const filtersApplied = useMemo(
    () =>
      (filter.year && filter.year.value !== CURRENT_YEAR ? 1 : 0) +
      (filter.assetType && filter.assetType.value !== 'all' ? 1 : 0),
    [filter]
  );

  const query = useQuery({
    queryKey: [queryKey.dashboards.depreciationDashboard, languageInUse, activeFarmUuid, filter],
    queryFn: async () => {
      const response = await getDepreciationDashboard({
        year: filter.year?.value ?? CURRENT_YEAR,
        asset_type: filter.assetType?.value ?? 'all',
      });
      return response.data;
    },
  });

  const showSkeleton = useDelayedLoading(query.isPending);

  if (query.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={4} blocks={[240, 240, 220]} /> : null;
  }

  const data = query.data;

  // Regra de ouro: TODO array/objeto lido com `?? []`/`?? 0` — nunca
  // acesso direto que possa explodir em `undefined`.
  const accumulated = data?.accumulated ?? { total_equipment: 0, total_animal: 0, total: 0 };
  const monthly = data?.monthly ?? [];
  const composition = data?.composition ?? [];
  const forecast24m = data?.forecast_24m ?? [];

  const isEmpty = !query.isError && (!data || accumulated.total === 0);

  const forecastAnchor = forecast24m[0] ?? null;
  const currentMonthRow = monthly.length > 0 ? monthly[monthly.length - 1] : null;
  const monthlyDepreciation = currentMonthRow
    ? currentMonthRow.equipment_total + currentMonthRow.animal_total
    : null;

  // CORREÇÃO PÓS-HOMOLOGAÇÃO (048): "Valor do bem"/"Saldo residual" agora
  // usam os campos CANÔNICOS agregados que a API passa a publicar
  // (`valor_do_bem`/`saldo_residual`) — antes caíam em "—" porque
  // dependiam só de `forecast_24m[0]` (bloqueado por lacuna quando nenhum
  // `equipment_id` era informado). Fallback para a âncora do forecast
  // preservado só durante o rollout (campo novo ainda opcional no tipo).
  const totalAssetValue = data?.valor_do_bem ?? forecastAnchor?.vl_depreciate ?? null;
  const residualValue = data?.saldo_residual ?? forecastAnchor?.sd_depreciate ?? null;

  return (
    <DashboardGrid>
      <HeaderDashboard filtersApplied={filtersApplied} onOpenFilter={() => setIsFilterOpen(true)} />

      {query.isError ? (
        <DashboardStateMessage
          icon={FiAlertTriangle}
          title={commonText.error.title}
          description={commonText.error.description}
          actionLabel={commonText.error.retry}
          onAction={() => query.refetch()}
        />
      ) : isEmpty ? (
        <DashboardStateMessage
          icon={FiBarChart2}
          title={commonText.empty.title}
          description={commonText.empty.description}
        />
      ) : (
        data && (
          <>
            <DashboardRow>
              <DashboardKpiCard
                label={text.kpis.totalAssetValue}
                value={totalAssetValue != null ? formatCurrencyBRL(totalAssetValue) : '—'}
              />
              <DashboardKpiCard
                label={text.kpis.monthlyDepreciation}
                value={monthlyDepreciation != null ? formatCurrencyBRL(monthlyDepreciation) : '—'}
              />
              <DashboardKpiCard
                label={text.kpis.accumulatedDepreciation}
                value={formatCurrencyBRL(accumulated.total)}
              />
              <DashboardKpiCard
                label={text.kpis.residualValue}
                value={residualValue != null ? formatCurrencyBRL(residualValue) : '—'}
              />
            </DashboardRow>

            <DepreciacaoPorCategoria data={monthly} />

            <DashboardRow>
              <ComposicaoPorTipo data={composition} />
              <ProjecaoChart data={forecast24m} />
            </DashboardRow>
          </>
        )
      )}

      <FilterSideDepreciationDashboard
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        handleReset={handleResetFilter}
        handleFilterChange={handleFilterChange}
        filter={filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />
    </DashboardGrid>
  );
}
