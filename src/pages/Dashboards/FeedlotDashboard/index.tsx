// src/pages/Dashboards/FeedlotDashboard/index.tsx
// Tela "Lotação de Currais" (execução 046, TASK-LC-FE-05) — fiel a
// `DashLotacaoCurrais.tsx@8663490` (ver `02-CONTRATO-TELA-feedlot-dashboard.md`).
// Consome o kit da fundação — nenhuma casca recriada. Dado real via
// `GET /dashboards/feedlot` (`CONTRATO-API-046-02-feedlot-dashboard.md`);
// sem mock — sparklines (`kpis.history`) só renderizam quando a API os serve.

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

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { getFeedlotDashboard } from '@/services/v2/Dashboards/feedlotDashboard-service';

import type { FeedlotDashboardFilterForm } from '@/@types/v2/Dashboards/feedlotDashboard';

import { DistribuicaoPorStatus } from './blocks/DistribuicaoPorStatus';
import { HistoricoStatus } from './blocks/HistoricoStatus';
import { OcupacaoPorSetor } from './blocks/OcupacaoPorSetor';
import { FilterSideFeedlotDashboard } from './FilterSideFeedlotDashboard';
import { HeaderDashboard } from './HeaderDashboard';

const DEFAULT_FILTER: FeedlotDashboardFilterForm = { yard: null, sectors: [] };

function formatOccupancyRate(rate: number): string {
  return `${rate.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export default function FeedlotDashboard() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.dashboards.feedlotDashboard;
  const commonText = languageGB.dashboards.common;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // CORREÇÃO — mesma classe de flicker do 048 (ABC-1): `usePaginatedQueryUrl`
  // com `defaultQuery` literal novo a cada render disparava o efeito de
  // resync com a URL em loop. Estado LOCAL por requisição, espelhando
  // `LivestockDashboard`/`CashbookDashboard`/`FinancialDashboard`.
  const [filter, setFilter] = useState<FeedlotDashboardFilterForm>(DEFAULT_FILTER);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(DEFAULT_FILTER);

  const filtersApplied = useMemo(
    () => (filter.yard ? 1 : 0) + (filter.sectors.length > 0 ? 1 : 0),
    [filter]
  );

  const query = useQuery({
    queryKey: [queryKey.dashboards.feedlotDashboard, languageInUse, filter],
    queryFn: async () => {
      const response = await getFeedlotDashboard({
        yard_uuid: filter.yard?.value,
        sector_uuids: filter.sectors.map((sector) => sector.value),
      });
      return response.data;
    },
  });

  const showSkeleton = useDelayedLoading(query.isPending);

  if (query.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={4} blocks={[260]} /> : null;
  }

  const data = query.data;
  const isEmpty =
    !query.isError && (!data || (data.kpis.total_animals === 0 && data.kpis.total_capacity === 0));

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
                label={text.kpis.occupancyRate}
                value={formatOccupancyRate(data.kpis.occupancy_rate)}
              />
              <DashboardKpiCard
                label={text.kpis.totalAnimals}
                value={String(data.kpis.total_animals)}
              />
              <DashboardKpiCard
                label={text.kpis.availableCorrals}
                value={String(data.kpis.available_corrals)}
                valueColor={
                  data.kpis.available_corrals > 0 ? 'feedBack.successMain' : 'feedBack.errorMain'
                }
              />
              <DashboardKpiCard
                label={text.kpis.totalCapacity}
                value={String(data.kpis.total_capacity)}
              />
            </DashboardRow>

            <DashboardRow>
              <DistribuicaoPorStatus data={data.status_distribution} />
              <OcupacaoPorSetor data={data.sector_occupancy} />
            </DashboardRow>

            {data.recent_status_history && data.recent_status_history.length > 0 && (
              <HistoricoStatus data={data.recent_status_history} />
            )}
          </>
        )
      )}

      <FilterSideFeedlotDashboard
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
