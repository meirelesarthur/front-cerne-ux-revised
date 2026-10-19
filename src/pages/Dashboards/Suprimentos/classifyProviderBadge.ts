// src/pages/Dashboards/Suprimentos/classifyProviderBadge.ts
// Corte de classificação do badge de desempenho do fornecedor (Tarefa 58,
// contrato de tela v2 §6.1, UX-GAP-01 do contrato de API — decisão de UI do
// FRONTEND, sem precedente de negócio em nenhum relatório migrado; cortes
// IDÊNTICOS a `badgeFromSaving()` do protótipo `GB.Cerne.UX/src/pages/
// dashboards/DashSuprimentos.tsx@8663490`). Função PURA — mapeamento para
// `colorPalette`/label fica na camada de apresentação (i18n), mirror do
// racional de `formatDurationHoursCompact.ts`.
export type ProviderBadgeLevel = 'excellent' | 'good' | 'regular';

export default function classifyProviderBadge(savingPercentage: number): ProviderBadgeLevel {
  if (savingPercentage > 15) return 'excellent';
  if (savingPercentage >= 8) return 'good';
  return 'regular';
}
