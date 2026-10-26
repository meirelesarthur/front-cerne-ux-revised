// src/components/ui/SimpleTable.tsx
// Tabela de leitura (sem paginação/ordenação): cabeçalho em caixa-alta no padrão do DS, linhas com
// divisor, linhas de grupo e linha de total opcionais. Para quadros de referência (preços por
// faixa, limites de IA, módulos por plano). A tabela de listagens continua sendo o `Table`.

import type { ReactNode } from 'react';

import { Box, Table as ChakraTable } from '@chakra-ui/react';

export interface SimpleTableColumn {
  key: string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
}

export type SimpleTableRow =
  | { key: string; kind?: 'row' | 'total'; cells: Record<string, ReactNode> }
  | { key: string; kind: 'group'; label: ReactNode };

export interface SimpleTableProps {
  columns: SimpleTableColumn[];
  rows: SimpleTableRow[];
  ariaLabel: string;
}

export function SimpleTable({ columns, rows, ariaLabel }: SimpleTableProps) {
  return (
    <Box overflowX="auto" borderWidth="1px" borderColor="semanticNeutral.200" borderRadius="xl" bg="cardBG" boxShadow="cardShadow">
      <ChakraTable.Root size="sm" aria-label={ariaLabel} css={{ '& th, & td': { paddingInline: '12px', paddingBlock: '9px' } }}>
        <ChakraTable.Header>
          <ChakraTable.Row bg="semanticNeutral.100">
            {columns.map((col) => (
              <ChakraTable.ColumnHeader key={col.key} textAlign={col.align ?? 'left'} fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.06em" color="fg.muted">
                {col.header}
              </ChakraTable.ColumnHeader>
            ))}
          </ChakraTable.Row>
        </ChakraTable.Header>
        <ChakraTable.Body>
          {rows.map((row) =>
            row.kind === 'group' ? (
              <ChakraTable.Row key={row.key} bg="semanticNeutral.100">
                <ChakraTable.Cell colSpan={columns.length} fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.05em" color="fg.muted" py="6px">
                  {row.label}
                </ChakraTable.Cell>
              </ChakraTable.Row>
            ) : (
              <ChakraTable.Row key={row.key} fontWeight={row.kind === 'total' ? 'semibold' : undefined} borderTopWidth={row.kind === 'total' ? '2px' : undefined}>
                {columns.map((col) => (
                  <ChakraTable.Cell key={col.key} textAlign={col.align ?? 'left'} fontSize="base" verticalAlign="middle" borderColor="semanticNeutral.200" css={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.cells[col.key]}
                  </ChakraTable.Cell>
                ))}
              </ChakraTable.Row>
            )
          )}
        </ChakraTable.Body>
      </ChakraTable.Root>
    </Box>
  );
}

export default SimpleTable;
