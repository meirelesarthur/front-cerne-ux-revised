// src/pages/Administrativo/RegistroEventos/useBonuses.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de REGISTRO DE EVENTOS (Bonus) — esteira 037
// (registro-eventos-front-roteiro.md, TASK-FE-05), mirror de
// `Adiantamento/useAdvances.tsx`:
//   - useBonusesList  → useCustomGridQuery (listagem paginada, SEM filtro —
//                        BonusRepository::list() não aceita nenhum parâmetro)
//   - useBonusDetail  → useQuery direto (tela de Detalhe, leitura pura)
//   - useBonusForm    → useCustomFormQueryByGuid (hidratação do form create/edit)
//
// Selects tenant-scoped de Funcionário/Evento usam os services existentes
// (`listEmployees`/`listEvents`) DIRETO no `SelectAsyncPaginate` das telas —
// sem hook dedicado (mesma decisão de `Advance`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { getBonusByUuid, listBonuses } from '@/services/v2/Bonuses/bonus-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { Bonus } from '@/@types/v2/Bonuses';

interface UseBonusesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

// Query de listagem paginada de registros de eventos — SEM filtro (o
// backend não aceita nenhum parâmetro além de page/per_page).
export function useBonusesList({ paginatedQuery, setPaginatedQuery }: UseBonusesListProps) {
  return useCustomGridQuery<Bonus, Record<string, never>>({
    asyncFunction: listBonuses,
    queryKey: queryKey.bonuses.bonuses,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {},
  });
}

interface UseBonusDetailProps {
  bonusUuid?: string;
}

// Leitura pura do Bonus para a tela de Detalhe. `enabled: isValidGuid(...)`
// garante que um uuid mal formado na URL NUNCA dispara a chamada de rede — a
// tela ainda faz um guard de navegação próprio por cima disto (mesmo padrão
// de `AdiantamentoDetalhe.tsx`).
export function useBonusDetail({ bonusUuid }: UseBonusDetailProps) {
  return useQuery({
    queryKey: [queryKey.bonuses.bonus, bonusUuid],
    queryFn: async () => (await getBonusByUuid(bonusUuid!)).data,
    enabled: isValidGuid(bonusUuid),
    refetchOnWindowFocus: false,
  });
}

interface UseBonusFormProps {
  registrationId?: string;
  fillForm: (data: Bonus, resetForce?: boolean) => void;
}

// Hidratação do formulário de create/edit (mirror `useAdvanceForm`):
// `useCustomFormQueryByGuid` chama `getBonusByUuid` e invoca `fillForm` no
// sucesso (`resetForce=true` na carga inicial).
export function useBonusForm({ registrationId, fillForm }: UseBonusFormProps) {
  return useCustomFormQueryByGuid<Bonus>({
    registrationId,
    queryKey: queryKey.bonuses.bonus,
    asyncFunction: getBonusByUuid,
    fillForm,
  });
}
