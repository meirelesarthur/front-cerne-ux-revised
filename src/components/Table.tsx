import {
  cloneElement,
  ElementType,
  Fragment,
  ReactElement,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  Box,
  Center,
  Table as ChakraTable,
  EmptyState,
  Flex,
  HoverCard,
  HStack,
  Icon,
  Portal,
  Text,
  useMediaQuery,
  VStack,
} from '@chakra-ui/react';
import { Cell, flexRender, Row } from '@tanstack/react-table';
import type { IconType } from 'react-icons';
import { IoTimeOutline } from 'react-icons/io5';

import { useLanguage } from '@/hooks/useLanguage';
import { useTable } from '@/hooks/useTable';

import { resolveGridState } from '@/utils/resolveGridState';
import { getCellTooltipText } from '@/utils/tableCellTooltip';

import { Button } from './Button';
import { HeadingTextGrid } from './HeadingTextGrid';
import { IconButtonTable } from './IconButtonTable';
import { Pagination } from './Pagination';
import { QueryErrorState } from './QueryErrorState';
import { SelectPagination } from './SelectPagination';
import { TableSkeleton } from './TableSkeleton';

/**
 * Conteúdo da célula da grid (TASK EST-07/Tema C — tooltip em célula
 * truncada). Extraído em componente próprio porque a detecção de overflow
 * precisa de `useRef`/`useState` por célula, e hooks não podem ser chamados
 * dentro do `.map` de `row.getVisibleCells()` no corpo de `Table`.
 *
 * Estratégia (Opção A do contrato — lazy mount + medição sob demanda):
 * nenhuma célula monta `Tooltip.Root` por padrão; a medição de
 * `scrollWidth > clientWidth` só roda no primeiro `onMouseEnter`, e só para
 * colunas elegíveis (texto/número, fora de `acoes`/`select`/`edit`/`pdf`).
 * Células não elegíveis não recebem `ref`/handler/Tooltip — custo zero.
 */
interface TableBodyCellContentProps {
  cell: Cell<any, unknown>;
  row: Row<any>;
  index: number;
}

