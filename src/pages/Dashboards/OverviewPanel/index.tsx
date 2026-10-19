// src/pages/Dashboards/OverviewPanel/index.tsx
// Painel de Controle / Visão Geral (F-211, execução 062 — Fase B, wiring
// real). Substitui `src/pages/Home/index.tsx` na rota `/home` (Opção A,
// `PainelControle-Frontend-Contrato.md §3`). Mirror de forma
// `CashbookDashboard`/`FinancialDashboard` — múltiplos `useQuery`
// compostos manualmente na tela (`checkLoadingStatus`/`useDelayedLoading`,
// `DashboardSkeleton`/`DashboardStateMessage`), RBAC por bloco via
// `usePermissions().can(...)` (nunca gate na ROTA — ver nota em
// `src/router/index.tsx:3599`).
//
// Blocos wireados nesta Fase B (11 de 13):
//   #1/#2/#3/#12  → `GET /api/v1/dashboards/home/overview` (home_dashboard_view)
//   #4/#5/#6/#9/#11 → `GET /api/v1/dashboards/home/financial-summary` (home_financial_dashboard_view)
//   #7/#8         → REUSO `GET /api/v1/income-statement` (incomestatement_view, F-272)
//
// Blocos wireados no fix-up de `GAP-FE-251` (ver
// `04-Gaps_Frontend_UI/GAP-FE-251-*.md` — RESOLVIDO, backend materializado no
// fork `GB.Cerne.Api`, branch `feature/062-painel-controle`):
//   #10 Cobertura de estoque  → `dashboards/home/stock-coverage` (home_stock_dashboard_view)
//   #13 Resultado por produto → `dashboards/home/product-result` (home_product_result_view)
// Estes 2 blocos são OPCIONAIS/independentes (mirror `coeCotQuery` #7/#8):
// não entram nas `gatingQueries` da página (não têm relação com
// overview/financial-summary) — cada bloco resolve seu próprio
// loading/empty/error internamente (ver `CoberturaEstoque`/
// `ResultadoPorProduto`), e some da tela se a permissão faltar (nunca
// derruba a página inteira).
//
// Ajustes pós-entrega (exec. 062, mesma branch): Ajuste 1 — `kpis.gross_margin`
// deixa de sempre cair no "Sem dado" e passa a formatar o valor real quando
// não há lacuna (backend agora calcula a margem). Ajuste 2 — filtro
// "Período" trocado de 3/6/10 para 1/2/3/6/12 meses, default `'6'`. Ajuste 3
// — TODAS as queries de bloco levam `hasFarm` no `enabled` (decisão do
// dono): sem fazenda ativa no contexto, nenhuma API é chamada e a tela
// mostra o estado "Selecione uma fazenda".
//
// GAP-FE-255 nível B (contrato `GAP-FE-255-periodo-global-contrato.md`,
// rewire pós-entrega, mesma branch): o filtro "Período" do topo deixa de
// alcançar só 2 cards via slice client-side e passa a enviar `period_months`
// como parâmetro real de `overview`/`financial-summary`/`product-result`
// (na queryKey também, para refetch ao trocar o período). O backend agora
// trunca `monthly_revenue`/`cashflow_projection` — o slice client-side foi
// removido (dupla truncagem eliminada). `stock-coverage` continua sem
// receber o parâmetro (card snapshot, decisão explícita do contrato §6.3).
//
// Correção pós-entrega (exec. 062, mesma branch, decisão do dono): o KPI que
// era exibido como "Margem bruta" na verdade é margem OPERACIONAL — o
// backend renomeou `kpis.gross_margin`/`kpis.gross_margin_pct` para
// `kpis.operational_margin_pct` (substituição do campo, não adição). O
// card foi renomeado para "Margem operacional" e o bloco #11
// (`ConcentracaoReceita`) passou a tolerar a fatia "Sem cliente"
// (`client_uuid: null`) que o backend agora pode devolver.

import { useState } from 'react';

import { Flex, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiBarChart2, FiMapPin } from 'react-icons/fi';
import { useContextSelector } from 'use-context-selector';

import {
  CardInfoTooltip,
  DashboardCard,
  DashboardGrid,
  DashboardKpiCard,
  DashboardRow,
  DashboardSkeleton,
  DashboardStateMessage,
  LacunaNote,
} from '@/components/Dashboard';

import { AuthContext } from '@/contexts/AuthContext';

