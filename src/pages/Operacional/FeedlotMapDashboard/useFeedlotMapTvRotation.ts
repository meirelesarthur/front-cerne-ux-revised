// src/pages/Operacional/FeedlotMapDashboard/useFeedlotMapTvRotation.ts
// Rotação de setor focado do Modo TV — TASK-FE-042-203, `IG04`/`SH04`. Mirror
// `agro365/resources/js/components/FeedlotMap/index.js` (`focusedIdx`/
// `isRotating`/`rotationInterval`, default 30s) — o autoscroll em si (`CSS
// scrollIntoView`, `[[05-front-tela-mapa]]` §5) é disparado pelo consumidor
// (`FeedlotMapTvOverlay`) reagindo à mudança de `focusedSectorUuid`.

import { useEffect, useState } from 'react';

interface UseFeedlotMapTvRotationParams {
  /** Ordem flat de todos os setores da árvore (pátio a pátio), mirror `allSectors`. */
  sectorUuids: string[];
  /** Modo TV ativo (`?view=true`). */
  isActive: boolean;
}

export function useFeedlotMapTvRotation({ sectorUuids, isActive }: UseFeedlotMapTvRotationParams) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [rotationSeconds, setRotationSeconds] = useState(30);

  useEffect(() => {
    if (!isActive) return;
    setFocusedIndex(0);
    setIsRotating(true);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !isRotating || sectorUuids.length <= 1) return;

    const timer = setInterval(() => {
      setFocusedIndex((prev) => (prev + 1) % sectorUuids.length);
    }, rotationSeconds * 1000);

    return () => clearInterval(timer);
  }, [isActive, isRotating, rotationSeconds, sectorUuids.length]);

  const safeIndex = sectorUuids.length > 0 ? focusedIndex % sectorUuids.length : 0;
  const focusedSectorUuid = sectorUuids.length > 0 ? sectorUuids[safeIndex] : null;

  return {
    focusedSectorUuid,
    focusedIndex: safeIndex,
    totalSectors: sectorUuids.length,
    isRotating,
    setIsRotating,
    rotationSeconds,
    setRotationSeconds,
  };
}
