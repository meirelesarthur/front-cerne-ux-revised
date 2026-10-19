// src/pages/Operacional/FeedlotMapDashboard/FeedlotMapBoard.tsx
// -----------------------------------------------------------------------------
// Board espacial de 3 níveis (Pátio → Setor → grade 2D Curral/Rua) — TASK-FE-042-201,
// `[[06-front-estrutura-espacial]]` §2-3. Adaptação do vocabulário visual do
// `EntityBoard` do `ux_root` (cabeçalho de grupo, handle, `Tooltip`, `Badge`)
// para a estrutura REAL de 3 níveis + grade 2D — NÃO é o `EntityBoard`
// genérico (2 níveis, lista flat), mirror `[[05-front-tela-mapa]]` §2.2.
//
// Reorder por arrasto de Pátio/Setor (`AM08/AM09`, TASK-FE-042-202) — HTML5
// DnD nativo (`DEC-FE-MAP-01`, sem lib nova). Simplificação assumida (não é
// redução silenciosa): o legado calcula o índice de inserção pela metade
// vertical do card sob o cursor (`handleSetorDragOverItem`); aqui o `onDrop`
// no card-alvo troca a posição diretamente pelo índice do alvo — mesmo
// RESULTADO final (qualquer ordem alcançável), interação um pouco mais
// simples. Estado otimista local com reversão em erro (`D12`, hardening —
// legado não revertia).
//
// Reorder de COMPONENTES (curral/rua) da grade do Setor — REWORK execução 042
// (task fix-mapa-grid-drag). `DEC-FE-MAP-06` (swap direto curral↔curral)
// SUPERADO: agora mirror COMPLETO de `Setor.js::handleDrop`
// (agro365/resources/js/components/FeedlotMap/Setor.js) — modelo de
// INSERÇÃO (não troca), com os 4 casos do legado:
//   1. Rua V (`betweenColumns`) — reordena TODAS as colunas globalmente.
//   2. Rua H (`betweenLines`/`newLine`) — remove/insere a linha, flatten.
//   3. Curral → nova linha (`betweenLines`/`newLine`) — remove do
//      segmento de origem, cria linha nova, flatten.
//   4. Curral dentro da grade (`lineIndex`+`hoverCol`) — mesma linha (shift
//      de segmento OU compactação ao cruzar rua V, deslocando a rua V +1
//      globalmente se o segmento destino ficar cheio) OU linha diferente
//      (mesma compactação/inserção cross-row).
// `buildFeedlotGrid`/`corralColumns` (`./buildFeedlotGrid.ts`) são o mirror
// 1:1 de `buildGrid()`/`corralColumns()`. `updateIndicator` deduplica o
// indicador de drop (evita re-render a cada `dragover`). Auto-scroll
// horizontal nas bordas do container de currais durante o drag (RAF, zona de
// 80px, 12px/frame) mirror `startAutoScroll()`. Persistência via
// `PUT /feedlot-map/components/reorder` com o array `{uuid, line, column}`
// de TODOS os componentes resultantes (mirror `saveComponentPositions`,
// que sempre envia o snapshot inteiro, não um diff) + estado otimista local
// com reversão em erro.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { Box, Flex, HStack, Icon, IconButton, Text, VStack } from '@chakra-ui/react';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  LayoutGrid,
  PlusCircle,
  Warehouse,
} from 'lucide-react';

import { Button } from '@/components/Button';

import type {
  FeedlotComponentNode,
  FeedlotSectorNode,
  FeedlotYardNode,
} from '@/@types/v2/FeedlotMap';

import { buildFeedlotGrid, corralColumns } from './buildFeedlotGrid';
import { CardCurral } from './CardCurral';
import { StreetSegment } from './StreetSegment';
import { useReorderComponents, useReorderSectors, useReorderYards } from './useFeedlotMapReorder';

import type { FeedlotMapDialogState } from './useFeedlotMapDialogState';

interface FeedlotMapBoardProps {
  yards: FeedlotYardNode[];
  isCorralDimmed: (entryDate: string | null, exitDate: string | null) => boolean;
  onOpenDialog: (state: FeedlotMapDialogState) => void;
  /**
   * "Vender Animais" religado (`DEC-FE-MAP-03` superada) — NAVEGAÇÃO, não
   * diálogo local (mirror `Setor.js::handleSaleAnimals`), por isso fica FORA
   * de `onOpenDialog`/`FeedlotMapDialogState`. Recebe o `uuid` do curral
   * clicado.
   */
  onSellAnimals: (corralUuid: string) => void;
  /** Modo TV (`TASK-FE-042-203`, `C22`/`MM22`) — desabilita SÓ o drag-and-drop; ações do card continuam. */
  readOnly?: boolean;
  /** Modo TV — registra o nó DOM de cada setor para `scrollIntoView` na rotação. */
  registerSectorRef?: (uuid: string, el: HTMLDivElement | null) => void;
}

// Indicador visual de drop — mirror do objeto `dropIndicator` de `Setor.js`.
// Um único shape "solto" (em vez de union discriminada) para poder portar as
// condições do legado quase literalmente.
interface DropIndicator {
  betweenLines?: boolean;
  betweenColumns?: boolean;
  newLine?: boolean;
  lineIndex?: number;
  colIndex?: number;
  hoverCol?: number;
}

