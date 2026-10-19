// src/pages/Dashboards/AssetsDashboard/index.tsx
// Tela "Ativos" (execução 046, TASK-AT-FE-05) — fiel a `DashAtivos.tsx@8663490`
// (ver `03-CONTRATO-TELA-assets-dashboard.md`). Consome o kit da fundação —
// nenhuma casca recriada. Dado real via `GET /dashboards/assets`
// (`CONTRATO-API-046-03-assets-dashboard.md`); sem mock — `by_status` em
// forma reduzida (`MUD-046-02`) publica a lacuna via `meta.lacunas[]`.
// ATV-11-front (048-dashboards): `maintenance_by_month` passou a publicar a
// quebra Corretiva×Preventiva por mês — a lacuna `manutencoes_por_mes` foi
// removida no back, sem contrapartida no front.
// 048-dashboards (decisão do dono, homologação): removidos os KPIs "Em
// manutenção" e "OS em aberto" da fileira de topo — sem conceito limpo de
// "em manutenção agora" (a manutenção real está no gráfico Corretiva×
// Preventiva) e OS é ordem de serviço agrícola, sem relação com ativos/
// frota. O back pode continuar emitindo `kpis.in_maintenance`/
// `kpis.open_service_orders`; o front apenas deixou de exibi-los.

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiBarChart2 } from 'react-icons/fi';

import {
  DashboardGrid,
  DashboardKpiCard,
  DashboardRow,
  DashboardSkeleton,
  DashboardStateMessage,
  LacunaNote,
} from '@/components/Dashboard';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import { assetsPeriodMonths } from '@/constants/dashboards/assetsDashboard/types';
import { queryKey } from '@/constants/query-key';

import { getAssetsDashboard } from '@/services/v2/Dashboards/assetsDashboard-service';

import type { AssetsDashboardFilterForm } from '@/@types/v2/Dashboards/assetsDashboard';

import { AtivosPorCategoria } from './blocks/AtivosPorCategoria';
import { ManutencoesPorMes } from './blocks/ManutencoesPorMes';
import { StatusDosAtivos } from './blocks/StatusDosAtivos';
import { FilterSideAssetsDashboard } from './FilterSideAssetsDashboard';
import { HeaderDashboard } from './HeaderDashboard';

const DEFAULT_FILTER: AssetsDashboardFilterForm = {
  months: { label: '12', value: assetsPeriodMonths.m12 },
  families: [],
  status: null,
  proprietary: null,
};

const STATUS_LACUNA_BLOCK_ID = 'status_dos_ativos';

export default function AssetsDashboard() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.dashboards.assetsDashboard;
  const commonText = languageGB.dashboards.common;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // CORREÇÃO — mesma classe de flicker do 048 (ABC-1): `usePaginatedQueryUrl`
  // com `defaultQuery` literal novo a cada render disparava o efeito de
  // resync com a URL em loop. Estado LOCAL por requisição, espelhando
  // `LivestockDashboard`/`CashbookDashboard`/`FinancialDashboard`.
  const [filter, setFilter] = useState<AssetsDashboardFilterForm>(DEFAULT_FILTER);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(DEFAULT_FILTER);

  const filtersApplied = useMemo(
    () =>
      (filter.months && filter.months.value !== DEFAULT_FILTER.months?.value ? 1 : 0) +
      (filter.families.length > 0 ? 1 : 0) +
      (filter.status ? 1 : 0) +
      (filter.proprietary ? 1 : 0),
    [filter]
  );

  const query = useQuery({
    queryKey: [queryKey.dashboards.assetsDashboard, languageInUse, filter],
    queryFn: async () => {
      const response = await getAssetsDashboard({
        months: filter.months?.value,
        family_uuids: filter.families.map((family) => family.value),
        status: filter.status?.value,
        proprietary_uuid: filter.proprietary?.value,
      });
      return response.data;
    },
  });

  const showSkeleton = useDelayedLoading(query.isPending);

  if (query.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={3} blocks={[260, 220]} /> : null;
  }

  const data = query.data;
  const isEmpty = !query.isError && (!data || data.kpis.total === 0);

  const statusLacuna = data?.meta?.lacunas?.find(
    (item) => item.block_id === STATUS_LACUNA_BLOCK_ID
  );

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
              <DashboardKpiCard label={text.kpis.total} value={String(data.kpis.total)} />
              <DashboardKpiCard
                label={text.kpis.inOperation}
                value={data.kpis.in_operation != null ? String(data.kpis.in_operation) : '—'}
              />
              <DashboardKpiCard
                label={text.kpis.currentValue}
                value={formatCurrencyBRL(data.kpis.current_value)}
              />
            </DashboardRow>

            <DashboardRow>
              <AtivosPorCategoria data={data.by_category} />
              <StatusDosAtivos data={data.by_status} />
            </DashboardRow>
            {statusLacuna && <LacunaNote reason={statusLacuna.reason} />}

            <ManutencoesPorMes data={data.maintenance_by_month} />
          </>
        )
      )}

      <FilterSideAssetsDashboard
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
