// src/pages/Dashboards/AbcIndicators/index.tsx
// Tela "Programa ABC Corte" (execução 046, TASK-ABC-FE-05) — ÚNICA das 4
// SEM desenho no UX (`UXGAP-046-01`, `DEC-183`: seguir-pelo-padrão). Composta
// só pelo kit da fundação + padrões MCP — nenhum layout inventado. Dado real
// via `GET /dashboards/abc-indicators`
// (`CONTRATO-API-046-04-abc-indicators.md`); 14 indicadores operacionais,
// ZERO financeiro. `ABC-GUARD-01`: só calcula com pasto/módulo + as 2 datas.

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiBarChart2, FiSliders } from 'react-icons/fi';

import {
  DashboardGrid,
  DashboardKpiCard,
  DashboardRow,
  DashboardSkeleton,
  DashboardStateMessage,
} from '@/components/Dashboard';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useLanguage } from '@/hooks/useLanguage';

import { dateOnlyToYmd } from '@/utils/dateOnlyToYmd';

import { formatAbcIndicator } from '@/constants/dashboards/abcIndicators/abc-indicator-format';
import { queryKey } from '@/constants/query-key';

import { getAbcIndicators } from '@/services/v2/Dashboards/abcIndicators-service';

import type { AbcIndicatorsFilterForm } from '@/@types/v2/Dashboards/abcIndicators';

import { IndicadoresZootecnicos } from './blocks/IndicadoresZootecnicos';
import { OcupacaoDoModulo } from './blocks/OcupacaoDoModulo';
import { ProducaoDoPeriodo } from './blocks/ProducaoDoPeriodo';
import { FilterSideAbcIndicators } from './FilterSideAbcIndicators';
import { HeaderDashboard } from './HeaderDashboard';

const DEFAULT_FILTER: AbcIndicatorsFilterForm = {
  harvest: null,
  grazing: null,
  startDate: null,
  endDate: null,
};

export default function AbcIndicators() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.dashboards.abcIndicators;
  const commonText = languageGB.dashboards.common;
  const units = languageGB.dashboards.abcIndicators.units;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // CORREÇÃO — mesma classe de flicker do 048 (ABC-1): `usePaginatedQueryUrl`
  // com `defaultQuery` literal novo a cada render disparava o efeito de
  // resync com a URL em loop. Estado LOCAL por requisição, espelhando
  // `LivestockDashboard`/`CashbookDashboard`/`FinancialDashboard`.
  const [filter, setFilter] = useState<AbcIndicatorsFilterForm>(DEFAULT_FILTER);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(DEFAULT_FILTER);

  const filtersApplied = useMemo(
    () =>
      (filter.harvest ? 1 : 0) +
      (filter.grazing ? 1 : 0) +
      (filter.startDate ? 1 : 0) +
      (filter.endDate ? 1 : 0),
    [filter]
  );

  // `ABC-GUARD-01` — só calcula com pasto/módulo + as 2 datas preenchidos.
  const canQuery = !!filter.grazing && !!filter.startDate && !!filter.endDate;

  const query = useQuery({
    queryKey: [queryKey.dashboards.abcIndicators, languageInUse, filter],
    queryFn: async () => {
      const response = await getAbcIndicators({
        harvest_uuid: filter.harvest?.value,
        grazing_uuid: filter.grazing!.value,
        // GAP-FE-247 (causa-raiz real, ver `dateOnlyToYmd`): `usePaginatedQueryUrl`
        // (`reviveFilterData`) reidrata `startDate`/`endDate` como `Date` a
        // toda sincronização com a URL — mesmo já normalizados para
        // `yyyy-MM-dd` na cascata `ABC-CASCADE-01`. O `axios` serializa
        // `Date` em query string via `toISOString()`
        // (`2026-01-01T00:00:00.000Z`), que o backend rejeita (422 — só
        // aceita `Y-m-d`). Normaliza NO PONTO de envio, independente do tipo
        // em que `filter.startDate`/`endDate` chegou.
        start_date: dateOnlyToYmd(filter.startDate)!,
        end_date: dateOnlyToYmd(filter.endDate)!,
      });
      return response.data;
    },
    enabled: canQuery,
  });

  const showSkeleton = useDelayedLoading(query.isPending && canQuery);

  if (canQuery && query.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={5} blocks={[260, 220]} /> : null;
  }

  const data = query.data;
  // `ABC-EMPTY-01` — mensagem real do legado, distinta do guard de filtro ausente.
  const isEmptyResult = !query.isError && canQuery && (!data || data.days_filled === 0);

  return (
    <DashboardGrid>
      <HeaderDashboard filtersApplied={filtersApplied} onOpenFilter={() => setIsFilterOpen(true)} />

      {!canQuery ? (
        <DashboardStateMessage
          icon={FiSliders}
          title={commonText.empty.title}
          description={commonText.empty.description}
        />
      ) : query.isError ? (
        <DashboardStateMessage
          icon={FiAlertTriangle}
          title={commonText.error.title}
          description={commonText.error.description}
          actionLabel={commonText.error.retry}
          onAction={() => query.refetch()}
        />
      ) : isEmptyResult ? (
        <DashboardStateMessage
          icon={FiBarChart2}
          title={commonText.empty.title}
          description={text.emptyMessage}
        />
      ) : (
        data && (
          <>
            <DashboardRow>
              <DashboardKpiCard
                label={text.kpis.productivityArrobaHa}
                value={formatAbcIndicator('productivity_arroba_ha', data.productivity_arroba_ha)}
                sub={units.arrobaHa}
              />
              <DashboardKpiCard
                label={text.kpis.dailyWeightGain}
                value={formatAbcIndicator('daily_weight_gain', data.daily_weight_gain)}
                sub={units.kgCabDia}
              />
              <DashboardKpiCard
                label={text.kpis.capacityRateHa}
                value={formatAbcIndicator('capacity_rate_ha', data.capacity_rate_ha)}
                sub={units.cabHa}
              />
              <DashboardKpiCard
                label={text.kpis.averageWeightOut}
                value={formatAbcIndicator('average_weight_out', data.average_weight_out)}
                sub={units.kg}
              />
              <DashboardKpiCard
                label={text.kpis.daysFilled}
                value={formatAbcIndicator('days_filled', data.days_filled)}
                sub={units.dias}
              />
            </DashboardRow>

            <DashboardRow>
              <ProducaoDoPeriodo data={data} />
              <OcupacaoDoModulo data={data} />
            </DashboardRow>

            <IndicadoresZootecnicos data={data} />
          </>
        )
      )}

      <FilterSideAbcIndicators
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
