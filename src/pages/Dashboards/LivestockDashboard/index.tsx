// src/pages/Dashboards/LivestockDashboard/index.tsx
// Tela "Pecuária de Corte" (execução 048, TASK-05-FE) — fiel a
// `DashPecuaria.tsx@8663490`: filtros (safra + período + raça/categoria),
// KPIs de rebanho (cabeças/GMD/arrobas/nascimentos-mortes), composição por
// raça/categoria (dado REAL, DEC-101), evolução do rebanho, manejos por mês
// e os 32 indicadores financeiros ativos. Dado real via
// `GET /dashboards/livestock` (`CONTRATO-API-048-05`, endpoint ainda
// PLANEJADO pela Onda 1 API-arch — service já aponta o path acordado, sem
// mock). **Sem abas Produtivo/Reprodutivo** (código morto do legado,
// `CV-025/026` — ver nota de escopo em
// `@/@types/v2/Dashboards/livestockDashboard`).

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

import { dateOnlyToYmd } from '@/utils/dateOnlyToYmd';

import { formatLivestockKpi } from '@/constants/dashboards/livestockDashboard/livestock-kpi-format';
import { queryKey } from '@/constants/query-key';

import { getLivestockDashboard } from '@/services/v2/Dashboards/livestockDashboard-service';

import type { LivestockDashboardFilterForm } from '@/@types/v2/Dashboards/livestockDashboard';

import { ComposicaoPorRaca } from './blocks/ComposicaoPorRaca';
import { ComposicaoRebanho } from './blocks/ComposicaoRebanho';
import { EvolucaoRebanho } from './blocks/EvolucaoRebanho';
import { IndicadoresFinanceiros } from './blocks/IndicadoresFinanceiros';
import { ManejosPorMes } from './blocks/ManejosPorMes';
import { NascimentosMortes } from './blocks/NascimentosMortes';
import { FilterSideLivestockDashboard } from './FilterSideLivestockDashboard';
import { HeaderDashboard } from './HeaderDashboard';

const DEFAULT_FILTER: LivestockDashboardFilterForm = {
  harvest: null,
  breed: null,
  category: null,
  startDate: null,
  endDate: null,
};

