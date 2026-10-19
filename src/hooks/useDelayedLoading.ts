// src/hooks/useDelayedLoading.ts
// Adaptação de `GB.Cerne.UX/src/hooks/useDelayedLoading.ts@8663490` (execução
// 046, TASK-DASH-FE-05). Mesma lógica 1:1 — a UX não usa Chakra/tema aqui,
// só timers; os valores em ms (`t.delay.loadingShow`/`loadingMin` no UX) são
// constantes locais, sem token de tema envolvido.

import { useEffect, useRef, useState } from 'react';

/** Anti-flash (ms) — resposta mais rápida que isso não pisca skeleton. */
const LOADING_SHOW_DELAY_MS = 225;
/** Anti-flicker (ms) — uma vez visível, o indicador fica no mínimo este tempo. */
const LOADING_MIN_VISIBLE_MS = 400;

/**
 * Decide **quando** mostrar o indicador de carregamento, não *se* está
 * carregando. Aplica duas guardas:
 *
 * - **Anti-flash** (225ms): resposta rápida não pisca skeleton. Antes disso o
 *   hook devolve `false` — a tela fica vazia por um instante e o conteúdo
 *   entra direto, sem a casca aparecer e sumir.
 * - **Anti-flicker** (400ms): uma vez visível, o indicador fica no mínimo
 *   este tempo. Sem isso, uma resposta em 250ms deixaria o skeleton
 *   piscando por 25ms.
 *
 * ```tsx
 * const showSkeleton = useDelayedLoading(isLoading);
 * if (isLoading) return showSkeleton ? <DashboardSkeleton /> : null;
 * ```
 * @param {boolean} isLoading - Estado real de carregamento (ex.: `isLoading` do TanStack Query).
 * @return {boolean} `true` quando o indicador deve estar visível.
 */
export function useDelayedLoading(isLoading: boolean): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (visible) return;
      const showTimer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, LOADING_SHOW_DELAY_MS);
      return () => clearTimeout(showTimer);
    }

    // Terminou de carregar: se o indicador nunca apareceu, não há o que esconder.
    if (!visible) return;

    const elapsed = Date.now() - (shownAt.current ?? 0);
    const remaining = LOADING_MIN_VISIBLE_MS - elapsed;
    if (remaining <= 0) {
      shownAt.current = null;
      setVisible(false);
      return;
    }

    const minTimer = setTimeout(() => {
      shownAt.current = null;
      setVisible(false);
    }, remaining);
    return () => clearTimeout(minTimer);
  }, [isLoading, visible]);

  return visible;
}
