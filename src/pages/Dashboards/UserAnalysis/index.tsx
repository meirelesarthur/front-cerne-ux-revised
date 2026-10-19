// src/pages/Dashboards/UserAnalysis/index.tsx
// Tela "Análise de Usuários" (execução 046, TASK-UA-FE-04; atualizado por
// PLANO-ADMIN-USER-ANALYSIS) — fiel a `DashUsuarios.tsx@8663490` (ver
// `01-CONTRATO-TELA-user-analysis.md`). Consome o kit da fundação
// (`DashboardGrid`/`charts`) — NENHUM componente de casca é recriado aqui.
// Dado real via `GET /dashboards/user-analysis`
// (`CONTRATO-API-046-01-user-analysis.md`); sem mock — bloco sem fonte
// renderiza estado vazio/lacuna declarada.
//
// Admin de plataforma (`Gestor_Plataf`, farm-less): a query SÓ dispara com
// contratante escolhido (`enabled: false` sem `tenant_uuid` — nunca chama a
// API sem escopo, mesmo com 422 de defesa em profundidade na API). Usuário
// comum: comportamento atual, inalterado (farm-scoped).

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiBarChart2, FiUsers } from 'react-icons/fi';

import {
  DashboardGrid,
  DashboardKpiCard,
  DashboardRow,
  DashboardSkeleton,
  DashboardStateMessage,
  ProxyBadge,
} from '@/components/Dashboard';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import formatDurationHms from '@/utils/formatDurationHms';

import { userAnalysisPeriod } from '@/constants/dashboards/userAnalysis/types';
import { queryKey } from '@/constants/query-key';

import { getUserAnalysisDashboard } from '@/services/v2/Dashboards/userAnalysis-service';

import type { UserAnalysisFilterRequest } from '@/@types/v2/Dashboards/userAnalysis';

import { AcessosDiarios } from './blocks/AcessosDiarios';
import { ModulosAcessados } from './blocks/ModulosAcessados';
import { PicosPorHora } from './blocks/PicosPorHora';
import { FilterSideUserAnalysis } from './FilterSideUserAnalysis';
import { HeaderDashboard } from './HeaderDashboard';

const DEFAULT_FILTER: UserAnalysisFilterRequest = { period: userAnalysisPeriod.d30 };
const KPI_UNIQUE_IPS_BLOCK_ID = 'kpi_unique_ips';

export default function UserAnalysis() {
  const { languageGB, languageInUse } = useLanguage();
  const { hasRole } = usePermissions();
  const text = languageGB.dashboards.userAnalysis;
  const commonText = languageGB.dashboards.common;

  // Admin de plataforma farm-less — escolhe contratante em vez de fazenda
  // (PLANO-ADMIN-USER-ANALYSIS). Usuário comum: farm-scoped, sem seletor.
  const isGestorPlataforma = hasRole('Gestor_Plataf');

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // CORREÇÃO (048, mesma classe ABC-1) — a tentativa anterior
  // (ADMIN-UA-STATEFIX) estabilizava só a referência do `defaultQuery` via
  // `useMemo`, mas `usePaginatedQueryUrl` ainda resincronizava com a URL a
  // cada render (`usePaginatedQueryUrl.tsx:129-131`), produzindo o mesmo
  // flicker/loop dos outros dashboards. Estado LOCAL por requisição —
  // `usePaginatedQueryUrl` removido —, espelhando
  // `LivestockDashboard`/`CashbookDashboard`/`FinancialDashboard`.
  const [filter, setFilter] = useState<UserAnalysisFilterRequest>(DEFAULT_FILTER);
  const handleFilterChange = setFilter;
  const handleResetFilter = () => setFilter(DEFAULT_FILTER);

  const filtersApplied = useMemo(
    () => (filter.period && filter.period !== DEFAULT_FILTER.period ? 1 : 0),
    [filter]
  );

  const hasTenantSelected = !!filter.tenant_uuid;
  // Só dispara a chamada quando o admin já escolheu um contratante — NUNCA
  // chama a API sem `tenant_uuid` para `Gestor_Plataf` farm-less (defesa em
  // profundidade: a API responde 422 se alguém chamar direto sem o
  // parâmetro, mas o front nunca deixa a chamada sair assim).
  const isQueryEnabled = !isGestorPlataforma || hasTenantSelected;

  const query = useQuery({
    queryKey: [queryKey.dashboards.userAnalysisSummary, languageInUse, filter],
    queryFn: async () => {
      const response = await getUserAnalysisDashboard(filter);
      return response.data;
    },
    enabled: isQueryEnabled,
  });

  const showSkeleton = useDelayedLoading(isQueryEnabled && query.isPending);

  // Admin sem contratante escolhido — empty-state dedicado, ANTES de
  // qualquer checagem de `isPending` (a query nunca sai do estado `pending`
  // enquanto `enabled: false`, então checar `isPending` primeiro travaria a
  // tela num skeleton eterno).
  if (!isQueryEnabled) {
    return (
      <DashboardGrid>
        <HeaderDashboard
          filtersApplied={filtersApplied}
          onOpenFilter={() => setIsFilterOpen(true)}
        />

        <DashboardStateMessage
          icon={FiUsers}
          title={text.selectTenant.title}
          description={text.selectTenant.description}
        />

        <FilterSideUserAnalysis
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

  if (query.isPending) {
    return showSkeleton ? <DashboardSkeleton kpis={5} blocks={[260, 200]} /> : null;
  }

  const data = query.data;
  const isEmpty =
    !query.isError &&
    (!data ||
      (data.kpis.active_users === 0 && data.kpis.sessions === 0 && data.daily_access.length === 0));

  const uniqueIpsProxy = data?.meta?.proxies?.find(
    (item) => item.block_id === KPI_UNIQUE_IPS_BLOCK_ID
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
              <DashboardKpiCard
                label={text.kpis.activeUsers}
                value={String(data.kpis.active_users)}
              />
              <DashboardKpiCard label={text.kpis.sessions} value={String(data.kpis.sessions)} />
              <DashboardKpiCard
                label={text.kpis.avgSessionDuration}
                value={formatDurationHms(data.kpis.avg_session_seconds)}
              />
              <DashboardKpiCard
                label={text.kpis.uniqueIps}
                value={data.kpis.unique_ips != null ? String(data.kpis.unique_ips) : '—'}
              >
                {uniqueIpsProxy && <ProxyBadge rule={uniqueIpsProxy.rule} />}
              </DashboardKpiCard>
            </DashboardRow>

            <DashboardRow>
              <AcessosDiarios data={data.daily_access} />
              <ModulosAcessados data={data.modules} meta={data.meta} />
            </DashboardRow>

            <PicosPorHora data={data.hourly_peaks} />
          </>
        )
      )}

      <FilterSideUserAnalysis
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
