// src/pages/CadastrosBase/Areas/useAreas.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo Áreas (Area) consumidos pela sub-lista dentro da
// listagem de Fazendas (F-348/UT-000446, TASK-FE-416, `AreasSubList.tsx`) e
// pelo editor single/mapa (419/420).
//
// `useFarmAreasSubList` (chamada separada + paginação, `GET /areas?farm_uuid=`)
// foi REMOVIDO no refinamento desta esteira (2 pontos do dono, F-348/
// UT-000446): `GET /api/v1/farms` agora devolve `areas: FarmAreaListItem[]`
// (subconjunto enxuto, EAGER via `with('areas')`, SEM paginação) em CADA
// Fazenda — `AreasSubList.tsx` consome `farm.areas` direto do objeto já
// carregado pela listagem-pai (`useFarmsList`, `Fazendas/useFarms.tsx`), sem
// nenhuma chamada própria. Mirror do MESMO padrão de `MaintenanceItemsSubRow`
// (itens já vêm no payload da listagem-pai) — a diferença original (chamada
// LAZY por `farm_uuid`) deixou de existir.
//
// ⚠️ `useFarmAreaGeometries` (abaixo, TASK-FE-419) É OUTRA NECESSIDADE — busca
// as geometrias de TODAS as Áreas irmãs (paginação client-side própria, sem
// relação com a sub-lista) para o aviso de sobreposição do `AreaMapEditor`.
// NÃO remover/fundir com a sub-lista.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import type { MarkerType } from '@/constants/Marker/marker-type';
import { queryKey } from '@/constants/query-key';

import { getArea, listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listActiveMarkers } from '@/services/v2/BaseRegistrations/marker-service';

