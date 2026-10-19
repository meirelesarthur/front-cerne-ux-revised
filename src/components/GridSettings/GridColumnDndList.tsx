import {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Box, Flex, Icon, IconButton, Text, VisuallyHidden } from '@chakra-ui/react';
import { FiArrowLeft, FiArrowRight, FiEye, FiLock, FiMove } from 'react-icons/fi';

import type { GridColumnOption, GridLayout } from '../../hooks/useGridSettings';
import type { ColumnOrderState, VisibilityState } from '@tanstack/react-table';

export interface GridColumnDndListProps {
  /** Schema atual da grid — mesma referência exposta por `useGridSettings`. */
  columnOptions: GridColumnOption[];
  /** Rascunho transacional em edição; o componente nunca lê/escreve `applied`. */
  draftLayout: GridLayout;
  /** Única via de escrita: delega ao hook a reconciliação (âncoras, coluna mínima visível). */
  setDraftColumnState: (columnOrder: ColumnOrderState, columnVisibility: VisibilityState) => void;
}

type ListKind = 'visible' | 'hidden';

/**
 * Reordena `id` dentro de `list` para `targetIndex`, sem sair da faixa
 * `[lowerBound, upperBound]` (âncoras fixas nunca são cruzadas). Retorna a mesma
 * referência quando nada muda, para que o chamador possa curto-circuitar.
 * @param {string[]} list Ordem corrente da lista.
 * @param {string} id Id do item a mover.
 * @param {number} targetIndex Índice de destino pretendido.
 * @param {number} lowerBound Menor índice permitido (início da faixa movível).
 * @param {number} upperBound Maior índice permitido (fim da faixa movível).
 * @return {string[]} A lista reordenada (ou a original, se inalterada).
 */
function moveWithinBounds(
  list: string[],
  id: string,
  targetIndex: number,
  lowerBound: number,
  upperBound: number
): string[] {
  const currentIndex = list.indexOf(id);
  if (currentIndex === -1) return list;

  const clamped = Math.min(Math.max(targetIndex, lowerBound), upperBound);
  if (clamped === currentIndex) return list;

  const next = [...list];
  next.splice(currentIndex, 1);
  next.splice(clamped, 0, id);

  return next;
}

/**
 * Personalização de colunas do grid V2 em DUAS listas — "Colunas visíveis" e
 * "Colunas ocultas" — com três formas de mover uma coluna, todas convergindo
 * para `setDraftColumnState` (o hook é a única fonte de verdade e quem reconcilia
 * âncoras fixed-start/fixed-end e a coluna mínima visível):
 *
 * 1. Botão explícito por linha (ocultar / exibir) — afordância clara e sempre
 *    acessível por teclado.
 * 2. Teclado no próprio item: em Visíveis, Enter/Espaço pega para reordenar
 *    (setas/Home/End movem, Enter solta, Escape cancela) e Delete/Backspace
 *    oculta; em Ocultas, Enter/Espaço exibe.
 * 3. Arrastar por ponteiro: reordena dentro de Visíveis e move ENTRE as listas.
 *
 * Colunas fixas (fixed-start/fixed-end) e não-ocultáveis ficam travadas em
 * Visíveis: não reordenam nem podem ir para Ocultas.
 * @return {JSX.Element} As duas listas de colunas (visíveis e ocultas).
 */
