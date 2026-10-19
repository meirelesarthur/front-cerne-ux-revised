// src/pages/CadastrosBase/CicloProducao/useProductionCycles.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CICLO DE PRODUÇÃO (ProductionCycle) — TASK-FE-01
// (97-Esteiras/033), mesmo padrão de Safra/useHarvests.tsx:
//   - useProductionCyclesList   → useCustomGridQuery (listagem paginada)
//   - useProductionCycleDetail  → useQuery direto (tela de Detalhe, leitura pura)
//
// `useProductionCycleDetail` é leitura PURA — sem `fillForm`/reset de
// formulário (a tela de Detalhe não tem formulário nenhum), mesmo racional de
// `useHarvestDetail` (Safra/useHarvests.tsx).
//
// SEM drawer de filtro nesta Tarefa (TASK-FE-01 lista Arquivos-Alvo sem
// FilterSide próprio — DoD admite explicitamente "caso contrário, sem
// filtro"). `filter` fica reservado no tipo (`ProductionCycleFilterForm`,
// campos harvest_uuid/user_uuid/start_date/end_date do C26 legado) para um
// painel futuro (Gap/Tarefa própria), sem invenção de UI aqui.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listActiveHarvests } from '@/services/v2/Harvests/harvest-service';
import {
  getProductionCycleByUuid,
  listProductionCycles,
} from '@/services/v2/ProductionCycles/production-cycle-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { ProductionCycle, ProductionCycleFilterForm } from '@/@types/v2/ProductionCycles';

interface UseProductionCyclesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ProductionCycleFilterForm;
}

// Query de listagem paginada de ciclos de produção (filtros `harvest_uuid`/
// `user_uuid`/`start_date`/`end_date` vão como query params — ver
// ListProductionCyclesParams). `filter` sempre `{}` até o painel de filtro
// ser materializado (ver nota de cabeçalho).
export function useProductionCyclesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseProductionCyclesListProps) {
  return useCustomGridQuery<ProductionCycle, ProductionCycleFilterForm>({
    asyncFunction: listProductionCycles,
    queryKey: queryKey.productionCycles.productionCycles,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ProductionCycleFilterForm),
  });
}

interface UseProductionCycleDetailProps {
  productionCycleUuid?: string;
}

// Leitura pura do Ciclo de Produção para a tela de Detalhe (com `areas` —
// only-in-show, ver production-cycle-service.ts). `enabled: isValidGuid(...)`
// garante que um uuid mal formado na URL NUNCA dispara a chamada de rede — a
// tela ainda faz um guard de navegação próprio por cima disto (mesmo padrão
// de SafraDetalhe.tsx).
export function useProductionCycleDetail({ productionCycleUuid }: UseProductionCycleDetailProps) {
  return useQuery({
    queryKey: [queryKey.productionCycles.productionCycle, productionCycleUuid],
    queryFn: async () => (await getProductionCycleByUuid(productionCycleUuid!)).data,
    enabled: isValidGuid(productionCycleUuid),
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// TASK-FE-02 — hidratação do formulário de create/edit (mesmo padrão de
// `useHarvestForm`, Safra/useHarvests.tsx): `useCustomFormQueryByGuid` chama
// `getProductionCycleByUuid` (with areas) e invoca `fillForm` no sucesso.
// ---------------------------------------------------------------------------
interface UseProductionCycleFormProps {
  registrationId?: string;
  fillForm: (data: ProductionCycle, resetForce?: boolean) => void;
}

export function useProductionCycleForm({ registrationId, fillForm }: UseProductionCycleFormProps) {
  return useCustomFormQueryByGuid<ProductionCycle>({
    registrationId,
    queryKey: queryKey.productionCycles.productionCycle,
    asyncFunction: getProductionCycleByUuid,
    fillForm,
  });
}

// ---------------------------------------------------------------------------
// TASK-FE-02 — catálogo de Safras ATIVAS para o Select estático de
// `harvest_uuid` (`GET /harvests/active`, FID-G3F §3.1/C45). Universo
// pequeno, NÃO-paginado — buscado 1x via `useQuery` direto, mesmo racional
// de `SelectCultivation` (sem `SelectAsyncPaginate`, que exige um contrato de
// serviço paginado que `listActiveHarvests` não tem).
// ---------------------------------------------------------------------------
export function useActiveHarvests() {
  return useQuery({
    queryKey: [queryKey.harvests.active],
    queryFn: async () => (await listActiveHarvests()).data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Catálogo COMPLETO de Áreas da fazenda ativa — para a tela de Detalhe E o
// formulário (TASK-FE-02) derivarem "Total ha"/"Qtd Áreas" (D-FE-3: base =
// `productive_area`, FID-G3F §4). `ProductionCycleAreaRef` (resposta de
// `production-cycles/{uuid}`) só expõe `{uuid, description}` — SEM
// `productive_area` — por isso o join client-side contra o catálogo de
// Áreas (`AreaListItem.productive_area`). O formulário TAMBÉM usa este
// catálogo para popular o multiselect de `areas` (D-FE-2) — mesmo universo,
// mesma chave de cache (`activeFarmUuid`), TanStack Query deduplica.
//
// Loop paginado (`per_page` MÁX=100, cap 50 páginas) — RISCO 1 do
// task-packet: `GET /areas` trunca em 100 numa chamada única; mirror EXATO
// de `GrazingMap.fetchAllAreas`/`useBatchAreas.fetchAllActiveAreas` (mesma
// convenção do projeto: duplicar o loop por tela consumidora, não extrair um
// util compartilhado — nenhum precedente de import cruzado entre essas 3
// telas). NUNCA 1 chamada única com `per_page:100`.
// ---------------------------------------------------------------------------
const AREAS_PER_PAGE = 100;
const MAX_AREA_PAGES = 50;

async function fetchAllFarmAreas(farmUuid: string): Promise<AreaListItem[]> {
  const first = await listAreas({ farm_uuid: farmUuid, per_page: AREAS_PER_PAGE, page: 1 });
  const items = [...first.data.items];
  const totalPages = Math.min(first.data.pagination.total_pages, MAX_AREA_PAGES);

  for (let page = 2; page <= totalPages; page += 1) {
    // eslint-disable-next-line no-await-in-loop -- paginação sequencial deliberada (poucas páginas esperadas)
    const next = await listAreas({ farm_uuid: farmUuid, per_page: AREAS_PER_PAGE, page });
    items.push(...next.data.items);
  }

  return items;
}

interface UseProductionCycleAreasCatalogProps {
  activeFarmUuid: string | null | undefined;
}

// Só habilita quando há fazenda ativa resolvida — mesmo guard de
// `GrazingMap`/`useBatchAreas` (`enabled: !!activeFarmUuid`).
export function useProductionCycleAreasCatalog({
  activeFarmUuid,
}: UseProductionCycleAreasCatalogProps) {
  return useQuery({
    queryKey: [
      'CicloProducaoDetalheAreas',
      queryKey.productionCycles.productionCycles,
      activeFarmUuid,
    ],
    queryFn: () => fetchAllFarmAreas(activeFarmUuid as string),
    enabled: !!activeFarmUuid,
    refetchOnWindowFocus: false,
  });
}
