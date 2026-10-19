// src/pages/Dashboards/AssetsDashboard/HeaderDashboard.tsx
// Cabeçalho da dashboard Ativos (execução 046, TASK-AT-FE-05) —
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
  const text = languageGB.dashboards.assetsDashboard;

  return (
    <DashboardHeader
      title={text.title}
      subtitle={text.subtitle}
      actions={<ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />}
    />
  );
}