interface MutableRow {
  line: number;
  isHorizontalStreet: boolean;
  hStreetComp: FeedlotComponentNode | null;
  corralsByColumn: Record<number, FeedlotComponentNode>;
  orderedCorrals: FeedlotComponentNode[];
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function FeedlotMapBoard({
  yards,
  isCorralDimmed,
  onOpenDialog,
  onSellAnimals,
  readOnly = false,
  registerSectorRef,
}: FeedlotMapBoardProps) {
  const reorderYardsMutation = useReorderYards();

  const [localYards, setLocalYards] = useState(yards);
  useEffect(() => setLocalYards(yards), [yards]);

  const [draggedYardIndex, setDraggedYardIndex] = useState<number | null>(null);

  function handleDropYard(targetIndex: number) {
    if (draggedYardIndex === null || draggedYardIndex === targetIndex) {
      setDraggedYardIndex(null);
      return;
    }
    const snapshot = localYards;
    const reordered = [...localYards];
    const [moved] = reordered.splice(draggedYardIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setLocalYards(reordered);
    setDraggedYardIndex(null);

    const items = reordered.map((yard, index) => ({ uuid: yard.uuid, priority: index + 1 }));
    reorderYardsMutation.mutate(items, { onError: () => setLocalYards(snapshot) });
  }

  return (
    // TASK-063-MAPA2-08 — mirror do padrão fit-content + `ScrollArea` própria
    // que `Table.tsx` já usa desde 2646a8d4 (`ContainerGrid` mudou de
    // `flex:1 1 0%` para `flex:0 1 auto` no `:last-child`/`:last-child >
    // :last-child`, especificidade que vence qualquer `flex="..."` de prop).
    // Raiz "moldura" fit-content: sem `maxH`/`overflow` próprios — é ela quem
    // recebe `flex:'0 1 auto'; minHeight:0` forçados pelo `ContainerGrid`
    // (2º nível), então é comprimida pelo espaço REAL disponível do card, não
    // por um `vh` fixo. A única região de scroll é o `Box` filho (3º nível,
    // fora do alcance da CSS do `ContainerGrid`), com `flex="1" minH={0}
    // overflowY="auto"` — cresce para ocupar a moldura já comprimida e rola
    // internamente quando o conteúdo excede. Scroll horizontal por Setor
    // (abaixo, ~L1091) preservado intocado.
    <Box display="flex" flexDirection="column" minH={0}>
      <Box flex="1" minH={0} overflowY="auto" pr={1}>
        <VStack align="stretch" gap={4}>
          {localYards.map((yard, index) => (
            <FeedlotMapYardRow
              key={yard.uuid}
              yard={yard}
              isCorralDimmed={isCorralDimmed}
              onOpenDialog={onOpenDialog}
              onSellAnimals={onSellAnimals}
              readOnly={readOnly}
              registerSectorRef={registerSectorRef}
              onDragStart={() => setDraggedYardIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropYard(index)}
            />
          ))}
        </VStack>
      </Box>
    </Box>
  );
}

function FeedlotMapYardRow({
  yard,
  isCorralDimmed,
  onOpenDialog,
  onSellAnimals,
  readOnly,
  registerSectorRef,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  yard: FeedlotYardNode;
  isCorralDimmed: FeedlotMapBoardProps['isCorralDimmed'];
  onOpenDialog: FeedlotMapBoardProps['onOpenDialog'];
  onSellAnimals: FeedlotMapBoardProps['onSellAnimals'];
  readOnly?: boolean;
  registerSectorRef?: FeedlotMapBoardProps['registerSectorRef'];
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const reorderSectorsMutation = useReorderSectors();

  const [localSectors, setLocalSectors] = useState(yard.sectors);
  useEffect(() => setLocalSectors(yard.sectors), [yard.sectors]);

  const [draggedSectorIndex, setDraggedSectorIndex] = useState<number | null>(null);

  function handleDropSector(targetIndex: number) {
    if (draggedSectorIndex === null || draggedSectorIndex === targetIndex) {
      setDraggedSectorIndex(null);
      return;
    }
    const snapshot = localSectors;
    const reordered = [...localSectors];
    const [moved] = reordered.splice(draggedSectorIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setLocalSectors(reordered);
    setDraggedSectorIndex(null);

    const items = reordered.map((sector, index) => ({ uuid: sector.uuid, priority: index + 1 }));
    reorderSectorsMutation.mutate(items, { onError: () => setLocalSectors(snapshot) });
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={3}
      onDragOver={!readOnly ? onDragOver : undefined}
      onDrop={!readOnly ? onDrop : undefined}
    >
      <Flex justify="space-between" align="center">
        <Flex
          align="center"
          gap={2}
          cursor={readOnly ? 'default' : 'grab'}
          draggable={!readOnly}
          onDragStart={!readOnly ? onDragStart : undefined}
          onClick={() => onOpenDialog({ kind: 'yard', targetUuid: yard.uuid, mode: 'edit' })}
        >
          {!readOnly && <Icon as={GripVertical} boxSize="14px" color="fg.muted" />}
          <Icon as={Warehouse} boxSize="18px" />
          <Text fontWeight="bold">{yard.name}</Text>
        </Flex>
        <HStack gap={2}>
          {!readOnly && (
            <Button
              title="Novo Setor"
              size="sm"
              variant="outline"
              onClick={() =>
                onOpenDialog({
                  kind: 'sector',
                  yardUuid: yard.uuid,
                  yardName: yard.name,
                  mode: 'create',
                })
              }
            />
          )}
          <IconButton
            aria-label={expanded ? 'Recolher pátio' : 'Expandir pátio'}
            size="sm"
            variant="ghost"
            onClick={() => setExpanded((prev) => !prev)}
          >
            <Icon as={expanded ? ChevronUp : ChevronDown} />
          </IconButton>
        </HStack>
      </Flex>

      {expanded &&
        (localSectors.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" mt={2}>
            Nenhum setor cadastrado.
          </Text>
        ) : (
          <VStack align="stretch" gap={3} mt={3}>
            {localSectors.map((sector, index) => (
              <FeedlotMapSectorRow
                key={sector.uuid}
                sector={sector}
                isCorralDimmed={isCorralDimmed}
                onOpenDialog={onOpenDialog}
                onSellAnimals={onSellAnimals}
                readOnly={readOnly}
                registerSectorRef={registerSectorRef}
                onDragStart={() => setDraggedSectorIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropSector(index)}
              />
            ))}
          </VStack>
        ))}
    </Box>
  );
}

function FeedlotMapSectorRow({
  sector,
  isCorralDimmed,
  onOpenDialog,
  onSellAnimals,
  readOnly,
  registerSectorRef,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  sector: FeedlotSectorNode;
  isCorralDimmed: FeedlotMapBoardProps['isCorralDimmed'];
  onOpenDialog: FeedlotMapBoardProps['onOpenDialog'];
  onSellAnimals: FeedlotMapBoardProps['onSellAnimals'];
  readOnly?: boolean;
  registerSectorRef?: FeedlotMapBoardProps['registerSectorRef'];
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const reorderComponentsMutation = useReorderComponents();

  // Estado otimista local dos componentes (curral/rua) do Setor — mesmo
  // padrão de `localYards`/`localSectors` acima (`D12`, reversão em erro).
  const [localComponents, setLocalComponents] = useState(sector.components);
  useEffect(() => setLocalComponents(sector.components), [sector.components]);

  const grid = useMemo(() => buildFeedlotGrid(localComponents), [localComponents]);
  const cCols = useMemo(
    () => corralColumns(grid.allColumns, grid.vStreetColumns),
    [grid.allColumns, grid.vStreetColumns]
  );

  // Fonte arrastada (ref — sem re-render, mirror `dragItem.current` do
  // legado) + indicador de drop (state, dispara re-render SÓ quando muda de
  // fato — `updateIndicator` dedup).
  const dragItem = useRef<FeedlotComponentNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const dropIndicatorRef = useRef<DropIndicator | null>(null);

  // Container horizontal-scroll dos currais do setor (`corralsRef`) — alvo
  // do auto-scroll de borda durante o drag.
  const corralsRef = useRef<HTMLDivElement | null>(null);
  const dragClientX = useRef(0);
  const autoScrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = corralsRef.current;
    if (!el) return;
    const track = (e: DragEvent) => {
      dragClientX.current = e.clientX;
    };
    el.addEventListener('dragover', track, true);
    return () => el.removeEventListener('dragover', track, true);
  }, []);

  function startAutoScroll() {
    const loop = () => {
      if (!dragItem.current || !corralsRef.current) {
        autoScrollRafRef.current = null;
        return;
      }
      const el = corralsRef.current;
      const rect = el.getBoundingClientRect();
      const x = dragClientX.current;
      const edgeSize = 80;
      const speed = 12;
      if (x < rect.left + edgeSize) {
        el.scrollLeft = Math.max(0, el.scrollLeft - speed);
      } else if (x > rect.right - edgeSize) {
        el.scrollLeft += speed;
      }
      autoScrollRafRef.current = requestAnimationFrame(loop);
    };
    autoScrollRafRef.current = requestAnimationFrame(loop);
  }

  function stopAutoScroll() {
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }

  function updateIndicator(value: DropIndicator | null) {
    const prev = dropIndicatorRef.current;
    if (prev === value) return;
    if (!prev && !value) return;
    if (
      prev &&
      value &&
      prev.betweenLines &&
      value.betweenLines &&
      prev.lineIndex === value.lineIndex
    )
      return;
    if (
      prev &&
      value &&
      prev.betweenColumns &&
      value.betweenColumns &&
      prev.colIndex === value.colIndex
    )
      return;
    if (
      prev &&
      value &&
      !prev.newLine &&
      !prev.betweenLines &&
      !prev.betweenColumns &&
      !value.newLine &&
      !value.betweenLines &&
      !value.betweenColumns &&
      prev.lineIndex === value.lineIndex &&
      prev.colIndex === value.colIndex &&
      prev.hoverCol === value.hoverCol
    )
      return;
    if (prev && value && prev.newLine && value.newLine) return;
    dropIndicatorRef.current = value;
    setDropIndicator(value);
  }

  function sourceIsVStreet(item: FeedlotComponentNode | null): boolean {
    return !!item && item.type === 'street' && item.street?.orientation === 'V';
  }
  function sourceIsHStreet(item: FeedlotComponentNode | null): boolean {
    return !!item && item.type === 'street' && item.street?.orientation !== 'V';
  }

  function handleBetweenLinesDragOver(e: React.DragEvent, lineIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!dragItem.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertLineIndex = e.clientY < midY ? lineIndex : lineIndex + 1;

    const draggedUuid = dragItem.current.uuid;
    const srcRowIdx = grid.rows.findIndex(
      (row) =>
        !row.isHorizontalStreet &&
        Object.keys(row.corralsByColumn).length === 1 &&
        Object.values(row.corralsByColumn).some((c) => c.uuid === draggedUuid)
    );
    if (srcRowIdx >= 0 && (insertLineIndex === srcRowIdx || insertLineIndex === srcRowIdx + 1)) {
      updateIndicator(null);
      return;
    }

    updateIndicator({ betweenLines: true, lineIndex: insertLineIndex });
  }

  // colIndex = índice 0-based em `grid.allColumns` onde a rua V deve ser inserida
  function handleBetweenColumnsDragOver(e: React.DragEvent, colIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!dragItem.current) return;
    updateIndicator({ betweenColumns: true, colIndex });
  }

  function handleDragStart(component: FeedlotComponentNode) {
    return (e: React.DragEvent) => {
      e.stopPropagation();
      dragItem.current = component;
      setIsDragging(true);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData(
        'text/plain',
        JSON.stringify({ type: 'component', uuid: component.uuid, sectorUuid: sector.uuid })
      );
      startAutoScroll();
    };
  }

  function handleDragEnd() {
    dragItem.current = null;
    setIsDragging(false);
    updateIndicator(null);
    stopAutoScroll();
  }

  // colIndex = índice 0-based em `grid.allColumns` desta célula
  function handleCardDragOver(compUuid: string | null, lineIndex: number, colIdx: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';

      if (!dragItem.current || dragItem.current.uuid === compUuid) return;

      if (sourceIsHStreet(dragItem.current)) {
        handleBetweenLinesDragOver(e, lineIndex);
        return;
      }
      if (sourceIsVStreet(dragItem.current)) {
        const rect = e.currentTarget.getBoundingClientRect();
        const insertColIndex = e.clientX < rect.left + rect.width / 2 ? colIdx : colIdx + 1;
        handleBetweenColumnsDragOver(e, insertColIndex);
        return;
      }

      // Drag de curral.
      const rect = e.currentTarget.getBoundingClientRect();
      const isLeftHalf = e.clientX < rect.left + rect.width / 2;
      const insertColIndex = isLeftHalf ? colIdx : colIdx + 1;
      const hoverCol = grid.allColumns[colIdx];

      const draggedUuid = dragItem.current.uuid;
      const sourceCol = dragItem.current.column;
      const sourceColIdx = grid.allColumns.indexOf(sourceCol);
      const currentRow = grid.rows[lineIndex];
      const sourceIsOnSameRow =
        !!currentRow &&
        !currentRow.isHorizontalStreet &&
        Object.values(currentRow.corralsByColumn).some((c) => c.uuid === draggedUuid);
      if (
        sourceIsOnSameRow &&
        sourceColIdx >= 0 &&
        (insertColIndex === sourceColIdx || insertColIndex === sourceColIdx + 1)
      ) {
        updateIndicator(null);
        return;
      }

      updateIndicator({ lineIndex, colIndex: insertColIndex, hoverCol });
    };
  }

