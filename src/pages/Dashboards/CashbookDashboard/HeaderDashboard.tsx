// src/pages/Dashboards/CashbookDashboard/HeaderDashboard.tsx
// Cabeçalho da dashboard Livro Caixa (execução 048, TASK-03-FE) —
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
  const text = languageGB.dashboards.cashbookDashboard;

  return (
    <DashboardHeader
      title={text.title}
      subtitle={text.subtitle}
      actions={<ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />}
    />
  );
}
