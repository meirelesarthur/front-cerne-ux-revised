// src/pages/Operacional/MyServiceOrders/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Minhas OS (MyServiceOrder) — esteira 063
// (TASK-MOS-FE-04). SÓ `ButtonFilter` — SEM `ButtonAdd` (não há "criar" nesta
// tela, mode_matrix `NAO_APLICAVEL` para criar/excluir, mirror
// `Operacional/Monitoring/HeaderTable.tsx`).
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
