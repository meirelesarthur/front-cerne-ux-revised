// src/pages/Operacional/Monitoring/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Monitoramento (MonitoringServiceOrder) —
// TASK-MO-FE-03. Feature 100% leitura: SÓ `ButtonFilter` — SEM `ButtonAdd`
// (não há "criar" nesta tela, mode_matrix `NAO_APLICAVEL` para
// criar/editar/excluir) e SEM `GridSettingsFloatingPanel` (grid simples de
// 7 colunas fixas, personalização não é obrigatória nesta entrega — Tarefa
// §"Hooks", `useGridSettings` opcional).
// -----------------------------------------------------------------------------

import { ButtonFilter } from '@/components/ButtonFilter';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied }: HeaderTableProps) {
  return <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />;
}
