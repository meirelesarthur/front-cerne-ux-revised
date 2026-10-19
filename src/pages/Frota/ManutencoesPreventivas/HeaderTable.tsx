// src/pages/Frota/ManutencoesPreventivas/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Manutenções Preventivas (MaintenancePreventive)
// — Tarefa 43. Mirror `Frota/Abastecimentos/HeaderTable.tsx`, SEM
// `GridSettingsFloatingPanel` — 4 colunas fixas, personalização de grid
// dispensável para esta tela (Tarefa 43, opcional/não é DoD).
// -----------------------------------------------------------------------------

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  canCreate: boolean;
  onCreate: () => void;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  canCreate,
  onCreate,
}: HeaderTableProps) {
  return (
    <>
      {canCreate && <ButtonAdd onClick={onCreate} languageGB={languageGB} />}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
