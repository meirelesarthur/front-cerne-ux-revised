// src/hooks/useChartWidth.ts
// -----------------------------------------------------------------------------
// Execução 019 — correção do `SankeyFunnel` (BUG 1: viewBox fixo não ocupava a
// largura real do card). Porta enxuta de `useChartScale` do `cerne`
// (`GB.Cerne.UX/src/hooks/useChartScale.ts@8663490`) — mede a largura real
// renderizada de um wrapper via `ResizeObserver`, para gráficos SVG que casam
// o `viewBox` à largura do container (1 unidade = 1px), evitando que
// `preserveAspectRatio` escale pela altura e deixe margens vazias nas
// laterais quando o card é mais largo (proporcionalmente) que o `viewBox`.
//
// Sem o fator `k` de compensação de fonte do original: neste fork o `viewBox`
// passa a casar exatamente a largura medida (`W = width || FALLBACK_W`), então
// 1 unidade de viewBox já vale 1px real e o `fontSize` sai direto no px do
// token, sem necessidade de escala adicional.
// -----------------------------------------------------------------------------

import { useLayoutEffect, useRef, useState } from 'react';

export function useChartWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}
