// src/pages/Administrativo/Adiantamento/useAdvances.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de ADIANTAMENTO SALARIAL (Advance) —
// TASK-FE-adiant-salarial (97-Esteiras/034), mirror de
// `CicloProducao/useProductionCycles.tsx`:
//   - useAdvancesList   → useCustomGridQuery (listagem paginada, filtro employee_uuid)
//   - useAdvanceDetail  → useQuery direto (tela de Detalhe, leitura pura)
//   - useAdvanceForm    → useCustomFormQueryByGuid (hidratação do form create/edit)
//
// Selects tenant-scoped de Funcionário/Evento usam os services existentes
// (`listEmployees`/`listEvents`) DIRETO no `SelectAsyncPaginate` das telas —
// sem hook dedicado (mesma decisão da Tarefa, não há filtro de tipo no
// evento — default FID-G3F §6.2).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { getAdvanceByUuid, listAdvances } from '@/services/v2/Advances/advance-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { Advance, AdvanceFilterForm } from '@/@types/v2/Advances';

interface UseAdvancesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: AdvanceFilterForm;
}

// Query de listagem paginada de adiantamentos (filtro `employee_uuid` vai
// como query param — ver ListAdvancesParams).
export function useAdvancesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseAdvancesListProps) {
  return useCustomGridQuery<Advance, AdvanceFilterForm>({
    asyncFunction: listAdvances,
    queryKey: queryKey.advances.advances,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as AdvanceFilterForm),
  });
}

interface UseAdvanceDetailProps {
  advanceUuid?: string;
}

// Leitura pura do Adiantamento para a tela de Detalhe. `enabled:
// isValidGuid(...)` garante que um uuid mal formado na URL NUNCA dispara a
// chamada de rede — a tela ainda faz um guard de navegação próprio por cima
// disto (mesmo padrão de `CicloProducaoDetalhe.tsx`).
export function useAdvanceDetail({ advanceUuid }: UseAdvanceDetailProps) {
  return useQuery({
    queryKey: [queryKey.advances.advance, advanceUuid],
    queryFn: async () => (await getAdvanceByUuid(advanceUuid!)).data,
    enabled: isValidGuid(advanceUuid),
    refetchOnWindowFocus: false,
  });
}

interface UseAdvanceFormProps {
  registrationId?: string;
  fillForm: (data: Advance, resetForce?: boolean) => void;
}

// Hidratação do formulário de create/edit (mirror `useProductionCycleForm`):
// `useCustomFormQueryByGuid` chama `getAdvanceByUuid` e invoca `fillForm` no
// sucesso (`resetForce=true` na carga inicial).
export function useAdvanceForm({ registrationId, fillForm }: UseAdvanceFormProps) {
  return useCustomFormQueryByGuid<Advance>({
    registrationId,
    queryKey: queryKey.advances.advance,
    asyncFunction: getAdvanceByUuid,
    fillForm,
  });
}
