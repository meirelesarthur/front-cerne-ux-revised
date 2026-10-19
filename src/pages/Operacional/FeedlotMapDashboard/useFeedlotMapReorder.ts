// src/pages/Operacional/FeedlotMapDashboard/useFeedlotMapReorder.ts
// Mutações de reorder (drag-and-drop) do Mapa de Confinamento —
// TASK-FE-042-202, `[[06-front-estrutura-espacial]]` §4. `useMutation`
// direto (não `useRequest`) — mirror `IG06/IG07` do legado ("erro somente
// console"), MAS front UPGRADE: toast de ERRO sempre visível (`MANDATO DE
// FIDELIDADE`, hardening de UX). `onSuccess` invalida `queryKey.feedlotMap.tree`
// (reconcilia com o servidor, que pode ter corrigido conflitos, `S063`).
//
// Reorder de COMPONENTES (curral/rua) — `GAP-FE-240` resolvido (backend
// passou a expor `component.uuid` na árvore).

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toaster } from '@/components/ui/toaster';

import { queryKey } from '@/constants/query-key';

import {
  reorderFeedlotComponents,
  reorderFeedlotSectors,
  reorderFeedlotYards,
  type FeedlotComponentReorderItem,
  type FeedlotMapPriorityItem,
} from '@/services/v2/FeedlotMap/feedlot-map-service';

function useReorderMutation<T>(mutationFn: (items: T[]) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onError: () => {
      toaster.create({
        type: 'error',
        title: 'Não foi possível salvar a nova ordem.',
        description: 'A posição anterior foi restaurada. Tente novamente.',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
    },
  });
}

export function useReorderYards() {
  return useReorderMutation<FeedlotMapPriorityItem>(reorderFeedlotYards);
}

export function useReorderSectors() {
  return useReorderMutation<FeedlotMapPriorityItem>(reorderFeedlotSectors);
}

export function useReorderComponents() {
  return useReorderMutation<FeedlotComponentReorderItem>(reorderFeedlotComponents);
}
