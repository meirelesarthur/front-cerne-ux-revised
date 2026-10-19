// src/pages/Dashboards/Suprimentos/index.tsx
// -----------------------------------------------------------------------------
// Dashboard de Suprimentos (SupplyDashboard — Dashboards, esteira
// 97-Esteiras/009 Tarefas 38/39/42, reformulação v2 execução 019 Tarefas
// 55-58). Rota `/dashboards/suprimentos`, `supply_dashboard_view`.
//
// TAREFA 55-58 (v2, reformulação COMPLETA do corpo — `useSupplyDashboardQuery`/
// `getSupplyDashboard`/`FilterSideSuprimentos` INTOCADOS, contrato de tela v2
// §1): `SupplyByTypeGrid`/`SupplyTotalsPanel` (payload v1) SAEM por completo
// (D-05 do PRD) — entram as 3 fileiras novas: `SupplyKpiRow` (Tarefa 56),
// `SupplyFunnelCard` (Tarefa 57), `SupplyTopProvidersCard` (Tarefa 58).
// "Gastos por categoria" fica de fora (D-03, fechado pelo dono).
//
// Estados: `isPending` → fileira de `Skeleton` no formato de KPI (INALTERADO
// da Tarefa 42); `isError` → `EmptyState variant="error"` (INALTERADO, com
// retry); sucesso → SEMPRE os 3 blocos, cada um tratando seu próprio "zero"
// internamente (RF-08) — nenhum ramo de `EmptyState` de página para "sem
// dado no período" (contrato de tela v2 §5.5).
//
// Cabeçalho: `subtitle` do `DashboardHeader` exibe o período EFETIVAMENTE
// aplicado, lido de `dashboardQuery.data.period.{start_date,end_date}`
// (contrato v2 §5.1) — nunca recalculado no client (RNF-06). Omitido
// enquanto `isPending`/sem dado.
//
// Filtro: `useState` local (NÃO `paginatedQuery` — fonte agregada não
// paginada, "caso derivado" do Contrato B, FID-G3F §3). A query SÓ refaz no
// "Aplicar filtros" do drawer: `appliedFilter` só muda dentro de
// `handleFilterChange`, nunca a cada keystroke/seleção do formulário interno
// do drawer.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Skeleton, useDisclosure } from '@chakra-ui/react';

import { ButtonFilter } from '@/components/ButtonFilter';
import { EmptyState } from '@/components/EmptyState';
import { DashboardGrid, DashboardHeader, DashboardRow } from '@/components/ui/DashboardGrid';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { SupplyDashboardFilterForm } from '@/@types/v2/SupplyDashboard';

import { FilterSideSuprimentos } from './FilterSideSuprimentos';
import { SupplyFunnelCard } from './SupplyFunnelCard';
import { SupplyKpiRow } from './SupplyKpiRow';
import { SupplyTopProvidersCard } from './SupplyTopProvidersCard';
import { useSupplyDashboardQuery } from './useSupplyDashboard';

export default function SupplyDashboardPage() {
  const { languageGB } = useLanguage();
  const text = languageGB.supplyDashboard;

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const [appliedFilter, setAppliedFilter] = useState<SupplyDashboardFilterForm>({});

  function handleFilterChange(data: SupplyDashboardFilterForm) {
    setAppliedFilter(data);
  }

  function handleResetFilter() {
    setAppliedFilter({});
  }

  const filtersApplied = useMemo(
    () =>
      Object.values(appliedFilter).filter(
        (value) =>
          value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0)
      ).length,
    [appliedFilter]
  );

  const dashboardQuery = useSupplyDashboardQuery(appliedFilter);

  // Período aplicado vem SEMPRE de `data.period` — o client nunca recalcula
  // "primeiro dia do mês" (regra do backend). Omitido enquanto a query ainda
  // não tem dado (pending ou erro sem cache anterior).
  const periodSubtitle = dashboardQuery.data
    ? `${text.period.label}: ${formatDate(dashboardQuery.data.period.start_date)} a ${formatDate(dashboardQuery.data.period.end_date)}`
    : undefined;

  return (
    <>
      <DashboardGrid>
        <DashboardHeader
          title={text.pageTitle}
          subtitle={periodSubtitle}
          actions={<ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />}
        />

        {dashboardQuery.isPending ? (
          <DashboardRow>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={index}
                height="96px"
                borderRadius="2xl"
                flex="1 1 180px"
                minWidth="180px"
              />
            ))}
          </DashboardRow>
        ) : dashboardQuery.isError ? (
          <EmptyState
            variant="error"
            message={text.errors.loadFailed}
            onRetry={() => dashboardQuery.refetch()}
            retryLabel={languageGB.defaltStrings.tryAgain}
          />
        ) : (
          <>
            <SupplyKpiRow kpis={dashboardQuery.data.kpis} />
            <SupplyFunnelCard funnel={dashboardQuery.data.funnel} />
            <SupplyTopProvidersCard providers={dashboardQuery.data.top_providers} />
          </>
        )}
      </DashboardGrid>

      <FilterSideSuprimentos
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleReset={handleResetFilter}
        handleFilterChange={handleFilterChange}
        filter={appliedFilter}
        languageGB={languageGB}
        // SUP-13 (homologação): o cabeçalho mostra o período EFETIVAMENTE
        // aplicado vindo de `dashboardQuery.data.period` (default do backend
        // quando nenhum filtro foi aplicado ainda) — o drawer precisa do
        // mesmo dado para abrir com Dt. Início/Dt. Fim PREENCHIDOS, e não
        // vazios, na primeira vez que o usuário filtra.
        defaultPeriod={dashboardQuery.data?.period ?? null}
      />
    </>
  );
}
