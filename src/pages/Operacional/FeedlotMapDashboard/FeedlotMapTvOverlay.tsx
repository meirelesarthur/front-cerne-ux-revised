// src/pages/Operacional/FeedlotMapDashboard/FeedlotMapTvOverlay.tsx
// -----------------------------------------------------------------------------
// Modo TV do Mapa de Confinamento — TASK-FE-042-203, `[[05-front-tela-mapa]]`
// §5. Overlay full-screen na MESMA rota/SPA (`?view=true`, mirror `IG02`,
// aberto via `window.open` em nova aba pela tela normal, `TASK-FE-042-200`).
//
// Mirror `agro365/resources/js/components/FeedlotMap/index.js` (bloco
// `viewMode`): cabeçalho com contador de setor + seletor de intervalo +
// Pausar/Retomar + Fechar; corpo readOnly (drag desabilitado, ações do
// curral mantidas, `C22`/`MM22`). Diferença assumida do plano-mestre
// (`[[05-front-tela-mapa]]` §5, não invenção): em vez de esconder tudo
// exceto o pátio/setor focado (legado), renderiza o board INTEIRO em
// `readOnly` e usa `scrollIntoView({ behavior: 'smooth' })` para levar o
// setor da vez ao centro da tela a cada rotação — mesma experiência de
// "spotlight" rotativo, sem duplicar a árvore de renderização do board.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';

import { Box, Flex, HStack, Icon, NativeSelect, Text } from '@chakra-ui/react';
import { Layers, Pause, Play, RefreshCw, X } from 'lucide-react';

import { Button } from '@/components/Button';

import type { FeedlotYardNode } from '@/@types/v2/FeedlotMap';

import { FeedlotMapBoard } from './FeedlotMapBoard';
import { useFeedlotMapTvRotation } from './useFeedlotMapTvRotation';

import type { FeedlotMapDialogState } from './useFeedlotMapDialogState';

const ROTATION_INTERVAL_OPTIONS = [
  { label: '10s', value: 10 },
  { label: '30s', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
];

interface FeedlotMapTvOverlayProps {
  yards: FeedlotYardNode[];
  isCorralDimmed: (entryDate: string | null, exitDate: string | null) => boolean;
  onOpenDialog: (state: FeedlotMapDialogState) => void;
  /** "Vender Animais" religado (`DEC-FE-MAP-03` superada) — repassado ao `FeedlotMapBoard` interno. */
  onSellAnimals: (corralUuid: string) => void;
  lastUpdatedAt: number | undefined;
  onClose: () => void;
}

export function FeedlotMapTvOverlay({
  yards,
  isCorralDimmed,
  onOpenDialog,
  onSellAnimals,
  lastUpdatedAt,
  onClose,
}: FeedlotMapTvOverlayProps) {
  const sectorUuids = useMemo(
    () => yards.flatMap((yard) => yard.sectors.map((sector) => sector.uuid)),
    [yards]
  );

  const {
    focusedSectorUuid,
    focusedIndex,
    totalSectors,
    isRotating,
    setIsRotating,
    rotationSeconds,
    setRotationSeconds,
  } = useFeedlotMapTvRotation({ sectorUuids, isActive: true });

  const sectorNodeRefs = useRef(new Map<string, HTMLDivElement>());

  function registerSectorRef(uuid: string, el: HTMLDivElement | null) {
    if (el) sectorNodeRefs.current.set(uuid, el);
    else sectorNodeRefs.current.delete(uuid);
  }

  useEffect(() => {
    if (!focusedSectorUuid) return;
    sectorNodeRefs.current.get(focusedSectorUuid)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [focusedSectorUuid]);

  const lastUpdatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Box position="fixed" inset={0} zIndex="overlay" bg="bg" overflowY="auto" p={4}>
      <Flex
        justify="space-between"
        align="center"
        position="sticky"
        top={0}
        bg="bg"
        zIndex={1}
        pb={3}
        borderBottomWidth="1px"
      >
        <Box>
          <Text fontSize="xl" fontWeight="bold">
            Mapa de Confinamento
          </Text>
          <Flex align="center" gap={1} color="fg.muted" fontSize="sm">
            <Icon as={RefreshCw} boxSize="12px" />
            <Text as="span">Atualização automática a cada 5 minutos</Text>
            {lastUpdatedLabel && <Text as="span"> · Última atualização: {lastUpdatedLabel}</Text>}
          </Flex>
        </Box>
        <HStack gap={3}>
          {totalSectors > 1 && (
            <>
              <Flex align="center" gap={1} fontSize="sm">
                <Icon as={Layers} boxSize="14px" />
                <Text as="span">
                  {focusedIndex + 1} / {totalSectors}
                </Text>
              </Flex>
              <NativeSelect.Root size="sm" width="110px">
                <NativeSelect.Field
                  value={rotationSeconds}
                  onChange={(e) => setRotationSeconds(Number(e.target.value))}
                >
                  {ROTATION_INTERVAL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
              <Button
                title={isRotating ? 'Pausar' : 'Retomar'}
                icon={isRotating ? Pause : Play}
                size="sm"
                variant="outline"
                onClick={() => setIsRotating((prev) => !prev)}
              />
            </>
          )}
          <Button title="Fechar" icon={X} size="sm" variant="outline" onClick={onClose} />
        </HStack>
      </Flex>

      <Box mt={4}>
        {yards.length === 0 ? (
          <Text color="fg.muted">Nenhum pátio cadastrado.</Text>
        ) : (
          <FeedlotMapBoard
            yards={yards}
            isCorralDimmed={isCorralDimmed}
            onOpenDialog={onOpenDialog}
            onSellAnimals={onSellAnimals}
            readOnly
            registerSectorRef={registerSectorRef}
          />
        )}
      </Box>
    </Box>
  );
}
