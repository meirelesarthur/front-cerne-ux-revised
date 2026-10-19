// src/pages/CadastrosBase/Fazendas/useFarms.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo administrativo de FAZENDAS (Farm) — execução 024,
// `TASK-FE-400`. Mesmo padrão de `CentroCusto/useCostCenters.tsx`/
// `FamiliaBens/useFamilyEquipments.tsx`:
//   - useFarmsList   → useCustomGridQuery (listagem paginada REAL + filtros)
//   - useFarmForm    → useCustomFormQueryByGuid (detalhe p/ formulário, Lei 2)
//   - useFarmCenters → useQuery simples (`GET /farms/{uuid}/centers`, Grupo C,
//     só modo edição) — exposto por completude do contrato; a tela de
//     formulário (TASK-FE-403) usa `useFarmCostCenterOptions` (catálogo geral
//     do tenant, `/cost-centers/options`) como fonte ÚNICA do multiselect em
//     AMBOS os modos (decisão da Tarefa — ver `CreateOrUpdateFarm.tsx`).
//   - useFarmCostCenterOptions → useQuery com busca controlada (debounce),
//     alimenta o `CheckboxListField` de Centros de Custo.
// -----------------------------------------------------------------------------

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { getFarmByUuid, listFarmCenters, listFarms } from '@/services/v2/Farms/farm-admin-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FarmDetail, FarmFilterForm } from '@/@types/v2/Farms/farm-admin';

interface UseFarmsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: FarmFilterForm;
}

export function useFarmsList({ paginatedQuery, setPaginatedQuery, filter }: UseFarmsListProps) {
  return useCustomGridQuery<FarmDetail, FarmFilterForm>({
    asyncFunction: listFarms,
    queryKey: queryKey.farms.farmsAdminList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as FarmFilterForm),
  });
}

interface UseFarmFormProps {
  registrationId?: string;
  fillForm: (data: FarmDetail, resetForce?: boolean) => void;
}

export function useFarmForm({ registrationId, fillForm }: UseFarmFormProps) {
  return useCustomFormQueryByGuid<FarmDetail>({
    registrationId,
    queryKey: queryKey.farms.farmsAdminDetail,
    asyncFunction: getFarmByUuid,
    fillForm,
  });
}

/**
 * `GET /farms/{uuid}/centers` (Grupo C) — só disponível em modo EDIÇÃO. Não
 * consumido pelo formulário atual (que usa `useFarmCostCenterOptions` para os
 * 2 modos, TASK-FE-403); exposto por completude do contrato/futuro consumo.
 * @param {string|undefined} farmUuid - UUID da fazenda (query desabilitada se ausente).
 * @return {UseQueryResult<FarmCenterOption[]>} query TanStack com os centros disponíveis em `data`.
 */
export function useFarmCenters(farmUuid: string | undefined) {
  return useQuery({
    queryKey: [queryKey.farms.farmsAdminDetail, 'centers', farmUuid],
    queryFn: () => listFarmCenters(farmUuid as string),
    enabled: !!farmUuid,
    staleTime: 0,
    retry: false,
  });
}

/**
 * Fonte do `CheckboxListField` de Centros de Custo do formulário de Fazenda
 * (TASK-FE-403) — `GET /cost-centers/options` (catálogo geral do tenant
 * corrente, sem gate de `costcenters_view`, `only_analytic=true` mirror do
 * filtro `class=2` do endpoint dedicado `/farms/{uuid}/centers`, RN-08/
 * PERGUNTA-06). Usado em AMBOS os modos (criação e edição) — decisão desta
 * Tarefa (ver "Leitura do dev" de `TASK-FE-403`): em modo criação não há
 * `{uuid}` de farm ainda, então `GET /farms/{uuid}/centers` não serve.
 *
 * Busca CONTROLADA pelo consumidor (`search`, debounced no componente) —
 * `per_page` alto o bastante para cobrir o universo típico de um tenant sem
 * paginação real na UI (mesmo espírito de `useCostCenterTree`, mas via
 * catálogo enxuto em vez de árvore).
 * @param {string} search - Termo de busca (debounced internamente, 400ms).
 * @return {UseQueryResult<CostCenterRef[]>} query TanStack com as opções em `data`.
 */
export function useFarmCostCenterOptions(search: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  return useQuery({
    queryKey: ['farm-cost-center-options', debouncedSearch],
    queryFn: async () => {
      const response = await listCostCenterOptions({
        search: debouncedSearch || undefined,
        per_page: 100,
        only_analytic: true,
        // Fidelidade ao legado: só Centros de Custo ATIVOS no seletor da
        // Fazenda (fix do 422 ao salvar com centro inativo selecionado).
        is_enabled: 'true',
      });
      return response.data?.items ?? ([] as CostCenterRef[]);
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