export function GridColumnDndList({
  columnOptions,
  draftLayout,
  setDraftColumnState,
}: GridColumnDndListProps) {
  const columnById = new Map(columnOptions.map((column) => [column.id, column]));
  const order = draftLayout.order;
  const hiddenSet = new Set(draftLayout.hiddenColumnIds);
  const visibleIds = order.filter((id) => !hiddenSet.has(id));
  const hiddenIds = order.filter((id) => hiddenSet.has(id));

  const isMovable = (id: string) => columnById.get(id)?.orderPolicy === 'movable';
  const canHide = (id: string) => isMovable(id) && columnById.get(id)?.hideable === true;
  const label = (id: string) => columnById.get(id)?.label ?? id;

  // Faixa reordenável DENTRO da lista visível (âncoras fixas nos extremos ficam
  // fora dela). `relativePosition` traduz o índice absoluto para "n de N" na fala.
  const visibleMovable = visibleIds
    .map((id, index) => ({ id, index }))
    .filter(({ id }) => isMovable(id));
  const lowerBound = visibleMovable[0]?.index ?? -1;
  const upperBound = visibleMovable[visibleMovable.length - 1]?.index ?? -1;
  const movableCount = visibleMovable.length;
  const relativePosition = (index: number) => index - lowerBound + 1;

  const [focusedId, setFocusedId] = useState<string | null>(visibleIds[0] ?? hiddenIds[0] ?? null);
  const [grabbedId, setGrabbedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const originRef = useRef<{ order: string[]; visibility: VisibilityState } | null>(null);
  const pointerRef = useRef<{ id: string; pointerId: number } | null>(null);
  const pendingFocusRef = useRef<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());

  // Foco diferido: mover uma coluna entre listas desmonta a linha de um
  // container e a remonta no outro, perdendo o foco do DOM. Reaplicamos o foco
  // após o re-render usando o id memorizado.
  useEffect(() => {
    if (!pendingFocusRef.current) return;
    itemRefs.current.get(pendingFocusRef.current)?.focus();
    pendingFocusRef.current = null;
  });

  const buildVisibility = (): VisibilityState =>
    Object.fromEntries(columnOptions.map((column) => [column.id, !hiddenSet.has(column.id)]));

  const announce = (message: string) => setAnnouncement(message);

  // Um único tab-stop por lista (roving tabindex): a linha em foco, ou a
  // primeira da lista quando o foco está na outra.
  const visibleTabId =
    focusedId && visibleIds.includes(focusedId) ? focusedId : (visibleIds[0] ?? null);
  const hiddenTabId =
    focusedId && hiddenIds.includes(focusedId) ? focusedId : (hiddenIds[0] ?? null);

  const focusItem = (id: string | null) => {
    if (!id) return;
    setFocusedId(id);
    itemRefs.current.get(id)?.focus();
  };

  // --- Escritas (todas passam pelo hook via setDraftColumnState) ------------

  const reorderVisible = (id: string, targetIndex: number): boolean => {
    const next = moveWithinBounds(visibleIds, id, targetIndex, lowerBound, upperBound);
    if (next === visibleIds) return false;
    setDraftColumnState([...next, ...hiddenIds], buildVisibility());
    return true;
  };

  const hideColumn = (id: string): boolean => {
    if (!canHide(id)) return false;
    setDraftColumnState(order, { ...buildVisibility(), [id]: false });
    return true;
  };

  const showColumn = (id: string, atIndex?: number): boolean => {
    if (!hiddenSet.has(id)) return false;
    const rest = hiddenIds.filter((hiddenId) => hiddenId !== id);
    const nextVisible = [...visibleIds];
    const insertAt = atIndex ?? nextVisible.length;
    nextVisible.splice(Math.min(Math.max(insertAt, 0), nextVisible.length), 0, id);
    setDraftColumnState([...nextVisible, ...rest], { ...buildVisibility(), [id]: true });
    return true;
  };

  // --- Reordenação por teclado (grab) na lista visível ----------------------

  const moveBy = (id: string, delta: number) => {
    const currentIndex = visibleIds.indexOf(id);
    if (reorderVisible(id, currentIndex + delta)) {
      // Após a escrita o índice recalcula-se no próximo render; anunciamos com o
      // alvo pretendido, já clampado à faixa movível.
      const target = Math.min(Math.max(currentIndex + delta, lowerBound), upperBound);
      announce(`${label(id)} na posição ${relativePosition(target)} de ${movableCount}.`);
    }
  };

  const moveToEdge = (id: string, edge: 'start' | 'end') => {
    const target = edge === 'start' ? lowerBound : upperBound;
    if (reorderVisible(id, target)) {
      announce(`${label(id)} na posição ${relativePosition(target)} de ${movableCount}.`);
    }
  };

  const cancelGrab = (message: string) => {
    const origin = originRef.current;
    if (origin) setDraftColumnState(origin.order, origin.visibility);
    setGrabbedId(null);
    originRef.current = null;
    pointerRef.current = null;
    announce(message);
  };

  // --- Ponteiro: reordenar em Visíveis + mover ENTRE as listas --------------

  // Linha (de qualquer lista) mais próxima do ponteiro, por distância euclidiana
  // ao centro. A distância usa X e Y para desempatar entre as duas listas
  // lado a lado no browser real.
  const nearestTarget = (
    clientX: number,
    clientY: number
  ): { list: ListKind; index: number } | null => {
    let bestId: string | null = null;
    let bestDistance = Infinity;

    itemRefs.current.forEach((node, id) => {
      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - centerX, clientY - centerY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestId = id;
      }
    });

    if (!bestId) return null;
    const list: ListKind = hiddenSet.has(bestId) ? 'hidden' : 'visible';
    const source = list === 'visible' ? visibleIds : hiddenIds;
    return { list, index: source.indexOf(bestId) };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    const inVisible = !hiddenSet.has(id);
    // Em Visíveis só as movíveis pegam; em Ocultas qualquer linha pode ser
    // arrastada de volta para Visíveis.
    if (inVisible && !isMovable(id)) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);
    originRef.current = { order, visibility: buildVisibility() };
    pointerRef.current = { id, pointerId: event.pointerId };
    setGrabbedId(id);
    setFocusedId(id);
    announce(`${label(id)} selecionada para arrastar.`);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (!pointerRef.current || pointerRef.current.id !== id) return;

    const target = nearestTarget(event.clientX, event.clientY);
    if (!target) return;

    const currentlyHidden = hiddenSet.has(id);

    if (target.list === 'visible') {
      if (currentlyHidden) {
        if (showColumn(id, target.index)) announce(`${label(id)} movida para Colunas visíveis.`);
      } else if (reorderVisible(id, target.index)) {
        announce(`${label(id)} na posição ${relativePosition(target.index)} de ${movableCount}.`);
      }
      return;
    }

    // Alvo: lista de ocultas (só faz sentido para uma visível ocultável).
    if (!currentlyHidden && hideColumn(id)) {
      announce(`${label(id)} movida para Colunas ocultas.`);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (!pointerRef.current || pointerRef.current.id !== id) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setGrabbedId(null);
    originRef.current = null;
    pointerRef.current = null;
    announce(`${label(id)} solta.`);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (!pointerRef.current || pointerRef.current.id !== id) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    cancelGrab('Arraste cancelado.');
  };

  // --- Teclado --------------------------------------------------------------

  const handleVisibleKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.target !== event.currentTarget) return;

    const movable = isMovable(id);
    const isGrabbed = grabbedId === id;

    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        if (isGrabbed) moveBy(id, -1);
        else focusItem(visibleIds[visibleIds.indexOf(id) - 1] ?? id);
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        if (isGrabbed) moveBy(id, 1);
        else focusItem(visibleIds[visibleIds.indexOf(id) + 1] ?? id);
        break;
      }
      case 'Home': {
        event.preventDefault();
        if (isGrabbed) moveToEdge(id, 'start');
        else focusItem(visibleIds[0] ?? id);
        break;
      }
      case 'End': {
        event.preventDefault();
        if (isGrabbed) moveToEdge(id, 'end');
        else focusItem(visibleIds[visibleIds.length - 1] ?? id);
        break;
      }
      case ' ':
      case 'Spacebar':
      case 'Enter': {
        event.preventDefault();
        if (!movable) {
          announce(`${label(id)} tem posição fixa e não pode ser reordenada.`);
          break;
        }
        if (isGrabbed) {
          setGrabbedId(null);
          originRef.current = null;
          announce(
            `${label(id)} solta na posição ${relativePosition(visibleIds.indexOf(id))} de ${movableCount}.`
          );
        } else {
          originRef.current = { order, visibility: buildVisibility() };
          setGrabbedId(id);
          announce(`${label(id)} pega. Setas movem, Enter solta, Escape cancela, Delete oculta.`);
        }
        break;
      }
      case 'Delete':
      case 'Backspace': {
        if (isGrabbed || !canHide(id)) break;
        event.preventDefault();
        if (hideColumn(id)) {
          pendingFocusRef.current = id;
          announce(`${label(id)} movida para Colunas ocultas.`);
        }
        break;
      }
      case 'Escape': {
        if (isGrabbed) {
          event.preventDefault();
          cancelGrab('Reordenação cancelada.');
        }
        break;
      }
      default:
        break;
    }
  };

  const handleHiddenKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.target !== event.currentTarget) return;

    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        focusItem(hiddenIds[hiddenIds.indexOf(id) - 1] ?? id);
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        focusItem(hiddenIds[hiddenIds.indexOf(id) + 1] ?? id);
        break;
      }
      case 'Home': {
        event.preventDefault();
        focusItem(hiddenIds[0] ?? id);
        break;
      }
      case 'End': {
        event.preventDefault();
        focusItem(hiddenIds[hiddenIds.length - 1] ?? id);
        break;
      }
      case ' ':
      case 'Spacebar':
      case 'Enter': {
        event.preventDefault();
        if (showColumn(id)) {
          pendingFocusRef.current = id;
          announce(`${label(id)} movida para Colunas visíveis.`);
        }
        break;
      }
      default:
        break;
    }
  };

  // --- Render ---------------------------------------------------------------

  const registerRef = (id: string) => (node: HTMLDivElement | null) => {
    if (node) itemRefs.current.set(id, node);
    else itemRefs.current.delete(id);
  };

  const renderVisibleRow = (id: string) => {
    const column = columnById.get(id);
    if (!column) return null;

    const movable = column.orderPolicy === 'movable';
    const hideable = canHide(id);
    const isGrabbed = grabbedId === id;

    return (
      <Flex
        key={id}
        ref={registerRef(id)}
        role="option"
        aria-label={column.label}
        aria-selected={isGrabbed}
        aria-grabbed={movable ? isGrabbed : undefined}
        aria-disabled={!movable || undefined}
        aria-roledescription={movable ? 'coluna reordenável' : 'coluna fixa'}
        tabIndex={id === visibleTabId ? 0 : -1}
        align="center"
        gap={2}
        paddingY={1.5}
        paddingX={2}
        borderRadius="md"
        bg={isGrabbed ? 'colorPalette.subtle' : 'transparent'}
        colorPalette="green"
        boxShadow={isGrabbed ? 'sm' : 'none'}
        cursor={movable ? (isGrabbed ? 'grabbing' : 'grab') : 'default'}
        _hover={{ bg: isGrabbed ? 'colorPalette.subtle' : 'bg.muted' }}
        onFocus={() => setFocusedId(id)}
        onKeyDown={(event) => handleVisibleKeyDown(event, id)}
        onPointerDown={(event) => handlePointerDown(event, id)}
        onPointerMove={(event) => handlePointerMove(event, id)}
        onPointerUp={(event) => handlePointerUp(event, id)}
        onPointerCancel={(event) => handlePointerCancel(event, id)}
      >
        <Icon
          as={movable ? FiMove : FiLock}
          aria-hidden="true"
          color="fg.muted"
          data-testid={movable ? undefined : `fixed-icon-${id}`}
        />
        <Text flex="1" fontSize="sm" lineClamp="1">
          {column.label}
        </Text>
        {hideable ? (
          <IconButton
            aria-label={`Ocultar coluna ${column.label}`}
            title="Ocultar coluna"
            size="xs"
            variant="ghost"
            // A linha é arrastável: parar o pointerdown impede o drag e libera o
            // click do botão (senão a linha captura o ponteiro e "rouba" o click).
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (hideColumn(id)) announce(`${column.label} movida para Colunas ocultas.`);
            }}
          >
            <Icon as={FiArrowRight} aria-hidden="true" />
          </IconButton>
        ) : (
          // Mesmo footprint do botão interativo, porém desabilitado: sinaliza
          // "sempre visível" sem permitir ocultar, mantendo a simetria da coluna.
          <IconButton
            aria-label={`${column.label} sempre visível`}
            title="Sempre visível"
            size="xs"
            variant="ghost"
            disabled
            color="gray.400"
            cursor="default"
          >
            <Icon as={FiEye} aria-hidden="true" />
          </IconButton>
        )}
      </Flex>
    );
  };

  const renderHiddenRow = (id: string) => {
    const column = columnById.get(id);
    if (!column) return null;

    return (
      <Flex
        key={id}
        ref={registerRef(id)}
        role="option"
        aria-label={column.label}
        aria-selected={grabbedId === id}
        aria-roledescription="coluna oculta"
        tabIndex={id === hiddenTabId ? 0 : -1}
        align="center"
        gap={2}
        paddingY={1.5}
        paddingX={2}
        borderRadius="md"
        opacity={0.85}
        cursor="grab"
        _hover={{ bg: 'bg.muted' }}
        onFocus={() => setFocusedId(id)}
        onKeyDown={(event) => handleHiddenKeyDown(event, id)}
        onPointerDown={(event) => handlePointerDown(event, id)}
        onPointerMove={(event) => handlePointerMove(event, id)}
        onPointerUp={(event) => handlePointerUp(event, id)}
        onPointerCancel={(event) => handlePointerCancel(event, id)}
      >
        <IconButton
          aria-label={`Exibir coluna ${column.label}`}
          title="Exibir coluna"
          size="xs"
          variant="ghost"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            if (showColumn(id)) announce(`${column.label} movida para Colunas visíveis.`);
          }}
        >
          <Icon as={FiArrowLeft} aria-hidden="true" />
        </IconButton>
        <Text flex="1" fontSize="sm" lineClamp="1">
          {column.label}
        </Text>
      </Flex>
    );
  };

  const countBadge = (count: number) => (
    <Box
      as="span"
      minW={5}
      px={1.5}
      py={0.5}
      borderRadius="full"
      bg="bg.muted"
      color="fg.muted"
      fontSize="xs"
      fontWeight="semibold"
      textAlign="center"
    >
      {count}
    </Box>
  );

  return (
    <Flex direction={{ base: 'column', md: 'row' }} gap={3} align="stretch">
      <Box flex="1" minW={0}>
        <Flex align="center" justify="space-between" gap={2} mb={2}>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
            Colunas visíveis
          </Text>
          {countBadge(visibleIds.length)}
        </Flex>
        <Box
          role="listbox"
          aria-label="Colunas visíveis"
          aria-orientation="vertical"
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          p={1.5}
          minH="120px"
        >
          {visibleIds.map(renderVisibleRow)}
        </Box>
      </Box>

      <Box flex="1" minW={0}>
        <Flex align="center" justify="space-between" gap={2} mb={2}>
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
            Colunas ocultas
          </Text>
          {countBadge(hiddenIds.length)}
        </Flex>
        <Box
          role="listbox"
          aria-label="Colunas ocultas"
          aria-orientation="vertical"
          borderWidth="1px"
          borderColor="border"
          borderStyle="dashed"
          borderRadius="md"
          p={1.5}
          minH="120px"
        >
          {hiddenIds.length > 0 ? (
            hiddenIds.map(renderHiddenRow)
          ) : (
            <Flex align="center" justify="center" minH="108px" px={3} textAlign="center">
              <Text fontSize="xs" color="fg.subtle">
                Arraste colunas para cá ou use o botão de ocultar para removê-las da grade.
              </Text>
            </Flex>
          )}
        </Box>
      </Box>

      <VisuallyHidden aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
    </Flex>
  );
}
