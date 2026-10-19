// src/pages/Operacional/FeedlotMapDashboard/useFeedlotMapTree.ts
// Hook de fetch da árvore completa do Mapa de Confinamento (TASK-FE-042-200,
// `[[06-front-estrutura-espacial]]` §1). NÃO usa `useCustomGridQuery` (é para
// listagens paginadas) — a árvore é `useQuery` direto, shape aninhado
// completo, sem paginação. `isTvMode` (consumido por `TASK-FE-042-203`, Modo
// TV) troca o refresh visível por refetch silencioso a cada 5 minutos
// (`IG03`) — mesmo hook, sem duplicar a query.

import { useQuery } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import { getFeedlotMapTree } from '@/services/v2/FeedlotMap/feedlot-map-service';

interface UseFeedlotMapTreeOptions {
  /** Modo TV (TASK-FE-042-203): refetch silencioso a cada 5 min, sem refetch por foco. */
  isTvMode?: boolean;
}

export function useFeedlotMapTree({ isTvMode = false }: UseFeedlotMapTreeOptions = {}) {
  return useQuery({
    queryKey: [queryKey.feedlotMap.tree],
    queryFn: async () => {
      const response = await getFeedlotMapTree();
      return response.data;
    },
    networkMode: 'online',
    staleTime: 0,
    refetchOnWindowFocus: !isTvMode,
    refetchInterval: isTvMode ? 5 * 60 * 1000 : false,
  });
}
