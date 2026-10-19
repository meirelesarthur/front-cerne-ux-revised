// src/pages/Dashboards/RainfallDashboard/index.tsx
// Tela "Pluviometria" (execução 048, TASK-01-FE) — fiel a
// `Pluviometria.tsx@8663490` (ver `contrato-rainfall-dashboard-norm.md`).
// Dado real via `GET /dashboards/rainfall`.
//
// **CORREÇÃO PÓS-E2E CRÍTICA (048):** esta tela CRASHAVA — lia
// `data.historical.days_by_month.length`/`volume_by_month.length`, campos
// que NUNCA existiram no payload real (`undefined.length`). Reconciliado
// contra `GB.Cerne.FrontEnd/e2e/_048-dash/pluviometria.json` (capturado do
// ambiente rodando): o backend só publica `historical.accumulated_by_period`/
// `historical.by_area`. Regra de ouro aplicada em TODO array lido aqui:
// `?? []` antes de `.length`/`.map`, nunca acesso direto que possa
// explodir em `undefined`.

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiCloudRain } from 'react-icons/fi';

import {
  DashboardGrid,
  DashboardKpiCard,
  DashboardRow,
  DashboardSkeleton,
  DashboardStateMessage,
  LacunaNote,
} from '@/components/Dashboard';

import { useAuth } from '@/hooks/useAuth';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { getRainfallDashboard } from '@/services/v2/Dashboards/rainfallDashboard-service';

import type { RainfallDashboardFilterForm } from '@/@types/v2/Dashboards/rainfallDashboard';

import { AcumuladoAreaChart } from './blocks/AcumuladoAreaChart';
import { JanelaAplicacao } from './blocks/JanelaAplicacao';
import { PrevisaoSemana } from './blocks/PrevisaoSemana';
import { VolumeChart } from './blocks/VolumeChart';
import { FilterSideRainfallDashboard } from './FilterSideRainfallDashboard';
import { HeaderDashboard } from './HeaderDashboard';

const DEFAULT_FILTER: RainfallDashboardFilterForm = {
  area: null,
  period: { label: '12m', value: '12m' },
};

const FORECAST_LACUNA_BLOCK_ID = 'forecast';

export default function RainfallDashboard() {
  const { languageGB, languageInUse } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.dashboards.rainfallDashboard;
  const commonText = languageGB.dashboards.common;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // CORREÇÃO — decisão do dono (048): dashboard NÃO pagina, o filtro NÃO
  // vai mais para a URL (`usePaginatedQueryUrl` removido). Estado LOCAL
  // por requisição — resolve de uma vez a URL suja
  // (`?page=1&pageSize=10&filter={...}`), o flicker do contador (loop de
  // resync com a URL) e o crash `dateString.match is not a function` no
  // drawer (`reviveFilterData` da URL reidratava datas como `Date`; aqui
  // elas nunca saem de `string yyyy-MM-dd`/`null`).
  const [filter, setFilter] = useState<RainfallDashboardFilterForm>(DEFAULT_FILTER);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(DEFAULT_FILTER);

  const filtersApplied = useMemo(
    () => (filter.area ? 1 : 0) + (filter.period && filter.period.value !== '12m' ? 1 : 0),
    [filter]
  );

  const query = useQuery({
    queryKey: [queryKey.dashboards.rainfallDashboard, languageInUse, activeFarmUuid, filter],
    queryFn: async () => {
      const response = await getRainfallDashboard({
        area_uuid: filter.area?.value,
        period: filter.period?.value ?? '12m',
      });
      return response.data;
    },
  });

  const showSkeleton = useDelayedLoading(query.isPending);

  if (query.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={4} blocks={[220, 220, 220]} /> : null;
  }

  const data = query.data;
  // Regra de ouro: TODO array lido com `?? []` antes de `.length`/`.map` —
  // nunca acesso direto a `data.historical.*` que possa vir ausente.
  const accumulatedByPeriod = data?.historical?.accumulated_by_period ?? [];
  const byArea = data?.historical?.by_area ?? [];
  const forecast = data?.forecast ?? null;
  const weekForecast = forecast?.week_forecast ?? [];
  const alerts = forecast?.alerts ?? [];

  const isEmpty =
    !query.isError &&
    (!data || (accumulatedByPeriod.length === 0 && byArea.length === 0 && !forecast));

  const forecastLacuna = data?.meta?.lacunas?.find(
    (item) => item.block_id === FORECAST_LACUNA_BLOCK_ID
  );

  // `next_rain.label` já vem formatado pelo backend (ex. "Quinta, 3
  // Setembro") — sem `threshold_mm`/`date` (campos que nunca existiram).
  const nextRainValue = forecast?.next_rain
    ? `${forecast.next_rain.label}${
        forecast.next_rain.amount != null ? ` — ${forecast.next_rain.amount}mm` : ''
      }`
    : text.kpis.nextRainNoForecast;
  const firstAlert = alerts.length > 0 ? alerts[0] : null;

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
          icon={FiCloudRain}
          title={commonText.empty.title}
          description={commonText.empty.description}
        />
      ) : (
        data && (
          <>
            <DashboardRow>
              <DashboardKpiCard
                label={text.kpis.accumulated7d}
                value={
                  forecast
                    ? `${forecast.accumulated.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}mm`
                    : '—'
                }
              />
              <DashboardKpiCard
                label={text.kpis.soilMoisture}
                value={forecast ? `${Math.round(forecast.soil_moisture)}%` : '—'}
              />
              <DashboardKpiCard label={text.kpis.nextRain} value={nextRainValue} />
              <DashboardKpiCard
                label={text.kpis.alerts}
                // CORREÇÃO PÓS-E2E (048, 3ª rodada): `firstAlert` é um
                // OBJETO `{type,icon,color}` — passá-lo direto como `value`
                // (children de `<Text>`) crashava com "Objects are not
                // valid as a React child" em toda fazenda com alerta ativo
                // (`alerts` só vinha `[]` nas fazendas testadas antes,
                // mascarando o bug). `value` é sempre `alert.type` (texto).
                value={firstAlert ? firstAlert.type : text.kpis.noAlerts}
                valueColor={firstAlert ? 'feedBack.warnMain' : undefined}
              />
            </DashboardRow>

            {forecastLacuna && <LacunaNote reason={forecastLacuna.reason} />}

            <DashboardRow>
              <JanelaAplicacao data={forecast?.application_window ?? null} />
              <PrevisaoSemana data={weekForecast} />
            </DashboardRow>

            <VolumeChart data={accumulatedByPeriod} />

            <AcumuladoAreaChart data={byArea} />
          </>
        )
      )}

      <FilterSideRainfallDashboard
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