export default function LivestockDashboard() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.dashboards.livestockDashboard;
  const commonText = languageGB.dashboards.common;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // CORREÇÃO — decisão do dono (048): dashboard NÃO pagina, o filtro NÃO
  // vai mais para a URL (`usePaginatedQueryUrl` removido). Estado LOCAL
  // por requisição — resolve URL suja, flicker do contador (loop de
  // resync com a URL) e o CRASH `dateString.match is not a function` ao
  // abrir o drawer: `usePaginatedQueryUrl.reviveFilterData` reidratava
  // `startDate`/`endDate` como `Date` ao ler da URL, e o `DateInput`
  // (`FilterSideLivestockDashboard`) só aceita `string yyyy-MM-dd`/`null`.
  // Com estado local as datas nunca saem da forma que a cascata
  // Safra→datas grava (`dateOnlyToYmd`, sempre string) ou `null`.
  const [filter, setFilter] = useState<LivestockDashboardFilterForm>(DEFAULT_FILTER);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(DEFAULT_FILTER);

  const filtersApplied = useMemo(
    () =>
      (filter.harvest ? 1 : 0) +
      (filter.breed ? 1 : 0) +
      (filter.category ? 1 : 0) +
      (filter.startDate ? 1 : 0) +
      (filter.endDate ? 1 : 0),
    [filter]
  );

  const query = useQuery({
    queryKey: [queryKey.dashboards.livestockDashboard, languageInUse, filter],
    queryFn: async () => {
      const response = await getLivestockDashboard({
        harvest_uuid: filter.harvest?.value,
        start_date: dateOnlyToYmd(filter.startDate),
        end_date: dateOnlyToYmd(filter.endDate),
        breed_uuid: filter.breed?.value,
        category_uuid: filter.category?.value,
      });
      return response.data;
    },
  });

  const showSkeleton = useDelayedLoading(query.isPending);

  if (query.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={6} blocks={[220, 220, 240]} /> : null;
  }

  const data = query.data;

  // Regra de ouro: TODO array/objeto lido com `?? []`/fallback — nunca
  // acesso direto a `data.general.*`/`data.productive.*`/`data.reproductive.*`
  // que possa explodir em `undefined` (ex.: `data.productive` ausente
  // quebrava `data?.productive.gmd_by_batch` — o `?.` só protegia `data`,
  // não os níveis seguintes).
  const kpis = data?.general?.kpis ?? [];
  const byBreed = data?.general?.composition?.by_breed ?? [];
  const byCategory = data?.general?.composition?.by_category ?? [];
  const herdEvolution = data?.herd_evolution ?? [];
  const gmdByBatch = data?.productive?.gmd_by_batch ?? [];
  const arrobaPerMonth = data?.productive?.arroba_per_month ?? [];
  const weighingsByMonth = data?.productive?.weighings_count_by_month ?? [];
  const sanitaryByMonth = data?.productive?.sanitary_management_by_month ?? [];
  const nutritionByMonth = data?.productive?.nutrition_management_by_month ?? [];
  const births = data?.reproductive?.births ?? { total: 0, period: '' };
  const deaths = data?.reproductive?.deaths ?? { total: 0, period: '' };

  const isEmpty =
    !query.isError &&
    (!data || (herdEvolution.length === 0 && byBreed.length === 0 && kpis.length === 0));

  // CORREÇÃO PÓS-E2E (048): "Total de cabeças" usa o campo CANÔNICO já
  // reconciliado que a API publica (`general.kpis[key='total_animais']`,
  // `LST-012`) — NUNCA recalculado no front a partir de `herd_evolution`
  // (série derivada de entradas−saídas mensais, sujeita a drift em relação
  // à contagem oficial que o backend está corrigindo em paralelo).
  const totalAnimaisKpi = kpis.find((kpi) => kpi.key === 'total_animais') ?? null;
  const avgGmd =
    gmdByBatch.length > 0
      ? gmdByBatch.reduce((sum, row) => sum + row.gmd_kg_day, 0) / gmdByBatch.length
      : null;
  const latestArroba =
    arrobaPerMonth.length > 0 ? arrobaPerMonth[arrobaPerMonth.length - 1].arrobas : null;

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
          description={text.emptyMessage}
        />
      ) : (
        data && (
          <>
            <DashboardRow>
              <DashboardKpiCard
                label={text.kpis.headcount}
                value={
                  totalAnimaisKpi
                    ? formatLivestockKpi(totalAnimaisKpi.value, totalAnimaisKpi.key, languageGB)
                    : '—'
                }
              />
              <DashboardKpiCard
                label={text.kpis.gmd}
                value={
                  avgGmd != null
                    ? `${avgGmd.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg/dia`
                    : '—'
                }
              />
              <DashboardKpiCard
                label={text.kpis.arrobaMonth}
                value={
                  latestArroba != null
                    ? latestArroba.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
                    : '—'
                }
              />
            </DashboardRow>

            <NascimentosMortes births={births} deaths={deaths} />

            <DashboardRow>
              <ComposicaoPorRaca data={byBreed} />
              <ComposicaoRebanho data={byCategory} />
            </DashboardRow>

            <DashboardRow>
              {/* CORREÇÃO PÓS-HOMOLOGAÇÃO (048, 3ª rodada) — dono pediu de volta a
                  LINHA ÚNICA DE TOTAL (comportamento anterior): `dataByCategory`
                  deixa de ser alimentado (o multi-série por categoria real da
                  tabela `evolutions`, esparsa, produzia linhas chapadas/com
                  saltos). `EvolucaoRebanho` cai no próprio fallback já existente
                  quando `dataByCategory` vem vazio/ausente — código do fallback
                  preservado, só paramos de acionar o caminho preferencial aqui. */}
              <EvolucaoRebanho data={herdEvolution} />
              <ManejosPorMes
                weighings={weighingsByMonth}
                sanitary={sanitaryByMonth}
                nutrition={nutritionByMonth}
              />
            </DashboardRow>

            <IndicadoresFinanceiros data={kpis} />
          </>
        )
      )}

      <FilterSideLivestockDashboard
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