import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useLanguage } from '@/hooks/useLanguage';
import { useMyFarms } from '@/hooks/useMyFarms';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import { todayLocalIso } from '@/utils/localDate';

import { queryKey } from '@/constants/query-key';

import {
  getOverviewPanelFinancialSummary,
  getOverviewPanelOverview,
  getOverviewPanelProductResult,
  getOverviewPanelStockCoverage,
} from '@/services/v2/Dashboards/overviewPanel-service';
import { listActiveHarvests } from '@/services/v2/Harvests/harvest-service';
import { getIncomeStatementPreview } from '@/services/v2/Relatorios/income-statement-report-service';

import type { OverviewPanelPeriod } from '@/@types/v2/Dashboards/overviewPanel';
import type { Harvest } from '@/@types/v2/Harvests';

import { AgingTitulos } from './blocks/AgingTitulos';
import { CoberturaEstoque } from './blocks/CoberturaEstoque';
import { ConcentracaoReceita } from './blocks/ConcentracaoReceita';
import { CustoProducaoCoeCot } from './blocks/CustoProducaoCoeCot';
import { ExcecoesSemana } from './blocks/ExcecoesSemana';
import { FluxoCaixaProjetado } from './blocks/FluxoCaixaProjetado';
import { MapaTalhoes } from './blocks/MapaTalhoes';
import { PrevisaoReceberPagar } from './blocks/PrevisaoReceberPagar';
import { ReceitasMensais } from './blocks/ReceitasMensais';
import { ResultadoOperacional } from './blocks/ResultadoOperacional';
import { ResultadoPorProduto } from './blocks/ResultadoPorProduto';
import { HeaderDashboard } from './HeaderDashboard';

/**
 * Resolve a "safra corrente" (harvest cujo intervalo cobre a data de hoje)
 * a partir da lista de safras ativas — GAP-08 do contrato de API (§5):
 * default = harvest corrente, não ano civil corrente. Nenhum endpoint de
 * "safra atual" existe no backend (achado do Executor) — resolvido
 * client-side sobre `GET /harvests/active`, já consumido por outras telas.
 * @param {Harvest[]} harvests - Safras ativas (`is_enabled=true`, com semana).
 * @return {Harvest | null} A safra cujo `[start_date, end_date]` cobre hoje, ou `null` se nenhuma cobrir.
 */
function resolveCurrentHarvest(harvests: Harvest[]): Harvest | null {
  const todayIso = todayLocalIso();
  return (
    harvests.find((harvest) => harvest.start_date <= todayIso && harvest.end_date >= todayIso) ??
    null
  );
}