import type { AreaData, AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { MarkerListItem } from '@/@types/v2/BaseRegistrations/marker';

// -----------------------------------------------------------------------------
// TASK-FE-420 (Áreas — editor single, SURF-04/06) — hidratação do formulário
// de edição (`CreateOrUpdateArea.tsx`), `GET /api/v1/areas/{uuid}`
// (`AreaResource` completo, matriz FID-G3A A-02). Mirror EXATO de
// `useProviderForm`/`useFarmForm`/`useCostCenterForm` — `useCustomFormQueryByGuid`
// + `queryKey.cadastrosBase.area` (SINGULAR — par de `queryKey.cadastrosBase.
// areas`, PLURAL, já usado acima pela sub-lista/geometrias). Lei 2 (`fillForm`
// nomeada + guarda `!isEmpty(dirtyFields) || resetForce`) fica no componente,
// não aqui (o hook só orquestra a query).
// -----------------------------------------------------------------------------

interface UseAreaFormProps {
  registrationId: string | undefined;
  fillForm: (data: AreaData, resetForce?: boolean) => void;
}

export function useAreaForm({ registrationId, fillForm }: UseAreaFormProps) {
  return useCustomFormQueryByGuid<AreaData>({
    registrationId,
    queryKey: queryKey.cadastrosBase.area,
    asyncFunction: getArea,
    fillForm,
  });
}

// -----------------------------------------------------------------------------
// TASK-FE-419 (Áreas — editor de mapa, SURF-04a) — geometrias das Áreas
// IRMÃS da mesma Fazenda, para o aviso de sobreposição client-side (CLM-24,
// `AreaMapEditor.tsx`). Loop de páginas mirror EXATO de
// `GrazingMap.tsx::fetchAllAreas` (`AREAS_PER_PAGE`/`MAX_AREA_PAGES`) — o
// mesmo risco de truncamento de `areas-service.ts` (cabeçalho do arquivo,
// `per_page` máximo 100 no backend) se aplica aqui; um teto de páginas evita
// loop indefinido se `total_pages` vier corrompido.
// -----------------------------------------------------------------------------

const SIBLING_AREAS_PER_PAGE = 100;
const SIBLING_AREAS_MAX_PAGES = 50;

export interface SiblingAreaGeometry {
  uuid: string;
  description: string;
  coordinates: AreaListItem['coordinates'] | null;
}

async function fetchAllFarmAreaGeometries(farmUuid: string): Promise<SiblingAreaGeometry[]> {
  const first = await listAreas({ farm_uuid: farmUuid, per_page: SIBLING_AREAS_PER_PAGE, page: 1 });
  const items = [...first.data.items];
  const totalPages = Math.min(first.data.pagination.total_pages, SIBLING_AREAS_MAX_PAGES);

  for (let page = 2; page <= totalPages; page += 1) {
    // eslint-disable-next-line no-await-in-loop -- paginação sequencial deliberada (poucas páginas esperadas)
    const next = await listAreas({ farm_uuid: farmUuid, per_page: SIBLING_AREAS_PER_PAGE, page });
    items.push(...next.data.items);
  }

  return items.map((item) => ({
    uuid: item.uuid,
    description: item.description,
    coordinates: item.coordinates ?? null,
  }));
}

interface UseFarmAreaGeometriesProps {
  farmUuid: string | undefined;
  /** UUID da própria Área em edição — excluído do resultado (nunca sobrepõe
   *  a si mesma). `undefined` em modo criação (nada a excluir). */
  excludeAreaUuid?: string;
}

/**
 * Geometrias de TODAS as Áreas já cadastradas na Fazenda (exceto a própria,
 * em edição) — consumido só pelo aviso de sobreposição client-side do editor
 * de mapa (`AreaMapEditor.tsx`, TASK-FE-419). `enabled` gate por `farmUuid`
 * (sem Fazenda ainda selecionada, nada a buscar).
 * @param {UseFarmAreaGeometriesProps} props - `farmUuid` + `excludeAreaUuid` (edição).
 * @return {object} resultado do `useQuery` + `geometries` (já filtradas, sem a própria Área).
 */
export function useFarmAreaGeometries({ farmUuid, excludeAreaUuid }: UseFarmAreaGeometriesProps) {
  const query = useQuery({
    queryKey: [queryKey.cadastrosBase.areas, 'overlap-geometries', farmUuid],
    queryFn: () => fetchAllFarmAreaGeometries(farmUuid as string),
    enabled: !!farmUuid,
    networkMode: 'offlineFirst',
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 60_000,
  });

  const geometries = (query.data ?? []).filter((area) => area.uuid !== excludeAreaUuid);

  return { ...query, geometries };
}

// -----------------------------------------------------------------------------
// Correções pedidas pelo dono (F-348/UT-000446, retoque pós-419/420/421) —
// os selects de Atividade/Infraestrutura do formulário de Área usavam
// `listMarkers` (`GET /markers`, gated `permission:markers_view`, escopo
// ADMINISTRATIVO de CRUD de Marcadores) e devolviam 403/toast "Sem permissão"
// para o usuário comum de Área, que não tem essa permissão. `GET
// /markers/active?type=N` é a rota ABERTA correta (SOMENTE `auth:sanctum`,
// DA-MK-12) — catálogo `is_enabled=true` já filtrado por tipo
// (`markerType.activity`/`markerType.infrastructure`), NÃO-PAGINADO (conjunto
// fechado, mesmo racional de `useProprietariesList` acima). Consumida pelo
// `SelectCombobox` (Atividade, single) e pelo `Select` `multiple` (Infra) de
// `CreateOrUpdateArea.tsx`/`AreaCard.tsx` — e pela resolução de `icon_url` do
// `AreaMapEditor.tsx` (mesma lista já carregada, evitando o `GET
// /markers/{uuid}` gated que `getMarkerByUuid` fazia antes).
// -----------------------------------------------------------------------------
export function useActiveMarkersList(type: MarkerType) {
  return useQuery<MarkerListItem[]>({
    queryKey: [queryKey.markers.markersList, 'active', type],
    queryFn: () => listActiveMarkers(type),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