function TableBodyCellContent({ cell, row, index }: TableBodyCellContentProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const { languageGB } = useLanguage();

  // `cell.column.id` (SEMPRE resolvido pelo TanStack), NÃO `columnDef.id` — que
  // é `undefined` em coluna de `accessor(...)` sem `id` explícito. Era esse o
  // motivo de o tooltip NUNCA aparecer em coluna de dado (só `acoes`/`edit`,
  // que têm `id` explícito, entravam no dispatch — e essas são justamente as
  // excluídas).
  const columnId = cell.column.id;
  const tooltipText = getCellTooltipText(columnId, cell.getValue());
  const cellValue = cell.getValue();

  // Mede o truncamento no layout (não no hover) — determinístico, sem depender
  // da máquina de hover do Zag. Verifica overflow no wrapper, no `td` ancestral
  // E em TODOS os descendentes, nos DOIS eixos (`scrollWidth/Height >
  // clientWidth/Height`): células reais cortam de formas diferentes — umas por
  // `overflow:hidden`+ellipsis (largura), outras por `<Text lineClamp>` (que
  // esconde LINHAS, altura, dentro do próprio `<Text>`, não no Box/`td`). Só as
  // células truncadas montam o HoverCard; as demais renderizam conteúdo puro.
  useLayoutEffect(() => {
    if (!tooltipText) return undefined;
    function measure() {
      const el = cellRef.current;
      if (!el) return;
      const nodes: (Element | null)[] = [el, el.closest('td'), ...Array.from(el.querySelectorAll('*'))];
      const truncated = nodes.some(
        (n) => !!n && (n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1)
      );
      setIsTruncated(truncated);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [tooltipText, cellValue]);

  const flexContent = (
    <Flex
      justify={columnId === 'edit' || columnId === 'acoes' ? 'end' : 'left'}
      direction="row"
      minWidth="0"
      overflow="hidden"
      paddingRight={columnId === 'edit' ? 2 : 0}
    >
      {row.original.idTemp && row.getVisibleCells().length - 1 === index && (
        <IconButtonTable
          aria-label=""
          mensegerTooltip={languageGB.defaltStrings.registerNoSeve}
          size="xs"
          color="yellow.900"
          variant="ghost"
        >
          <Icon as={IoTimeOutline} />
        </IconButtonTable>
      )}
      {tooltipText ? (
        // Wrapper interno com o ellipsis efetivo (item 5 do contrato): o
        // `Flex` pai quebra a herança do `overflow/text-overflow` do `td`,
        // então quem precisa medir `scrollWidth > clientWidth` e exibir "…"
        // é este elemento — só existe quando a coluna é elegível a tooltip
        // (texto/número, fora de acoes/select/edit/pdf), custo zero nas
        // demais células.
        <Box
          ref={cellRef}
          minWidth="0"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          display="block"
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Box>
      ) : (
        flexRender(cell.column.columnDef.cell, cell.getContext())
      )}
    </Flex>
  );

  // Célula não elegível OU que cabe inteira → conteúdo puro (sem HoverCard). O
  // `flexContent` acima (com o `Box ref`) continua sendo renderizado aqui,
  // então o `useLayoutEffect` consegue medir e decidir se vira truncada.
  if (!tooltipText || !isTruncated) {
    return flexContent;
  }

  return (
    <HoverCard.Root
      openDelay={200}
      closeDelay={100}
      positioning={{ placement: 'top' }}
      lazyMount
      unmountOnExit
    >
      <HoverCard.Trigger asChild>{flexContent}</HoverCard.Trigger>
      <Portal>
        <HoverCard.Positioner>
          <HoverCard.Content
            maxW="sm"
            fontSize="sm"
            px="3"
            py="2"
            bg="cardBG"
            color="fg"
            borderWidth="1px"
            borderColor="border.muted"
            boxShadow="md"
          >
            {tooltipText}
          </HoverCard.Content>
        </HoverCard.Positioner>
      </Portal>
    </HoverCard.Root>
  );
}

interface TableProps {
  header?: ReactNode;
  rowSubComponent?: (props: { row: Row<any> }) => ReactElement;
  /**
   * ADITIVO (execução 081, T-081-FE-01) — destaque de linha por dado. Devolve o
   * NOME de um token semântico de cor (ex.: `supplyEmergencyRowBg`, linha do tipo
   * U de Suprimentos) ou `undefined` para manter a zebra padrão. Precedência:
   * linha temporária e linha selecionada vencem o destaque. SEM a prop o
   * comportamento é idêntico ao anterior (demais telas não mudam).
   */
  getRowHighlight?: (row: any) => string | undefined;
  form?: boolean;
  title?: string;
  marginTop?: string;
  isLoading?: boolean;
  /**
   * Opções do seletor de tamanho de página (`SelectPagination`). Repassada
   * tal-e-qual (aditivo — `undefined` preserva o default `[5,10,25,50,100]`
   * de `SelectPagination.tsx`, TASK-FE-501). Uso: telas com teto de
   * `per_page` diferente do padrão (ex.: Produtos, `TASK-FE-502`, teto real
   * 100 — `options={[10,20,30,50,80,100]}`).
   */
  pageSizeOptions?: number[];

  // --- estado de grid NATIVO (EST-07, onda "estado da grid no Table") ---
  // Mesma semântica que hoje mora em `GridQueryState`/`resolveGridState`
  // (precedência erro > vazio > dados) — absorvida aqui como props
  // OPCIONAIS para que qualquer tela ganhe o comportamento só usando
  // `<Table .../>`, sem wrapper. Esse boundary de estado só é ativado
  // quando a tela passa `isError` e/ou `isEmpty`; caso contrário o `Table`
  // renderiza exatamente como antes (backward-compat total com as telas
  // que só passam `isLoading`).
  isError?: boolean;
  /** Passthrough para `QueryErrorState` → `getQueryErrorPresentation` (403-aware). */
  error?: unknown;
  isEmpty?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
  /** Rótulo do botão de retry. Fallback: `languageGB.common.errorLog.defaultRetryLabel`. */
  retryLabel?: string;
  /** Override manual (raro; mesma prioridade de `QueryErrorState.message`). */
  errorMessage?: string;
  emptyIcon?: ElementType | IconType;
  emptyTitle?: string;
  emptyDescription?: string;
  canCreate?: boolean;
  onCreate?: () => void;
  /** Obrigatório (por convenção) se `canCreate=true`. */
  createLabel?: string;
}

export function Table({
  header,
  rowSubComponent,
  getRowHighlight,
  form,
  title,
  marginTop,
  isLoading = false,
  pageSizeOptions,
  isError,
  error,
  isEmpty,
  onRetry,
  isRetrying,
  retryLabel,
  errorMessage,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  canCreate,
  onCreate,
  createLabel,
}: TableProps) {
  const { table, pagination, onSelectPage, hasFooter } = useTable();
  const { languageGB } = useLanguage();
  const [isMobile, isMobileSx] = useMediaQuery(['(max-width: 680px)', '(max-width: 360px)']);

  // Boundary de estado só ativa quando a tela passa `isError`/`isEmpty`
  // (as ~60 telas legadas que só usam `isLoading` não passam por aqui —
  // `hasGridState` fica `false` e o fluxo cai direto no skeleton/tabela
  // de sempre, Regra "backward-compat" do contrato).
  const hasGridState = isError !== undefined || isEmpty !== undefined;

  if (hasGridState) {
    const state = resolveGridState({ isLoading, isError: !!isError, isEmpty: !!isEmpty });

    if (state === 'error') {
      return (
        <QueryErrorState
          error={error}
          message={errorMessage}
          onRetry={onRetry}
          isRetrying={isRetrying}
          retryLabel={retryLabel ?? languageGB.common.errorLog.defaultRetryLabel}
        />
      );
    }

    if (state === 'empty') {
      return (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={emptyIcon} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{emptyTitle}</EmptyState.Title>
              <EmptyState.Description>{emptyDescription}</EmptyState.Description>
            </VStack>
            {canCreate && onCreate && <Button title={createLabel ?? ''} onClick={onCreate} />}
          </EmptyState.Content>
        </EmptyState.Root>
      );
    }
  }

  // Se estiver carregando, mostra o skeleton
  if (isLoading) {
    return (
      <TableSkeleton
        form={form}
        title={title}
        marginTop={marginTop}
        rows={10}
        columns={table.getAllColumns().length || 4}
        hasHeader={!!(form && (header || title))}
        hasPagination={!!pagination}
      />
    );
  }

  return (
    // Raiz flex-column fit-content: a moldura (border + radius + overflow hidden)
    // abraça o conteúdo e só capa quando o pai não cabe (aí o `ScrollArea` rola).
    // No `form` as bordas já vêm nas partes internas, então a moldura fica de fora.
    <Box
      display="flex"
      flexDirection="column"
      minH={0}
      borderWidth={form ? undefined : '1px'}
      borderColor={form ? undefined : 'borderGrid'}
      borderRadius={form ? undefined : 'lg'}
      overflow={form ? undefined : 'hidden'}
    >
      {form && (header || title) && (
        <Flex
          flex="1"
          flexShrink="0"
          height="50px"
          direction={isMobile ? 'column' : 'row'}
          align={isMobile ? 'center' : 'center'}
          paddingX="4"
          borderTopRadius="md"
          justify={isMobile ? 'center' : 'space-between'}
          gap={isMobile ? 4 : 0}
          marginTop={isMobile ? '4' : marginTop || '0'}
          background="gridHeadEndFooter"
          // borderX="1px"
          // borderTop="1px"
          style={
            form
              ? {
                  borderTop: '1px solid',
                  borderLeft: '1px solid',
                  borderRight: '1px solid',
                  borderColor: 'var(--chakra-colors-border-grid)',
                }
              : {}
          }
        >
          <Flex
            justify={isMobileSx ? 'center' : 'space-between'}
            wrap="wrap"
            align="center"
            // gap={isMobile ? 4 : 0}
            width="full"
            color="white"
          >
            {form && title ? <HeadingTextGrid>{title}</HeadingTextGrid> : header}
          </Flex>
        </Flex>
      )}
      <ChakraTable.ScrollArea
        borderTop={form ? '1px' : '0'}
        marginTop={form ? '' : '0'}
        borderTopRadius={form ? '' : 'lg'}
        borderColor="borderGrid"
        // Única região de scroll: `flex:1; minH:0` recorta pelo pai bounded
        // (só as linhas rolam, `th` sticky). Pai não-bounded (formulário) =
        // flui sem cap, sem número mágico.
        flex="1"
        minH={0}
        overflowY="auto"
        // B1 (esteira 036, correções pós-E2E) — `overflowX` explícito. Grids
        // com muitas colunas (CaP/CaR) transbordavam sem rolagem horizontal
        // perceptível e a coluna de Ações ficava inacessível. O scrollbar
        // segue oculto visualmente (`&::-webkit-scrollbar` abaixo, mesmo
        // comportamento de sempre) — quem garante o acesso à Ações
        // independente de rolagem é o `position: sticky` da própria coluna
        // (meta.gridOrder === 'fixed-end', ver `& th`/células abaixo).
        overflowX="auto"
        css={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
        style={
          form
            ? {
                borderLeft: '1px solid',
                borderRight: '1px solid',
                borderColor: 'var(--chakra-colors-border-grid)',
              }
            : {}
        }
      >
        <ChakraTable.Root
          variant="line"
          size="md"
          css={{
            border: 'none',
            '& tr': {
              color: 'gray.700',
              borderColor: 'borderGrid',
              borderBottom: 'none',
            },
            '& th': {
              // Header FIXO no topo do scroll do corpo (Ponto 2 da leva):
              // `sticky` gruda o `th` no topo da `ChakraTable.ScrollArea`
              // (o ancestral com `overflowY: auto` mais próximo) enquanto
              // as linhas rolam por baixo — precisa do `bg` (já existia,
              // `gridHeadSecondary`) para as linhas não "aparecerem por
              // cima" do header ao rolar, e do `zIndex` para ficar acima do
              // conteúdo das células.
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bg: 'gridHeadSecondary',
              color: 'textGridColor',
              maxWidth: '190px',
              height: '38px',
              fontWeight: '500',
              textTransform: 'inherit',
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingY: '2',
              paddingLeft: '4',
              paddingRight: '4',
            },
            '& td': {
              position: 'relative',
              maxWidth: '190px',
              // Alinhado a `t.size.tableRow` (44px) da referência UX — era
              // `height: '9'` (36px, token Chakra 9 = 2.25rem).
              height: '44px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              color: 'textGridColor',
              paddingLeft: '4',
              paddingRight: '4',
            },
            '& tbody': {
              border: 'none',
            },
          }}
        >
          <ChakraTable.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <ChakraTable.Row
                key={headerGroup.id}
                borderBottom="1px solid"
                borderColor="borderGrid"
              >
                {headerGroup.headers.map((header) => (
                  <ChakraTable.ColumnHeader
                    key={header.id}
                    // B1 (esteira 036, correções pós-E2E) — coluna marcada
                    // `meta.gridOrder === 'fixed-end'` (mesma metadado que já
                    // ancora a coluna no fim da personalização de grid, ver
                    // `useGridSettings`) fica GRUDADA na borda direita do
                    // `ScrollArea`, sempre visível mesmo com rolagem
                    // horizontal (grids largas como CaP/CaR). `zIndex: 2`
                    // fica acima do `th` comum (zIndex 1, sticky no topo) só
                    // no canto onde os dois sticky se cruzam.
                    style={{
                      ...(header.column.columnDef.meta?.style || {}),
                      ...(header.column.columnDef.meta?.gridOrder === 'fixed-end'
                        ? { position: 'sticky', right: 0, zIndex: 2 }
                        : {}),
                    }}
                    paddingTop={
                      header.column.columnDef.id === 'acoes' ||
                      header.column.columnDef.id === 'select'
                        ? 0
                        : '10px'
                    }
                    width={
                      header.column.columnDef.id === 'acoes'
                        ? '112px'
                        : header.column.columnDef.id === 'select'
                          ? '48px'
                          : // : header.column.columnDef.header ===
                            //     headerGroup.headers[
                            //       form && title
                            //         ? headerGroup.headers.length - 1
                            //         : headerGroup.headers.length - 2
                            //     ].column.columnDef.header
                            //   ? ""
                            '300px'
                    }
                  >
                    <Flex
                      justify={
                        header.column.columnDef.id === 'edit' ||
                        header.column.columnDef.id === 'acoes'
                          ? 'end'
                          : 'left'
                      }
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </Flex>
                  </ChakraTable.ColumnHeader>
                ))}
              </ChakraTable.Row>
            ))}
          </ChakraTable.Header>
          <ChakraTable.Body>
            {table.getRowModel().rows.length === 0 ? (
              <ChakraTable.Row>
                <ChakraTable.Cell colSpan={100}>
                  <Center padding="2" color="textGridColor">
                    <Text fontSize="lg">{languageGB.defaltStrings.emptyData}</Text>
                  </Center>
                </ChakraTable.Cell>
              </ChakraTable.Row>
            ) : (
              <>
                {table.getRowModel().rows.map((row, rowIndex) => (
                  <Fragment key={row.id}>
                    <ChakraTable.Row key={row.id}>
                      {row.getVisibleCells().map((cell, index) => (
                        <ChakraTable.Cell
                          key={cell.id}
                          onClick={
                            cell.column.id === 'acoes' ||
                            cell.column.id === 'pdf' ||
                            cell.column.id === 'select'
                              ? null!
                              : row.getToggleSelectedHandler()
                          }
                          opacity={row.original.enabled === false ? '0.5' : '1'}
                          textDecoration={row.original.enabled === false ? 'line-through' : ''}
                          backgroundColor={
                            row.original.idTemp
                              ? 'registerTemperaryBG'
                              : row.getIsSelected()
                                ? 'selectedTextGridColor'
                                : getRowHighlight?.(row.original)
                                  ? getRowHighlight(row.original)
                                  : rowIndex % 2 === 0
                                    ? 'gridBG'
                                    : 'gridBGAlternate'
                          }
                          borderBottom="1px solid"
                          borderColor="borderGrid"
                          paddingBottom={cell.column.id === 'acoes' || 'edit' ? 0 : '10px'}
                          paddingTop={cell.column.id === 'acoes' || 'edit' ? 0 : '10px'}
                          cursor="pointer"
                          // B1 (esteira 036) — mesma âncora `fixed-end` do
                          // header acima; o `backgroundColor` já calculado
                          // (linha/seleção/temp, prop acima) é opaco e cobre
                          // o conteúdo das demais colunas ao rolar por baixo.
                          style={{
                            ...(cell.column.columnDef.meta?.style || {}),
                            ...(cell.column.columnDef.meta?.gridOrder === 'fixed-end'
                              ? { position: 'sticky', right: 0, zIndex: 1 }
                              : {}),
                          }}
                        >
                          <TableBodyCellContent cell={cell} row={row} index={index} />
                        </ChakraTable.Cell>
                      ))}
                    </ChakraTable.Row>
                    {row.getIsSelected() && row.getCanExpand() && (
                      <ChakraTable.Row borderBottom="1px solid" borderColor="borderGrid">
                        <ChakraTable.Cell
                          colSpan={row.getVisibleCells().length}
                          data-fefe={row.getIsExpanded()}
                          padding="10 !important"
                        >
                          {rowSubComponent
                            ? cloneElement(rowSubComponent({ row }) as ReactElement, {
                                row,
                              })
                            : null}
                        </ChakraTable.Cell>
                      </ChakraTable.Row>
                    )}
                  </Fragment>
                ))}
              </>
            )}
          </ChakraTable.Body>
          {hasFooter && (
            <ChakraTable.Footer>
              {table.getFooterGroups().map((footerGroup) => (
                <ChakraTable.Row key={footerGroup.id}>
                  {footerGroup.headers.map((header) => (
                    <ChakraTable.ColumnHeader key={header.id}>
                      {flexRender(header.column.columnDef.footer, header.getContext())}
                    </ChakraTable.ColumnHeader>
                  ))}
                </ChakraTable.Row>
              ))}
            </ChakraTable.Footer>
          )}
        </ChakraTable.Root>
      </ChakraTable.ScrollArea>
      {!!pagination ? (
        <>
          {/* <Flex height="50px" background="gridHeadEndFooter"></Flex> */}
          <Flex
            width="full"
            height="40px"
            flexShrink="0"
            background="gridHeadEndFooter"
            color="white"
            align="center"
            wrap="wrap"
            paddingX="4"
            borderBottomRadius="md"
            justify="space-between"
            // marginBottom={form && !title ? "0" : isMobile ? "10" : "14"}
            style={
              form
                ? {
                    borderLeft: '1px solid var(--chakra-colors-border-grid)',
                    borderRight: '1px solid var(--chakra-colors-border-grid)',
                    borderBottom: '1px solid var(--chakra-colors-border-grid)',
                  }
                : {}
            }
          >
            {pagination.totalRecords >= 1 && (
              <>
                <Text fontSize="sm" color="gray.400">
                  {`${languageGB.defaltStrings.showing} ${
                    table.getRowModel().rows.length
                  } ${languageGB.defaltStrings.of} ${pagination?.totalRecords || 0}`}
                </Text>
                <Flex gap="2">
                  <HStack
                    gap="2"
                    direction="row"
                    marginLeft="4"
                    paddingTop={'0'}
                    display={isMobile ? 'none' : 'flex'}
                  >
                    <Text fontSize="sm" color="gray.400">
                      {languageGB.defaltStrings.linePerPage}
                    </Text>
                    <SelectPagination
                      value={table.getState().pagination.pageSize}
                      onChange={onSelectPage}
                      options={pageSizeOptions}
                    />
                  </HStack>
                  <Pagination />
                </Flex>
              </>
            )}
          </Flex>
        </>
      ) : (
        <Flex
          width="full"
          height="40px"
          flexShrink="0"
          background="gridHeadEndFooter"
          color="white"
          paddingX="4"
          borderBottomRadius="md"
          style={
            form
              ? {
                  borderLeft: '1px solid var(--chakra-colors-border-grid)',
                  borderRight: '1px solid var(--chakra-colors-border-grid)',
                  borderBottom: '1px solid var(--chakra-colors-border-grid)',
                }
              : {}
          }
        />
      )}
    </Box>
  );
}