  // lineIndex = índice em `grid.rows`; trailingColIndex = `grid.allColumns.length`
  function handleLineDragOver(lineIndex: number, trailingColIndex: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (!dragItem.current) return;

      if (sourceIsHStreet(dragItem.current)) {
        handleBetweenLinesDragOver(e, lineIndex);
        return;
      }
      if (sourceIsVStreet(dragItem.current)) {
        handleBetweenColumnsDragOver(e, trailingColIndex);
        return;
      }

      const maxAllCol = grid.allColumns.length > 0 ? Math.max(...grid.allColumns) : 0;
      updateIndicator({ lineIndex, colIndex: trailingColIndex, hoverCol: maxAllCol + 1 });
    };
  }

  function handleNewLineDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!dragItem.current) return;
    if (sourceIsVStreet(dragItem.current)) return;
    updateIndicator({ newLine: true });
  }

  function handleContainerDragOver(e: React.DragEvent) {
    if (!dragItem.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleContainerDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      updateIndicator(null);
    }
  }

  function commit(newComponents: FeedlotComponentNode[]) {
    const snapshot = localComponents;
    setLocalComponents(newComponents);
    const items = newComponents.map((c) => ({ uuid: c.uuid, line: c.line, column: c.column }));
    reorderComponentsMutation.mutate(items, { onError: () => setLocalComponents(snapshot) });
    updateIndicator(null);
    dragItem.current = null;
    setIsDragging(false);
  }

  // Reconstrução inversa de `mutableRows` (cada uma com `orderedCorrals`)
  // para o array flat — mirror `flattenMutableRows` de `Setor.js`. Ruas V
  // mantêm suas colunas originais; ruas H recebem `column = 0`; corrais
  // recebem `cCols[slotIdx]` (colunas reais de curral) ou colunas de
  // overflow além do máximo.
  function flattenMutableRows(
    mutableRows: MutableRow[],
    vStreetByColumn: Record<number, FeedlotComponentNode>,
    maxAllCol: number
  ): FeedlotComponentNode[] {
    const result: FeedlotComponentNode[] = [];
    Object.values(vStreetByColumn).forEach((comp) => {
      result.push({ ...comp, line: 0, column: comp.column });
    });
    mutableRows.forEach((row, rowIdx) => {
      const lineNum = rowIdx + 1;
      if (row.isHorizontalStreet && row.hStreetComp) {
        result.push({ ...row.hStreetComp, line: lineNum, column: 0 });
      }
      row.orderedCorrals.forEach((comp, slotIdx) => {
        const col =
          slotIdx < cCols.length ? cCols[slotIdx] : maxAllCol + (slotIdx - cCols.length + 1);
        result.push({ ...comp, line: lineNum, column: col });
      });
    });
    return result;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (readOnly) return;

    const source = dragItem.current;
    const indicator = dropIndicatorRef.current;
    if (!source || !indicator) return;

    let raw: { type?: string; uuid?: string; sectorUuid?: string };
    try {
      raw = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return;
    }
    if (raw.type !== 'component' || raw.sectorUuid !== sector.uuid) return;

    const isVStreetComp = sourceIsVStreet(source);
    const isHStreetComp = sourceIsHStreet(source);

    const { rows, allColumns, vStreetByColumn, vStreetColumns } = grid;
    const maxAllCol = allColumns.length > 0 ? Math.max(...allColumns) : 0;

    // ── Rua V: reordena colunas globalmente ──────────────────────────────
    if (isVStreetComp && indicator.betweenColumns) {
      const sourceCol = source.column;
      const otherCols = allColumns.filter((c) => c !== sourceCol);
      let insertAt = 0;
      for (let i = 0; i < (indicator.colIndex ?? 0); i++) {
        if (allColumns[i] !== sourceCol) insertAt++;
      }
      insertAt = Math.max(0, Math.min(insertAt, otherCols.length));
      const newOrder = [...otherCols];
      newOrder.splice(insertAt, 0, sourceCol);
      const colMap: Record<number, number> = {};
      newOrder.forEach((oldCol, idx) => {
        colMap[oldCol] = idx + 1;
      });
      commit(
        localComponents.map((comp) => {
          if (comp.column === 0) return comp; // Rua H permanece
          return {
            ...comp,
            column: colMap[comp.column] !== undefined ? colMap[comp.column] : comp.column,
          };
        })
      );
      return;
    }

    // ── Rua H: reordena linhas ────────────────────────────────────────────
    if (isHStreetComp && (indicator.betweenLines || indicator.newLine)) {
      const srcRowIdx = rows.findIndex(
        (row) =>
          row.isHorizontalStreet &&
          row.hStreetComponent &&
          row.hStreetComponent.uuid === source.uuid
      );
      const mutableRows: MutableRow[] = rows
        .filter(
          (row) =>
            !(
              row.isHorizontalStreet &&
              row.hStreetComponent &&
              row.hStreetComponent.uuid === source.uuid
            )
        )
        .map((row) => ({
          line: row.line,
          isHorizontalStreet: row.isHorizontalStreet,
          hStreetComp: row.hStreetComponent,
          corralsByColumn: row.corralsByColumn,
          orderedCorrals: cCols.map((col) => row.corralsByColumn[col]).filter(isDefined),
        }));
      if (indicator.newLine) {
        mutableRows.push({
          line: 0,
          isHorizontalStreet: true,
          hStreetComp: source,
          corralsByColumn: {},
          orderedCorrals: [],
        });
      } else {
        let insertAt = indicator.lineIndex ?? 0;
        if (srcRowIdx >= 0 && srcRowIdx < insertAt) insertAt--;
        insertAt = Math.max(0, Math.min(insertAt, mutableRows.length));
        mutableRows.splice(insertAt, 0, {
          line: 0,
          isHorizontalStreet: true,
          hStreetComp: source,
          corralsByColumn: {},
          orderedCorrals: [],
        });
      }
      commit(flattenMutableRows(mutableRows, vStreetByColumn, maxAllCol));
      return;
    }

    // ── Curral: move para NOVA LINHA (betweenLines / newLine) ────────────
    if (!isVStreetComp && !isHStreetComp && (indicator.betweenLines || indicator.newLine)) {
      const srcRowIdx = rows.findIndex(
        (row) =>
          !row.isHorizontalStreet &&
          Object.values(row.corralsByColumn).some((c) => c.uuid === source.uuid)
      );
      const mutableRows: MutableRow[] = rows
        .map((row) => ({
          line: row.line,
          isHorizontalStreet: row.isHorizontalStreet,
          hStreetComp: row.hStreetComponent,
          corralsByColumn: row.corralsByColumn,
          orderedCorrals: cCols.map((col) => row.corralsByColumn[col]).filter(isDefined),
        }))
        .map((row) => ({
          ...row,
          orderedCorrals: row.orderedCorrals.filter((c) => c.uuid !== source.uuid),
        }))
        .filter((row) => row.isHorizontalStreet || row.orderedCorrals.length > 0);
      if (indicator.newLine) {
        mutableRows.push({
          line: 0,
          isHorizontalStreet: false,
          hStreetComp: null,
          corralsByColumn: {},
          orderedCorrals: [source],
        });
      } else {
        let insertAt = indicator.lineIndex ?? 0;
        if (srcRowIdx >= 0 && srcRowIdx < insertAt) insertAt--;
        insertAt = Math.max(0, Math.min(insertAt, mutableRows.length));
        mutableRows.splice(insertAt, 0, {
          line: 0,
          isHorizontalStreet: false,
          hStreetComp: null,
          corralsByColumn: {},
          orderedCorrals: [source],
        });
      }
      commit(flattenMutableRows(mutableRows, vStreetByColumn, maxAllCol));
      return;
    }

    // ── Curral: reposiciona dentro da grade (mesma linha ou cross-row) ───
    if (
      !isVStreetComp &&
      !isHStreetComp &&
      indicator.lineIndex !== undefined &&
      indicator.hoverCol !== undefined
    ) {
      const targetRowData = rows[indicator.lineIndex];
      if (!targetRowData || targetRowData.isHorizontalStreet) return;

      const sourceCol = source.column;
      const sourceRowIdx = rows.findIndex(
        (row) =>
          !row.isHorizontalStreet &&
          row.corralsByColumn[sourceCol] &&
          row.corralsByColumn[sourceCol].uuid === source.uuid
      );
      const sourceRow = sourceRowIdx >= 0 ? rows[sourceRowIdx] : null;

      // Resolve a coluna alvo — trata hover sobre célula de rua V.
      let targetCol = indicator.hoverCol;
      if (vStreetColumns.has(targetCol)) {
        const hoverColIdxInAll = allColumns.indexOf(targetCol);
        const insertBefore = (indicator.colIndex ?? 0) <= hoverColIdxInAll;
        let found = false;
        if (insertBefore) {
          for (let i = hoverColIdxInAll - 1; i >= 0; i--) {
            if (!vStreetColumns.has(allColumns[i])) {
              targetCol = allColumns[i];
              found = true;
              break;
            }
          }
        } else {
          for (let i = hoverColIdxInAll + 1; i < allColumns.length; i++) {
            if (!vStreetColumns.has(allColumns[i])) {
              targetCol = allColumns[i];
              found = true;
              break;
            }
          }
          if (!found) {
            targetCol = maxAllCol + 1;
            found = true;
          }
        }
        if (!found) return;
      }

      // No-op: mesma posição.
      if (sourceRow && sourceRow.line === targetRowData.line && sourceCol === targetCol) {
        updateIndicator(null);
        return;
      }

      const isSameRow = !!sourceRow && sourceRow.line === targetRowData.line;

      if (isSameRow && sourceRow) {
        const sourceColIdxInAll = allColumns.indexOf(sourceCol);
        const insertColIdx = indicator.colIndex ?? 0;

        // Verifica se o arrasto cruza alguma fronteira de rua V.
        const crossesV = [...vStreetColumns].some((vc) => {
          const vIdx = allColumns.indexOf(vc);
          return (
            (sourceColIdxInAll < vIdx && insertColIdx > vIdx) ||
            (sourceColIdxInAll > vIdx && insertColIdx <= vIdx)
          );
        });

        if (crossesV) {
          const sortedVColsArr = [...vStreetColumns].sort((a, b) => a - b);
          const srcLeftBound = sortedVColsArr
            .filter((vc) => vc < sourceCol)
            .reduce((mx, vc) => Math.max(mx, vc), 0);
          const srcRightBound = sortedVColsArr
            .filter((vc) => vc > sourceCol)
            .reduce((mn, vc) => Math.min(mn, vc), Infinity);
          const srcSegmentCCols = cCols.filter((c) => c > srcLeftBound && c < srcRightBound);
          const srcCorralsWithoutSource = srcSegmentCCols
            .map((c) => sourceRow.corralsByColumn[c])
            .filter(isDefined)
            .filter((c) => c.uuid !== source.uuid);
          const srcColMap: Record<string, number> = {};
          srcCorralsWithoutSource.forEach((comp, idx) => {
            srcColMap[comp.uuid] = srcSegmentCCols[idx];
          });

          const tgtLeftBound = sortedVColsArr
            .filter((vc) => vc < targetCol)
            .reduce((mx, vc) => Math.max(mx, vc), 0);
          const tgtRightBound = sortedVColsArr
            .filter((vc) => vc > targetCol)
            .reduce((mn, vc) => Math.min(mn, vc), Infinity);
          const tgtSegmentCCols = cCols.filter((c) => c > tgtLeftBound && c < tgtRightBound);
          let tgtInsertSlot = 0;
          for (let i = 0; i < insertColIdx; i++) {
            const col = allColumns[i];
            if (!vStreetColumns.has(col) && col > tgtLeftBound && col < tgtRightBound)
              tgtInsertSlot++;
          }
          const tgtSegmentCorrals = tgtSegmentCCols
            .map((c) => targetRowData.corralsByColumn[c])
            .filter(isDefined);
          tgtInsertSlot = Math.max(0, Math.min(tgtInsertSlot, tgtSegmentCorrals.length));
          const tgtSegmentWithSource = [...tgtSegmentCorrals];
          tgtSegmentWithSource.splice(tgtInsertSlot, 0, source);

          const overflowsSegment = tgtSegmentWithSource.length > tgtSegmentCCols.length;
          const globalShiftCol =
            overflowsSegment && tgtRightBound !== Infinity ? tgtRightBound : Infinity;
          const tgtColMap: Record<string, number> = {};
          if (overflowsSegment && tgtRightBound !== Infinity) {
            const extendedCCols = [...tgtSegmentCCols, tgtRightBound];
            tgtSegmentWithSource.forEach((comp, idx) => {
              tgtColMap[comp.uuid] = extendedCCols[idx];
            });
          } else {
            tgtSegmentWithSource.forEach((comp, idx) => {
              tgtColMap[comp.uuid] =
                idx < tgtSegmentCCols.length
                  ? tgtSegmentCCols[idx]
                  : maxAllCol + (idx - tgtSegmentCCols.length + 1);
            });
          }

          commit(
            localComponents.map((comp) => {
              if (comp.uuid === source.uuid) {
                return { ...comp, line: targetRowData.line, column: tgtColMap[source.uuid] };
              }
              const lineVal = comp.line;
              const colVal = comp.column;
              if (lineVal === targetRowData.line && tgtColMap[comp.uuid] !== undefined) {
                return { ...comp, column: tgtColMap[comp.uuid] };
              }
              let effectiveCol = colVal;
              if (lineVal === sourceRow.line && srcColMap[comp.uuid] !== undefined) {
                effectiveCol = srcColMap[comp.uuid];
              }
              if (effectiveCol >= globalShiftCol) return { ...comp, column: effectiveCol + 1 };
              if (effectiveCol !== colVal) return { ...comp, column: effectiveCol };
              return comp;
            })
          );
        } else {
          // Mesmo lado de todas as ruas V: SHIFT dentro do segmento.
          const sortedVCols = [...vStreetColumns].sort((a, b) => a - b);
          const leftBound = sortedVCols
            .filter((vc) => vc < sourceCol)
            .reduce((mx, vc) => Math.max(mx, vc), 0);
          const rightBound = sortedVCols
            .filter((vc) => vc > sourceCol)
            .reduce((mn, vc) => Math.min(mn, vc), Infinity);

          const segmentCCols = cCols.filter((c) => c > leftBound && c < rightBound);
          const orderedOnSegment = segmentCCols
            .map((c) => sourceRow.corralsByColumn[c])
            .filter(isDefined);
          const withoutSource = orderedOnSegment.filter((c) => c.uuid !== source.uuid);

          let insertSlot = 0;
          for (let i = 0; i < insertColIdx; i++) {
            const col = allColumns[i];
            if (!vStreetColumns.has(col) && col > leftBound && col < rightBound) insertSlot++;
          }
          const srcSlot = orderedOnSegment.findIndex((c) => c.uuid === source.uuid);
          if (srcSlot >= 0 && srcSlot < insertSlot) insertSlot--;
          insertSlot = Math.max(0, Math.min(insertSlot, withoutSource.length));
          withoutSource.splice(insertSlot, 0, source);

          const segColMap: Record<string, number> = {};
          withoutSource.forEach((c, idx) => {
            segColMap[c.uuid] =
              idx < segmentCCols.length
                ? segmentCCols[idx]
                : maxAllCol + (idx - segmentCCols.length + 1);
          });

          commit(
            localComponents.map((comp) => {
              if (comp.line === 0 || comp.column === 0) return comp;
              if (comp.line === sourceRow.line && segColMap[comp.uuid] !== undefined) {
                return { ...comp, column: segColMap[comp.uuid] };
              }
              return comp;
            })
          );
        }
      } else {
        // Drop cross-row: compacta o segmento de origem, insere no segmento
        // destino; se o destino ficar cheio, desloca a rua V direita +1
        // globalmente.
        const sortedVColsArr = [...vStreetColumns].sort((a, b) => a - b);

        const srcLeftBound = sortedVColsArr
          .filter((vc) => vc < sourceCol)
          .reduce((mx, vc) => Math.max(mx, vc), 0);
        const srcRightBound = sortedVColsArr
          .filter((vc) => vc > sourceCol)
          .reduce((mn, vc) => Math.min(mn, vc), Infinity);
        const srcSegmentCCols = cCols.filter((c) => c > srcLeftBound && c < srcRightBound);
        const srcCorralsWithoutSource = sourceRow
          ? srcSegmentCCols
              .map((c) => sourceRow.corralsByColumn[c])
              .filter(isDefined)
              .filter((c) => c.uuid !== source.uuid)
          : [];
        const srcColMap: Record<string, number> = {};
        srcCorralsWithoutSource.forEach((comp, idx) => {
          srcColMap[comp.uuid] = srcSegmentCCols[idx];
        });

        const tgtLeftBound = sortedVColsArr
          .filter((vc) => vc < targetCol)
          .reduce((mx, vc) => Math.max(mx, vc), 0);
        const tgtRightBound = sortedVColsArr
          .filter((vc) => vc > targetCol)
          .reduce((mn, vc) => Math.min(mn, vc), Infinity);
        const tgtSegmentCCols = cCols.filter((c) => c > tgtLeftBound && c < tgtRightBound);
        let tgtInsertSlot = 0;
        for (let i = 0; i < (indicator.colIndex ?? 0); i++) {
          const col = allColumns[i];
          if (!vStreetColumns.has(col) && col > tgtLeftBound && col < tgtRightBound)
            tgtInsertSlot++;
        }
        const tgtSegmentCorrals = tgtSegmentCCols
          .map((c) => targetRowData.corralsByColumn[c])
          .filter(isDefined);
        tgtInsertSlot = Math.max(0, Math.min(tgtInsertSlot, tgtSegmentCorrals.length));
        const tgtSegmentWithSource = [...tgtSegmentCorrals];
        tgtSegmentWithSource.splice(tgtInsertSlot, 0, source);

        const overflowsSegment = tgtSegmentWithSource.length > tgtSegmentCCols.length;
        const globalShiftCol =
          overflowsSegment && tgtRightBound !== Infinity ? tgtRightBound : Infinity;
        const tgtColMap: Record<string, number> = {};
        if (overflowsSegment && tgtRightBound !== Infinity) {
          const extendedCCols = [...tgtSegmentCCols, tgtRightBound];
          tgtSegmentWithSource.forEach((comp, idx) => {
            tgtColMap[comp.uuid] = extendedCCols[idx];
          });
        } else {
          tgtSegmentWithSource.forEach((comp, idx) => {
            tgtColMap[comp.uuid] =
              idx < tgtSegmentCCols.length
                ? tgtSegmentCCols[idx]
                : maxAllCol + (idx - tgtSegmentCCols.length + 1);
          });
        }

        commit(
          localComponents.map((comp) => {
            if (comp.uuid === source.uuid) {
              return { ...comp, line: targetRowData.line, column: tgtColMap[source.uuid] };
            }
            const lineVal = comp.line;
            const colVal = comp.column;
            if (lineVal === targetRowData.line && tgtColMap[comp.uuid] !== undefined) {
              return { ...comp, column: tgtColMap[comp.uuid] };
            }
            let effectiveCol = colVal;
            if (sourceRow && lineVal === sourceRow.line && srcColMap[comp.uuid] !== undefined) {
              effectiveCol = srcColMap[comp.uuid];
            }
            if (effectiveCol >= globalShiftCol) return { ...comp, column: effectiveCol + 1 };
            if (effectiveCol !== colVal) return { ...comp, column: effectiveCol };
            return comp;
          })
        );
      }
    }
  }

  const isDraggingVStreet = isDragging && sourceIsVStreet(dragItem.current);

  return (
    <Box
      ref={(el: HTMLDivElement | null) => registerSectorRef?.(sector.uuid, el)}
      borderWidth="1px"
      borderRadius="md"
      p={2}
      bg="bg.subtle"
      onDragOver={!readOnly ? onDragOver : undefined}
      onDrop={!readOnly ? onDrop : undefined}
    >
      <Flex justify="space-between" align="center">
        <Flex
          align="center"
          gap={2}
          cursor={readOnly ? 'default' : 'grab'}
          draggable={!readOnly}
          onDragStart={!readOnly ? onDragStart : undefined}
          onClick={() => onOpenDialog({ kind: 'sector', targetUuid: sector.uuid, mode: 'edit' })}
        >
          {!readOnly && <Icon as={GripVertical} boxSize="12px" color="fg.muted" />}
          <Icon as={LayoutGrid} boxSize="16px" />
          <Text fontWeight="medium">{sector.name}</Text>
        </Flex>
        <HStack gap={2}>
          {!readOnly && (
            <>
              <Button
                title="Novo Curral"
                size="xs"
                variant="outline"
                onClick={() =>
                  onOpenDialog({
                    kind: 'corral',
                    sectorUuid: sector.uuid,
                    sectorName: sector.name,
                    mode: 'create',
                  })
                }
              />
              <Button
                title="Nova Rua"
                size="xs"
                variant="outline"
                onClick={() =>
                  onOpenDialog({
                    kind: 'street',
                    sectorUuid: sector.uuid,
                    sectorName: sector.name,
                    mode: 'create',
                  })
                }
              />
            </>
          )}
          <IconButton
            aria-label={expanded ? 'Recolher setor' : 'Expandir setor'}
            size="xs"
            variant="ghost"
            onClick={() => setExpanded((prev) => !prev)}
          >
            <Icon as={expanded ? ChevronUp : ChevronDown} />
          </IconButton>
        </HStack>
      </Flex>

      {expanded &&
        (localComponents.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" mt={2}>
            Nenhum componente cadastrado.
          </Text>
        ) : (
          // `.feedlot-corrals { overflow-x: auto; overflow-y: visible }` do
          // legado — scroll HORIZONTAL do setor, mirror exato.
          <Box
            ref={corralsRef}
            mt={2}
            overflowX="auto"
            overflowY="visible"
            onDragOver={!readOnly ? handleContainerDragOver : undefined}
            onDrop={!readOnly ? handleDrop : undefined}
            onDragLeave={!readOnly ? handleContainerDragLeave : undefined}
          >
            <VStack align="stretch" gap={1} minW="fit-content">
              {grid.rows.map((row, lineIndex) => {
                if (row.isHorizontalStreet && row.hStreetComponent?.street) {
                  const hComponent = row.hStreetComponent;
                  const street = hComponent.street;
                  if (!street) return null;
                  return (
                    <Box key={`h-${hComponent.uuid}`}>
                      {dropIndicator?.betweenLines && dropIndicator.lineIndex === lineIndex && (
                        <Box h="3px" bg="brandColorText" borderRadius="full" my={1} />
                      )}
                      <Flex
                        align="center"
                        gap={2}
                        minH="32px"
                        draggable={!readOnly}
                        cursor={readOnly ? 'default' : 'grab'}
                        css={{ userSelect: 'none' }}
                        onDragStart={!readOnly ? handleDragStart(hComponent) : undefined}
                        onDragOver={
                          !readOnly ? (e) => handleBetweenLinesDragOver(e, lineIndex) : undefined
                        }
                        onDragEnd={!readOnly ? handleDragEnd : undefined}
                        onDrop={!readOnly ? handleDrop : undefined}
                        opacity={dragItem.current?.uuid === hComponent.uuid && isDragging ? 0.4 : 1}
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="medium"
                          color="fg.muted"
                          flexShrink={0}
                          cursor="pointer"
                          onClick={() =>
                            onOpenDialog({
                              kind: 'street',
                              targetUuid: street.uuid,
                              sectorUuid: sector.uuid,
                              mode: 'edit',
                              streetDescription: street.description,
                              streetOrientation: street.orientation,
                            })
                          }
                        >
                          {street.description}
                        </Text>
                        <Box
                          flex="1"
                          borderTopWidth="2px"
                          borderStyle="dashed"
                          borderColor="border.emphasized"
                        />
                      </Flex>
                    </Box>
                  );
                }

                return (
                  <Box key={`line-${row.line}`}>
                    {dropIndicator?.betweenLines && dropIndicator.lineIndex === lineIndex && (
                      <Box h="3px" bg="brandColorText" borderRadius="full" my={1} />
                    )}
                    <Flex
                      gap={1}
                      onDragOver={
                        !readOnly
                          ? handleLineDragOver(lineIndex, grid.allColumns.length)
                          : undefined
                      }
                      onDrop={!readOnly ? handleDrop : undefined}
                    >
                      {grid.allColumns.map((column, colIdx) => {
                        if (grid.vStreetColumns.has(column)) {
                          const vComponent = grid.vStreetByColumn[column];
                          if (!vComponent.street) return null;
                          const showBetweenColPlaceholder =
                            isDraggingVStreet &&
                            dropIndicator?.betweenColumns &&
                            dropIndicator.colIndex === colIdx;
                          const showCellPlaceholder =
                            dropIndicator &&
                            !dropIndicator.betweenColumns &&
                            !dropIndicator.betweenLines &&
                            !dropIndicator.newLine &&
                            dropIndicator.lineIndex === lineIndex &&
                            dropIndicator.colIndex === colIdx;
                          return (
                            <Flex key={`vcol-${column}-${row.line}`} gap={1} align="stretch">
                              {(showBetweenColPlaceholder || showCellPlaceholder) && (
                                <Box
                                  w="3px"
                                  bg="brandColorText"
                                  borderRadius="full"
                                  alignSelf="stretch"
                                />
                              )}
                              <StreetSegment
                                street={vComponent.street}
                                draggable={!readOnly}
                                isDragging={
                                  isDragging && dragItem.current?.uuid === vComponent.uuid
                                }
                                onDragStart={!readOnly ? handleDragStart(vComponent) : undefined}
                                onDragOver={
                                  !readOnly
                                    ? handleCardDragOver(null, lineIndex, colIdx)
                                    : undefined
                                }
                                onDragEnd={!readOnly ? handleDragEnd : undefined}
                                onDrop={!readOnly ? handleDrop : undefined}
                                onEdit={() =>
                                  onOpenDialog({
                                    kind: 'street',
                                    targetUuid: vComponent.street?.uuid,
                                    sectorUuid: sector.uuid,
                                    mode: 'edit',
                                    streetDescription: vComponent.street?.description,
                                    streetOrientation: vComponent.street?.orientation,
                                  })
                                }
                              />
                            </Flex>
                          );
                        }

                        const component = row.corralsByColumn[column];
                        const showCellPlaceholder =
                          dropIndicator &&
                          !dropIndicator.newLine &&
                          !dropIndicator.betweenLines &&
                          !dropIndicator.betweenColumns &&
                          dropIndicator.lineIndex === lineIndex &&
                          dropIndicator.colIndex === colIdx;

                        return (
                          <Flex key={`cell-${column}`} gap={1} align="stretch">
                            {showCellPlaceholder && (
                              <Box
                                w="3px"
                                bg="brandColorText"
                                borderRadius="full"
                                alignSelf="stretch"
                              />
                            )}
                            {component?.corral ? (
                              <CardCurral
                                corral={component.corral}
                                isDimmed={isCorralDimmed(
                                  component.corral.entry_date,
                                  component.corral.exit_date
                                )}
                                draggable={!readOnly}
                                isDragging={isDragging && dragItem.current?.uuid === component.uuid}
                                onDragStart={!readOnly ? handleDragStart(component) : undefined}
                                onDragOver={
                                  !readOnly
                                    ? handleCardDragOver(component.uuid, lineIndex, colIdx)
                                    : undefined
                                }
                                onDragEnd={!readOnly ? handleDragEnd : undefined}
                                onDrop={!readOnly ? handleDrop : undefined}
                                onEdit={() =>
                                  onOpenDialog({
                                    kind: 'corral',
                                    targetUuid: component.corral!.uuid,
                                    mode: 'edit',
                                  })
                                }
                                onChangeStatus={() =>
                                  onOpenDialog({
                                    kind: 'status',
                                    targetUuid: component.corral!.uuid,
                                    corralData: component.corral!,
                                  })
                                }
                                onDuplicate={() =>
                                  onOpenDialog({
                                    kind: 'corral',
                                    targetUuid: component.corral!.uuid,
                                    sectorUuid: sector.uuid,
                                    mode: 'duplicate',
                                  })
                                }
                                onManageBatches={() =>
                                  onOpenDialog({
                                    kind: 'lotes',
                                    targetUuid: component.corral!.uuid,
                                    corralData: component.corral!,
                                  })
                                }
                                onTransferBatch={() =>
                                  onOpenDialog({
                                    kind: 'transfer',
                                    targetUuid: component.corral!.uuid,
                                    corralData: component.corral!,
                                  })
                                }
                                onUpdateDates={() =>
                                  onOpenDialog({
                                    kind: 'dates',
                                    targetUuid: component.corral!.uuid,
                                    corralData: component.corral!,
                                  })
                                }
                                onChangeDiet={() =>
                                  onOpenDialog({
                                    kind: 'diet',
                                    targetUuid: component.corral!.uuid,
                                    corralData: component.corral!,
                                  })
                                }
                                onWeighing={() =>
                                  onOpenDialog({
                                    kind: 'weighing',
                                    targetUuid: component.corral!.uuid,
                                    corralData: component.corral!,
                                  })
                                }
                                onSanitary={() =>
                                  onOpenDialog({
                                    kind: 'sanitary',
                                    targetUuid: component.corral!.uuid,
                                    corralData: component.corral!,
                                  })
                                }
                                onSellAnimals={() => onSellAnimals(component.corral!.uuid)}
                                onDeath={() =>
                                  onOpenDialog({
                                    kind: 'death',
                                    targetUuid: component.corral!.uuid,
                                    corralData: component.corral!,
                                  })
                                }
                              />
                            ) : (
                              <Box
                                width="200px"
                                minH="150px"
                                borderWidth="1px"
                                borderStyle="dashed"
                                borderRadius="md"
                                borderColor="border.muted"
                                onDragOver={
                                  !readOnly
                                    ? handleCardDragOver(null, lineIndex, colIdx)
                                    : undefined
                                }
                                onDrop={!readOnly ? handleDrop : undefined}
                              />
                            )}
                          </Flex>
                        );
                      })}
                      {dropIndicator &&
                        !dropIndicator.newLine &&
                        !dropIndicator.betweenLines &&
                        !dropIndicator.betweenColumns &&
                        dropIndicator.lineIndex === lineIndex &&
                        (dropIndicator.colIndex ?? -1) >= grid.allColumns.length && (
                          <Box
                            w="3px"
                            bg="brandColorText"
                            borderRadius="full"
                            alignSelf="stretch"
                          />
                        )}
                      {isDraggingVStreet &&
                        dropIndicator?.betweenColumns &&
                        (dropIndicator.colIndex ?? -1) >= grid.allColumns.length && (
                          <Box
                            w="3px"
                            bg="brandColorText"
                            borderRadius="full"
                            alignSelf="stretch"
                          />
                        )}
                    </Flex>
                  </Box>
                );
              })}

              {dropIndicator?.betweenLines &&
                (dropIndicator.lineIndex ?? -1) >= grid.rows.length && (
                  <Box h="3px" bg="brandColorText" borderRadius="full" my={1} />
                )}

              {isDragging && !isDraggingVStreet && (
                <Flex
                  align="center"
                  justify="center"
                  gap={2}
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderRadius="md"
                  borderColor={dropIndicator?.newLine ? 'brandColorText' : 'border.muted'}
                  bg={dropIndicator?.newLine ? 'bg.emphasized' : undefined}
                  color={dropIndicator?.newLine ? 'brandColorText' : 'fg.muted'}
                  p={3}
                  onDragOver={handleNewLineDragOver}
                  onDrop={handleDrop}
                >
                  <Icon as={PlusCircle} boxSize="16px" />
                  <Text fontSize="sm">Soltar aqui para criar nova linha</Text>
                </Flex>
              )}
            </VStack>
          </Box>
        ))}
    </Box>
  );
}