export default function OverviewPanel() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.dashboards.overviewPanel;
  const commonText = languageGB.dashboards.common;
  const { can } = usePermissions();

  // Ajuste 2 (exec. 062, ajustes pós-entrega F-211): default trocado de
  // '10' para '6' (densidade boa) — opções agora são 1/2/3/6/12 meses (ver
  // `HeaderDashboard.tsx`).
  const [period, setPeriod] = useState<OverviewPanelPeriod>('6');

  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);
  const myFarmsQuery = useMyFarms();
  const activeFarmName = myFarmsQuery.data?.find(
    (farm) => farm.uuid === activeFarmUuid
  )?.description;

  // Ajuste 3 (exec. 062, ajustes pós-entrega F-211 — decisão do dono): sem
  // fazenda ativa no contexto (`X-Farm-Id`), NENHUM bloco chama a API — evita
  // 4xx do middleware `farm.context`. Todas as queries da tela abaixo levam
  // `hasFarm` no `enabled`.
  const hasFarm = !!activeFarmUuid;

  const canOverview = can('home_dashboard_view');
  const canFinancial = can('home_financial_dashboard_view');
  const canIncomeStatement = can('incomestatement_view');
  const canStockCoverage = can('home_stock_dashboard_view');
  const canProductResult = can('home_product_result_view');

  // Blocos #1 (casca)/#2 (mapa)/#3 (KPIs)/#12 (exceções) — GAP-FE-255 nível
  // B: `period_months` enviado (honra só `kpis.*`; `map`/`exceptions`
  // ignoram o parâmetro no backend). `period` entra na queryKey para
  // refetch ao trocar o filtro global.
  const overviewQuery = useQuery({
    queryKey: [queryKey.dashboards.overviewPanelOverview, languageInUse, period],
    queryFn: async () => (await getOverviewPanelOverview({ period_months: Number(period) })).data,
    enabled: canOverview && hasFarm,
  });

  // Blocos #4/#5/#6/#9/#11 — `month`/`year` omitidos (default: mês corrente
  // resolvido pelo próprio backend). GAP-FE-255 nível B: `period_months`
  // enviado — o backend agora trunca `monthly_revenue`/`cashflow_projection`
  // no servidor (ver JSX abaixo — slice client-side removido).
  const financialSummaryQuery = useQuery({
    queryKey: [queryKey.dashboards.overviewPanelFinancialSummary, languageInUse, period],
    queryFn: async () =>
      (await getOverviewPanelFinancialSummary({ period_months: Number(period) })).data,
    enabled: canFinancial && hasFarm,
  });

  // Blocos #7/#8 — REUSO `income-statement` (F-272). Query encadeada: 1)
  // resolve a safra corrente sobre `harvests/active` (já consumido por
  // outras telas do fork); 2) só então busca o preview do relatório com o
  // período da safra resolvida (GAP-08, contrato de API §2.5).
  const harvestsQuery = useQuery({
    queryKey: [queryKey.harvests.active],
    queryFn: async () => (await listActiveHarvests()).data,
    enabled: canIncomeStatement && hasFarm,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const currentHarvest = resolveCurrentHarvest(harvestsQuery.data ?? []);

  const coeCotQuery = useQuery({
    queryKey: [
      queryKey.relatorios.incomeStatementPreview,
      'overview-panel-coe-cot',
      currentHarvest,
    ],
    queryFn: () =>
      getIncomeStatementPreview({
        group: 'C',
        type: 1,
        calculation_module: 'F',
        start_date: currentHarvest!.start_date,
        end_date: currentHarvest!.end_date,
        harvest_id: currentHarvest!.uuid,
      }),
    enabled: canIncomeStatement && hasFarm && !!currentHarvest,
  });

  // Bloco #10 — sem filtro (fazenda ativa). Fix-up GAP-FE-251 (backend
  // materializado em `feature/062-painel-controle`, ver comentário do
  // arquivo). Independente da gatingQueries da página — mirror `coeCotQuery`.
  const stockCoverageQuery = useQuery({
    queryKey: [queryKey.dashboards.overviewPanelStockCoverage, languageInUse],
    queryFn: async () => (await getOverviewPanelStockCoverage()).data,
    enabled: canStockCoverage && hasFarm,
  });

  // Bloco #13 — `area_id` omitido (default: todas as áreas da fazenda ativa,
  // resolvido pelo backend). Fix-up GAP-FE-251, mesma nota acima. GAP-FE-255
  // nível B: `period_months` enviado — filtra `revenue`/`quantity_sold`/
  // `average_price`; `quantity_harvested`/`productivity` continuam all-time
  // (GAP-FE255-01, sem data de colheita confiável no backend).
  const productResultQuery = useQuery({
    queryKey: [queryKey.dashboards.overviewPanelProductResult, languageInUse, period],
    queryFn: async () =>
      (await getOverviewPanelProductResult({ period_months: Number(period) })).data,
    enabled: canProductResult && hasFarm,
  });

  // Skeleton de página só considera as queries de bloco cujo usuário TEM
  // permissão — uma query `enabled:false` nunca resolve `isPending`, então
  // incluí-la travaria o skeleton para sempre quando falta só 1 permissão.
  const gatingQueries = [
    ...(canOverview ? [overviewQuery] : []),
    ...(canFinancial ? [financialSummaryQuery] : []),
  ];
  const showSkeleton = useDelayedLoading(checkLoadingStatus(gatingQueries));
  const isPageLoading = gatingQueries.some((query) => query.isPending);

  // GAP-FE-252: o estado vazio GLOBAL só se aplica quando o usuário não tem
  // NENHUMA das 5 permissões de bloco (RBAC por bloco, não por página —
  // `PainelControle-Frontend-Contrato.md §5`). `gatingQueries` continua
  // restrita a overview/financial (só elas alimentam o skeleton acima) —
  // mas o gate de "página vazia" não pode se basear só nelas, senão um
  // usuário só com `incomestatement_view`/`home_stock_dashboard_view`/
  // `home_product_result_view` nunca alcança os blocos #7/#8/#10/#13, que
  // ele tem permissão de ver.
  const hasAnyBlockPermission =
    canOverview || canFinancial || canIncomeStatement || canStockCoverage || canProductResult;

  // Ajuste 3 (exec. 062, ajustes pós-entrega F-211 — decisão do dono): sem
  // fazenda ativa, NENHUMA query de bloco está habilitada (todas levam
  // `hasFarm` no `enabled`, acima) — elas ficam para sempre em `isPending`.
  // Este gate PRECISA vir antes de `isPageLoading` (senão a tela trava num
  // skeleton infinito) e antes do vazio de permissão (a ausência de fazenda
  // é o motivo mais fundamental de não haver nada para mostrar).
  if (!hasFarm) {
    return (
      <DashboardGrid>
        <HeaderDashboard farmName={activeFarmName} period={period} onPeriodChange={setPeriod} />
        <DashboardStateMessage
          icon={FiMapPin}
          title={commonText.noFarm.title}
          description={commonText.noFarm.description}
        />
      </DashboardGrid>
    );
  }

  if (!hasAnyBlockPermission) {
    return (
      <DashboardGrid>
        <HeaderDashboard farmName={activeFarmName} period={period} onPeriodChange={setPeriod} />
        <DashboardStateMessage
          icon={FiBarChart2}
          title={commonText.empty.title}
          description={commonText.empty.description}
        />
      </DashboardGrid>
    );
  }

  if (isPageLoading) {
    return showSkeleton ? <DashboardSkeleton kpis={3} blocks={[280, 260, 220]} /> : null;
  }

  const hasQueryError = gatingQueries.some((query) => query.isError);

  const overviewData = canOverview ? overviewQuery.data : undefined;
  const financialData = canFinancial ? financialSummaryQuery.data : undefined;

  const areas = overviewData?.map.areas ?? [];
  const kpis = overviewData?.kpis;
  // Correção Execução 062 (front F-211, decisão do dono): o KPI que era
  // exposto como "Margem Bruta" (`gross_margin`/`gross_margin_pct`) na
  // verdade é a Margem OPERACIONAL — o backend renomeou o campo para
  // `operational_margin_pct` e só publica esta lacuna quando NÃO há receita
  // realizada no período (divisor da margem é zero); nos demais casos o
  // card abaixo formata o percentual real.
  const operationalMarginLacuna = overviewData?.meta?.lacunas?.find(
    (lacuna) => lacuna.block_id === 'kpis.operational_margin_pct'
  );

  // GAP-FE-252: isEmpty também considerava só overview/financial — mesmo
  // bug do gate acima, só que dentro do corpo principal (derrubava #7/#8/
  // #10/#13 para o estado vazio mesmo quando o usuário tinha a permissão
  // correspondente). #7/#8/#10/#13 já resolvem seu próprio conteúdo/estado
  // vazio internamente (CustoProducaoCoeCot/CoberturaEstoque/
  // ResultadoPorProduto) — ter a permissão já é "ter algo para mostrar" no
  // nível da página; a ausência de dado dentro do bloco é tratada por ele.
  const isEmpty =
    !hasQueryError &&
    !overviewData &&
    !financialData &&
    !canIncomeStatement &&
    !canStockCoverage &&
    !canProductResult; // nenhum bloco (nem os independentes) tem permissão/dado para mostrar

  return (
    <DashboardGrid>
      <HeaderDashboard farmName={activeFarmName} period={period} onPeriodChange={setPeriod} />

      {hasQueryError ? (
        <DashboardStateMessage
          icon={FiAlertTriangle}
          title={commonText.error.title}
          description={commonText.error.description}
          actionLabel={commonText.error.retry}
          onAction={() => {
            if (canOverview) overviewQuery.refetch();
            if (canFinancial) financialSummaryQuery.refetch();
          }}
        />
      ) : isEmpty ? (
        <DashboardStateMessage
          icon={FiBarChart2}
          title={commonText.empty.title}
          description={commonText.empty.description}
        />
      ) : (
        <>
          {canOverview && overviewData && (
            <>
              <MapaTalhoes
                areas={areas}
                farmCoordinates={overviewData?.map.farm_coordinates ?? null}
              />

              <DashboardRow>
                {/* Correção Execução 062 (front F-211, decisão do dono): o
                    KPI que era "Margem bruta" na verdade é margem
                    OPERACIONAL — backend renomeou `gross_margin`/
                    `gross_margin_pct` para `operational_margin_pct`
                    (substituição, não campo adicional). `null` (sem receita
                    realizada no período) → "Sem dado", nunca um valor
                    recalculado no front. */}
                <DashboardCard flex={1} minWidth={180}>
                  <Flex align="center" gap="1" marginBottom="1">
                    <Text fontSize="xs" color="cardTextSecondary">
                      {text.kpis.operationalMarginPct}
                    </Text>
                    <CardInfoTooltip content={text.kpis.operationalMarginPctTooltip} />
                  </Flex>
                  {operationalMarginLacuna ? (
                    <LacunaNote reason={operationalMarginLacuna.reason} />
                  ) : kpis?.operational_margin_pct == null ? (
                    <Text fontSize="2xl" fontWeight="bold" color="cardTextPrimary">
                      {commonText.lacunaNote.label}
                    </Text>
                  ) : (
                    <Text fontSize="2xl" fontWeight="bold" color="cardTextPrimary">
                      {(kpis.operational_margin_pct * 100).toLocaleString('pt-BR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                      %
                    </Text>
                  )}
                </DashboardCard>
                <DashboardKpiCard
                  label={text.kpis.realizedRevenue}
                  value={formatCurrencyBRL(kpis?.realized_income ?? 0)}
                  infoTooltip={text.kpis.realizedRevenueTooltip}
                />
                <DashboardKpiCard
                  label={text.kpis.operationalBalance}
                  value={formatCurrencyBRL(kpis?.operational_balance ?? 0)}
                  valueColor={
                    (kpis?.operational_balance ?? 0) < 0 ? 'feedBack.errorMain' : undefined
                  }
                  infoTooltip={text.kpis.operationalBalanceTooltip}
                />
              </DashboardRow>
            </>
          )}

          {canFinancial && financialData && (
            <>
              {/* GAP-FE-255 nível B: slice client-side removido — o backend
                  já trunca `monthly_revenue`/`cashflow_projection` para
                  `period_months` enviado na query (`year_over_year`
                  calculado sobre a série completa ANTES do truncamento,
                  no servidor — não recalcular aqui). */}
              <DashboardRow>
                <ReceitasMensais
                  data={financialData.monthly_revenue}
                  yearOverYear={financialData.year_over_year}
                  isLoading={financialSummaryQuery.isFetching}
                />
                <ResultadoOperacional
                  data={financialData.operational_result}
                  isLoading={financialSummaryQuery.isFetching}
                />
              </DashboardRow>

              <DashboardRow>
                <FluxoCaixaProjetado
                  data={financialData.cashflow_projection.months}
                  isLoading={financialSummaryQuery.isFetching}
                />
              </DashboardRow>
            </>
          )}

          {canIncomeStatement && (
            <CustoProducaoCoeCot
              rows={coeCotQuery.data ?? []}
              realizedIncome={kpis?.realized_income ?? 0}
              hasCurrentHarvest={!!currentHarvest}
            />
          )}

          {canFinancial && financialData && (
            <>
              <DashboardRow>
                <PrevisaoReceberPagar data={financialData.forecast} />
              </DashboardRow>

              <DashboardRow>
                <AgingTitulos
                  data={financialData.aging}
                  isLoading={financialSummaryQuery.isFetching}
                />
                <ConcentracaoReceita data={financialData.revenue_concentration} />
              </DashboardRow>
            </>
          )}

          {canOverview && overviewData && <ExcecoesSemana data={overviewData.exceptions} />}

          {/* Blocos #10/#13 — fix-up GAP-FE-251 (RESOLVIDO). Cada bloco some
              independente se a respectiva permissão faltar — nunca a fileira
              inteira nem a página (mirror TASK-FE-211-07 §RBAC por bloco). */}
          {(canStockCoverage || canProductResult) && (
            <DashboardRow align="stretch">
              {canStockCoverage && (
                <CoberturaEstoque
                  data={stockCoverageQuery.data}
                  isLoading={checkLoadingStatus([stockCoverageQuery])}
                  isError={stockCoverageQuery.isError}
                  onRetry={() => stockCoverageQuery.refetch()}
                />
              )}
              {canProductResult && (
                <ResultadoPorProduto
                  data={productResultQuery.data}
                  isLoading={checkLoadingStatus([productResultQuery])}
                  isError={productResultQuery.isError}
                  onRetry={() => productResultQuery.refetch()}
                />
              )}
            </DashboardRow>
          )}
        </>
      )}
    </DashboardGrid>
  );
}
