// src/pages/Operacional/FeedlotMapDashboard/useFeedlotMapFilters.ts
// Filtros locais `FL01-04` (entryFrom/entryTo/exitFrom/exitTo) do Mapa de
// Confinamento — TASK-FE-042-200, `[[05-front-tela-mapa]]` §"Estado". 100%
// client-side, sem persistência de URL/storage (mirror `IG05`): os filtros
// NUNCA removem card da árvore, só derivam se um curral fica `dimmed`.

import { useMemo, useState } from 'react';

import type { FeedlotMapLocalFilters } from '@/@types/v2/FeedlotMap';

const INITIAL_FILTERS: FeedlotMapLocalFilters = {
  entryFrom: null,
  entryTo: null,
  exitFrom: null,
  exitTo: null,
};

export function useFeedlotMapFilters() {
  const [filters, setFilters] = useState<FeedlotMapLocalFilters>(INITIAL_FILTERS);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value !== null),
    [filters]
  );

  function handleChange(field: keyof FeedlotMapLocalFilters, value: string | null) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS);
  }

  // Comparação lexical ISO (YYYY-MM-DD) inclusiva — mirror `IG05`. Ausência
  // de `entry_date`/`exit_date` no card NUNCA gera `dimmed` (dado
  // insuficiente para julgar fora do período — Regra 9, não fabricar).
  function isCorralDimmed(entryDate: string | null, exitDate: string | null): boolean {
    if (filters.entryFrom && entryDate && entryDate < filters.entryFrom) return true;
    if (filters.entryTo && entryDate && entryDate > filters.entryTo) return true;
    if (filters.exitFrom && exitDate && exitDate < filters.exitFrom) return true;
    if (filters.exitTo && exitDate && exitDate > filters.exitTo) return true;
    return false;
  }

  return { filters, hasActiveFilters, handleChange, handleReset, isCorralDimmed };
}
