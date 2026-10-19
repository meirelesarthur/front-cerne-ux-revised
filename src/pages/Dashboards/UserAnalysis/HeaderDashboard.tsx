// src/pages/Dashboards/UserAnalysis/HeaderDashboard.tsx
// Cabeçalho da dashboard Análise de Usuários (execução 046, TASK-UA-FE-04) —
// `DashboardHeader` do kit + `ButtonFilter` (badge de filtros ativos).

import { ButtonFilter } from '@/components/ButtonFilter';
import { DashboardHeader } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

interface HeaderDashboardProps {
  filtersApplied: number;
  onOpenFilter: () => void;
}

export function HeaderDashboard({ filtersApplied, onOpenFilter }: HeaderDashboardProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.userAnalysis;

  return (
    <DashboardHeader
      title={text.title}
      subtitle={text.subtitle}
      actions={<ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />}
    />
  );
}
