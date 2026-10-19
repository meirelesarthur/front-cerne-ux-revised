// src/pages/Dashboards/OverviewPanel/HeaderDashboard.tsx
// Bloco #1 — Casca/Header (F-211, execução 062, TASK-FE-211-01). Mirror de
// `OverviewPanel.tsx@ffe92bc L.1240-1270`: saudação por horário + subtítulo
// com o nome da fazenda ativa + filtro "Período".
//
// Regra G (`GB.Cerne.UX/CLAUDE.md`) — exceção de campo único: com só 1
// filtro, vai direto no seletor inline (`MenuSelect`, já existente no fork —
// Regra F "já existe? reutilize"), NUNCA `ButtonFilter`+drawer para abrir um
// painel com um único campo dentro. Estado LOCAL (`useState`), NUNCA
// `useUrlFilter` — decisão já tomada no fork real para dashboards (contrato
// §6.3, mirror `CashbookDashboard`).
//
// Ajuste 2 (exec. 062, ajustes pós-entrega F-211): opções trocadas de
// 3/6/10 meses para 1/2/3/6/12 meses — recorte client-side sobre os dados já
// buscados (`financial-summary`), sem parâmetro novo no backend. Default da
// tela passa de `'10'` para `'6'` (ver `OverviewPanel/index.tsx`).

import { DashboardHeader } from '@/components/Dashboard';
import { MenuSelect } from '@/components/MenuSelect';

import { useLanguage } from '@/hooks/useLanguage';

import type { OverviewPanelPeriod } from '@/@types/v2/Dashboards/overviewPanel';

interface HeaderDashboardProps {
  farmName?: string;
  period: OverviewPanelPeriod;
  onPeriodChange: (period: OverviewPanelPeriod) => void;
}

/**
 * Saudação por horário — mirror `OverviewPanel.tsx` UX (`hour < 12`/`< 18`/senão).
 * @param {number} hour - Hora corrente (`Date.getHours()`, 0-23).
 * @return {'greetingMorning' | 'greetingAfternoon' | 'greetingEvening'} Chave de tradução da saudação.
 */
function greetingByHour(hour: number): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

export function HeaderDashboard({ farmName, period, onPeriodChange }: HeaderDashboardProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel;

  const greeting = text[greetingByHour(new Date().getHours())];
  const subtitle = farmName ? text.subtitleWithFarm.replace('{farm}', farmName) : text.subtitle;

  const periodOptions = [
    { key: '1', label: text.filter.periodOptions.last1 },
    { key: '2', label: text.filter.periodOptions.last2 },
    { key: '3', label: text.filter.periodOptions.last3 },
    { key: '6', label: text.filter.periodOptions.last6 },
    { key: '12', label: text.filter.periodOptions.last12 },
  ];

  return (
    <DashboardHeader
      title={greeting}
      subtitle={subtitle}
      actions={
        <MenuSelect
          value={periodOptions.find((option) => option.key === period)?.label ?? ''}
          options={periodOptions}
          onChange={(option) => onPeriodChange(option.key as OverviewPanelPeriod)}
        />
      }
    />
  );
}
