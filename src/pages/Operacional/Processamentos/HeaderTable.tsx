// src/pages/Operacional/Processamentos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Processamentos (TASK-FE-039-PROC-02) — mirror
// reduzido de `Operacional/Nascimentos/HeaderTable.tsx`: SEM "Adicionar" — a
// API não tem `store()` (`ProcessingController` só expõe index/show/finish,
// front-plan-proc.md §1.1) — os processamentos nascem automaticamente das
// origens do rebanho, não são criados manualmente pelo usuário.
// -----------------------------------------------------------------------------

import { ButtonFilter } from '@/components/ButtonFilter';

import type { LanguageDate } from '@/@types/language';

export interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied }: HeaderTableProps) {
  return <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />;
}
