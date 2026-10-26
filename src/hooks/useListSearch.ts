// src/hooks/useListSearch.ts
// Busca inline das listagens: liga o campo de texto do `ListToolbar` ao filtro `search` do
// `userPaginatedQuery` (o mesmo param `search` que o drawer de filtros já enviava ao backend).
// Aplica com debounce e preserva os demais filtros; sincroniza quando o filtro muda por fora
// (ex.: "Limpar" no drawer).

import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;

interface WithSearch {
  search?: string;
}

export function useListSearch<TFilter extends WithSearch>(
  filter: TFilter | null | undefined,
  applyFilter: (next: TFilter) => void,
) {
  const external = filter?.search ?? '';
  const [value, setValue] = useState(external);
  const lastApplied = useRef(external);

  // filtro mudou por fora → reflete no campo
  useEffect(() => {
    if (external !== lastApplied.current) {
      lastApplied.current = external;
      setValue(external);
    }
  }, [external]);

  // digitação → aplica depois do debounce
  useEffect(() => {
    const next = value.trim();
    if (next === lastApplied.current) return;
    const id = setTimeout(() => {
      lastApplied.current = next;
      applyFilter({ ...(filter ?? {}), search: next || undefined } as TFilter);
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { value, onChange: setValue };
}
