// src/pages/CadastrosBase/Safra/useHarvests.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de SAFRAS (Harvest) — mesmo padrão de
// CentroCusto/useCostCenters.tsx:
//   - useHarvestsList        → useCustomGridQuery (listagem paginada + filtros)
//   - useHarvestForm         → useCustomFormQueryByGuid (detalhe p/ formulário)
//   - useHarvestDetail       → useQuery direto (TASK-FE-010, tela de Detalhe)
//   - useHarvestCurrentWeek  → useQuery direto (TASK-FE-010, semana vigente)
//
// `useHarvestDetail`/`useHarvestCurrentWeek` (TASK-FE-010) são leitura PURA —
// nenhum dos dois consome `fillForm`/reset de formulário (a tela de Detalhe
// não tem formulário nenhum), então não se encaixam em
// `useCustomFormQueryByGuid`/`useCustomGridQuery`. Mesmo racional de
// `usePermissionTree` em CadastrosBase/Perfil/useRoles.tsx: `useQuery`
// direto, nomeado, sem lógica de fetch no componente (Lei 3).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import {
  getHarvest,
  getHarvestCurrentWeek,
  listHarvests,
} from '@/services/v2/Harvests/harvest-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { Harvest, HarvestFilterForm, WeekVintage } from '@/@types/v2/Harvests';

interface UseHarvestsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: HarvestFilterForm;
}

// Query de listagem paginada de safras (filtros `search`/`is_enabled` vão
// como query params — ver ListHarvestsParams).
export function useHarvestsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseHarvestsListProps) {
  return useCustomGridQuery<Harvest, HarvestFilterForm>({
    asyncFunction: listHarvests,
    queryKey: queryKey.harvests.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as HarvestFilterForm),
  });
}

interface UseHarvestFormProps {
  registrationId?: string;
  fillForm: (data: Harvest, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID).
export function useHarvestForm({ registrationId, fillForm }: UseHarvestFormProps) {
  return useCustomFormQueryByGuid<Harvest>({
    registrationId,
    queryKey: queryKey.harvests.detail,
    asyncFunction: getHarvest,
    fillForm,
  });
}

interface UseHarvestDetailProps {
  harvestId?: string;
}

// TASK-FE-010 — leitura pura da Safra para a tela de Detalhe (sem
// fillForm/reset: nada de formulário aqui). `enabled: isValidGuid(...)`
// garante que um uuid mal formado na URL NUNCA dispara a chamada de rede —
// a tela ainda faz um guard de navegação próprio por cima disto (ver
// SafraDetalhe.tsx), mas a ausência de fetch já é garantida aqui.
export function useHarvestDetail({ harvestId }: UseHarvestDetailProps) {
  return useQuery({
    queryKey: [queryKey.harvests.detail, harvestId],
    queryFn: async () => (await getHarvest(harvestId!)).data,
    enabled: isValidGuid(harvestId),
    refetchOnWindowFocus: false,
  });
}

interface UseHarvestCurrentWeekProps {
  harvestId?: string;
  date: string;
}

// TASK-FE-010 — semana vigente na data informada (`GET
// /harvests/{uuid}/weeks/current`). `retry: false`: 404 é resultado
// ESPERADO quando nenhuma semana cobre a data (safra encerrada/futura/
// desabilitada) — não uma falha transitória de rede que valha re-tentar. O
// chamador (SafraDetalhe.tsx) trata esse 404 como estado de UI ("sem semana
// vigente"), nunca como toast de erro.
export function useHarvestCurrentWeek({ harvestId, date }: UseHarvestCurrentWeekProps) {
  return useQuery<WeekVintage>({
    queryKey: [queryKey.harvests.currentWeek, harvestId, date],
    queryFn: async () => (await getHarvestCurrentWeek(harvestId!, date)).data,
    enabled: isValidGuid(harvestId),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
