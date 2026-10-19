// src/pages/Administrativo/AtividadesRecentes/hooks/useOpenRecentActivity.ts
// -----------------------------------------------------------------------------
// Ação "Abrir" de ATIVIDADES RECENTES (UT-000690 / F-349, ARQ-FE §5, TC-ACT-01..04).
//
// Um item pode pertencer a OUTRA fazenda do mesmo contratante; os `show` são
// escopados pela fazenda dona (404 com outra no `X-Farm-Id`). Sequência:
//   1. `spa_path` nulo/inseguro → não executa.
//   2. mesma fazenda → `navigate(spa_path)`.
//   3. outra fazenda → `useActivateFarm` (INALTERADO: selectFarm → setActiveFarm →
//      invalida tudo) → toast de sucesso → `navigate`. Erro → toast de erro e
//      NÃO navega (DP-FE-01b: sem diálogo de confirmação, igual ao FarmSwitcher).
//   4. durante a troca: guarda por ref contra duplo clique; a linha em curso fica
//      em loading e as demais desabilitadas (`isPending`).
//
// `spa_path` é RELATIVO e já resolvido pela API — é proibido montar a rota aqui.
// -----------------------------------------------------------------------------

import { useCallback, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';

import { toaster } from '@/components/ui/toaster';

import { AuthContext } from '@/contexts/AuthContext';

import { useActivateFarm } from '@/hooks/useActivateFarm';
import { useLanguage } from '@/hooks/useLanguage';

import type { RecentActivityListItem } from '@/@types/v2/RecentActivities';

// Só aceita caminho relativo da própria SPA (anti open-redirect).
export function isSafeSpaPath(path: string | null | undefined): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('\\')
  );
}

export function recentActivityRowKey(item: Pick<RecentActivityListItem, 'type' | 'uuid'>): string {
  return `${item.type}:${item.uuid}`;
}

export function useOpenRecentActivity() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);
  const activateFarm = useActivateFarm();
  const inFlight = useRef(false);
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  const canOpen = useCallback(
    (item: Pick<RecentActivityListItem, 'spa_path'>) => isSafeSpaPath(item.spa_path),
    []
  );

  const handleOpen = useCallback(
    async (item: RecentActivityListItem) => {
      const path = item.spa_path;
      if (!isSafeSpaPath(path) || inFlight.current) return;

      if (item.farm.uuid === activeFarmUuid) {
        navigate(path);
        return;
      }

      inFlight.current = true;
      setOpeningKey(recentActivityRowKey(item));
      try {
        await activateFarm.mutateAsync(item.farm.uuid);
      } catch {
        toaster.error({
          title: languageGB.defaltStrings.farmSwitcher.changeErrorToastTitle,
          description: languageGB.defaltStrings.farmSwitcher.changeErrorToastDescription,
          duration: 6000,
        });
        inFlight.current = false;
        setOpeningKey(null);
        return;
      }

      toaster.success({
        title: languageGB.defaltStrings.farmSwitcher.changedToastTitle,
        description: item.farm.name,
        duration: 4000,
      });
      inFlight.current = false;
      setOpeningKey(null);
      navigate(path);
    },
    [activeFarmUuid, activateFarm, languageGB, navigate]
  );

  return { handleOpen, canOpen, openingKey, isPending: openingKey !== null };
}
