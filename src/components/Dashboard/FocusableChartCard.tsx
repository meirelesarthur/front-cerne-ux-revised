// src/components/Dashboard/FocusableChartCard.tsx
// Adaptação Chakra v3 de
// `GB.Cerne.UX/src/components/ui/FocusableChartCard.tsx@8663490`
// (execução 046, TASK-DASH-FE-02).

import type { ReactNode } from 'react';

import { useSeriesFocus } from '@/hooks/useSeriesFocus';

import { DashboardCard } from './DashboardGrid';

import type { DashboardCardProps } from './DashboardGrid';

interface FocusableChartCardProps<T extends { name: string }> extends Omit<
  DashboardCardProps,
  'children' | 'action'
> {
  /** Séries do bloco — o seletor lista uma opção por série. */
  series: T[];
  /** Gráfico do bloco, recebendo as séries em foco. */
  children: (series: T[], focused: string | null) => ReactNode;
  /** Rótulo da opção que mostra tudo — i18n do módulo consumidor (`languageGB.dashboards.common.*`). */
  allLabel: string;
  /**
   * Conteúdo à esquerda do seletor no slot de ação — recebe as séries em
   * foco para que a legenda acompanhe o recorte em vez de listar séries
   * ocultas.
   */
  action?: (series: T[]) => ReactNode;
}

/**
 * Bloco de gráfico com foco de série: `DashboardCard` + seletor no canto
 * direito do rótulo. Com "Todas as séries" o gráfico fica como está; ao
 * escolher uma, ela ocupa o gráfico inteiro e o eixo se reescala nela —
 * comparar é uma leitura, olhar uma série de perto é outra.
 *
 * O estado do foco mora aqui, no card: a tela não ganha hook nem estado, e o
 * seletor nunca aparece quando há uma série só.
 *
 * ```tsx
 * <FocusableChartCard
 *   title="Evolução do rebanho"
 *   flex={2}
 *   series={rebanhoSeries}
 *   allLabel={languageGB.dashboards.common.allSeries}
 * >
 *   {(series) => <LineChart series={series} labels={labels} height={260} />}
 * </FocusableChartCard>
 * ```
 * @return {JSX.Element} `DashboardCard` com seletor de série no slot de ação.
 */
export function FocusableChartCard<T extends { name: string }>({
  series,
  children,
  allLabel,
  action,
  ...cardProps
}: FocusableChartCardProps<T>) {
  const foco = useSeriesFocus(series, allLabel);

  return (
    <DashboardCard
      {...cardProps}
      action={
        <>
          {action?.(foco.series)}
          {foco.selector}
        </>
      }
    >
      {children(foco.series, foco.focused)}
    </DashboardCard>
  );
}
