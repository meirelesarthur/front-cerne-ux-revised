// src/pages/Dashboards/DepreciationDashboard/HeaderDashboard.tsx
// Cabeçalho da dashboard Depreciações (execução 048, TASK-02-FE) —
// `DashboardHeader` do kit + `ButtonFilter`.

import { ButtonFilter } from '@/components/ButtonFilter';
import { DashboardHeader } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

interface HeaderDashboardProps {
  filtersApplied: number;
  onOpenFilter: () => void;
}

export function HeaderDashboard({ filtersApplied, onOpenFilter }: HeaderDashboardProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.depreciationDashboard;

  return (
    <DashboardHeader
      title={text.title}
      subtitle={text.subtitle}
      actions={<ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />}
    />
  );
}
