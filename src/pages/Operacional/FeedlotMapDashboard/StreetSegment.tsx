// src/pages/Operacional/FeedlotMapDashboard/StreetSegment.tsx
// Faixa H/V de Rua (FeedlotStreet) na grade 2D do Setor — TASK-FE-042-201,
// `LM03`. Mirror `agro365/resources/js/components/FeedlotMap/Street.js`:
// rua NUNCA é um card avulso, é uma faixa horizontal (linha inteira) ou
// vertical (coluna inteira) conforme `orientation`, com rótulo clicável
// (`SB27`, abre o diálogo Rua em modo editar, `TASK-FE-042-207`).
//
// Traçado tracejado (BUGFIX execução 042 — sessão de correção pós-E2E): o
// legado (`.feedlot-street__line`/`.feedlot-street__line-v-segment`,
// `agro365/resources/views/feedlot-map/index.blade.php`) SEMPRE desenha uma
// LINHA (border dashed) ocupando o espaço da faixa, com o rótulo à
// esquerda/topo — nunca só o texto centralizado. Mirror: `borderTopWidth`
// (H) / `borderLeftWidth` (V) `2px dashed`, `border.emphasized` (tokens
// `cerne`, adaptação — cor fixa `#cbd5e0` do legado não existe na paleta
// semântica da SPA).
//
// Draggable (BUGFIX — mesma sessão, `GAP-FE-240` resolvido): rua entra no
// DnD nativo HTML5 do grid do Setor (`FeedlotMapBoard.tsx`), mirror
// `Street.js` (`draggable`/`onDragStart`/`onDragOver`/`onDragEnd`/`onDrop`
// repassados pelo pai). `userSelect: 'none'` — sem isso o arrasto degenera
// em seleção de texto do rótulo (bug reportado no browser real).

import { Box, Text } from '@chakra-ui/react';

import type { StreetCardData } from '@/@types/v2/FeedlotMap';

interface StreetSegmentProps {
  street: StreetCardData;
  onEdit?: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function StreetSegment({
  street,
  onEdit,
  draggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: StreetSegmentProps) {
  const isVertical = street.orientation === 'V';

  return (
    <Box
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      display="flex"
      flexDirection={isVertical ? 'column' : 'row'}
      alignItems="center"
      gap={2}
      width={isVertical ? undefined : '100%'}
      height={isVertical ? '100%' : undefined}
      minW={isVertical ? '40px' : undefined}
      minH={isVertical ? undefined : '32px'}
      px={isVertical ? 1 : 2}
      py={isVertical ? 2 : 1}
      opacity={isDragging ? 0.4 : 1}
      cursor={draggable ? 'grab' : 'default'}
      outline={isDropTarget ? '2px solid' : undefined}
      outlineColor={isDropTarget ? 'brandColorText' : undefined}
      borderRadius="sm"
      css={{ userSelect: 'none' }}
    >
      <Text
        as="span"
        fontSize="xs"
        fontWeight="medium"
        color="fg.muted"
        cursor={onEdit ? 'pointer' : 'default'}
        onClick={onEdit}
        flexShrink={0}
        writingMode={isVertical ? 'vertical-rl' : undefined}
      >
        {street.description}
      </Text>
      <Box
        flex="1"
        alignSelf={isVertical ? 'center' : 'stretch'}
        width={isVertical ? '0' : undefined}
        borderTopWidth={isVertical ? undefined : '2px'}
        borderLeftWidth={isVertical ? '2px' : undefined}
        borderStyle="dashed"
        borderColor="border.emphasized"
      />
    </Box>
  );
}
