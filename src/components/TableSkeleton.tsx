import { Box, Flex, Skeleton, Table } from '@chakra-ui/react';

interface TableSkeletonProps {
  form?: boolean;
  title?: string;
  marginTop?: string;
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  hasPagination?: boolean;
}

export function TableSkeleton({
  form = false,
  title,
  marginTop,
  rows = 10,
  columns = 4,
  hasHeader = true,
  hasPagination = true,
}: TableSkeletonProps) {
  return (
    <Box>
      {/* Header com título (se form = true) */}
      {form && (hasHeader || title) && (
        <Flex
          flex="1"
          height="50px"
          direction={{ base: 'column', md: 'row' }}
          align="center"
          paddingX="4"
          borderTopRadius="md"
          justify={{ base: 'center', md: 'space-between' }}
          gap={{ base: 4, md: 0 }}
          marginTop={{ base: '4', md: marginTop || '0' }}
          background="gridHeadEndFooter"
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
            justify={{ base: 'center', md: 'space-between' }}
            wrap="wrap"
            align="center"
            width="full"
            color="white"
          >
            {title ? (
              <Skeleton height="20px" width="150px" />
            ) : (
              <Skeleton height="20px" width="200px" />
            )}
          </Flex>
        </Flex>
      )}

      {/* Tabela principal */}
      <Table.ScrollArea
        borderTop="1px"
        marginTop={!form ? { base: '4', md: marginTop || '6' } : ''}
        borderTopRadius={form ? '' : 'md'}
        borderColor="borderGrid"
        css={{
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F0F0F0',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#C4C4C4',
            borderRadius: '1.5rem',
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
        <Table.Root
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
              bg: 'gridHeadSecondary',
              color: 'textGridColor',
              maxWidth: '190px',
              height: '10',
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
              // Era `height: '4'` (16px) — bem menor que a linha real
              // (`Table.tsx`, 44px), causando layout shift entre o skeleton
              // e os dados carregados. Alinhado a `t.size.tableRow` (44px).
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
          {/* Cabeçalho da tabela */}
          <Table.Header>
            <Table.Row borderBottom="1px solid" borderColor="borderGrid">
              {Array.from({ length: columns }).map((_, index) => (
                <Table.ColumnHeader
                  key={index}
                  paddingTop={index === columns - 1 ? 0 : '10px'}
                  width={index === columns - 1 ? '112px' : '300px'}
                >
                  <Flex justify={index === columns - 1 ? 'end' : 'left'}>
                    <Skeleton height="16px" width={index === columns - 1 ? '60px' : '120px'} />
                  </Flex>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>

          {/* Corpo da tabela */}
          <Table.Body>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <Table.Row key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Table.Cell key={colIndex} borderBottom="1px solid" borderColor="borderGrid">
                    <Flex
                      justify={colIndex === columns - 1 ? 'end' : 'left'}
                      direction="row"
                      paddingRight={colIndex === columns - 1 ? 2 : 0}
                    >
                      {colIndex === columns - 1 ? (
                        // Última coluna - botões de ação
                        <Flex gap={2}>
                          <Skeleton height="11px" width="32px" borderRadius="md" />
                          <Skeleton height="11px" width="32px" borderRadius="md" />
                        </Flex>
                      ) : (
                        // Outras colunas - texto
                        <Skeleton height="11px" width={`${80 + Math.random() * 40}px`} />
                      )}
                    </Flex>
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>

      {/* Footer com paginação */}
      {hasPagination ? (
        <Flex
          width="full"
          height="40px"
          background="gridHeadEndFooter"
          color="white"
          align="center"
          wrap="wrap"
          paddingX="4"
          borderBottomRadius="md"
          justify="space-between"
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
          <Skeleton height="14px" width="120px" />
          <Flex gap={2} align="center">
            <Skeleton height="14px" width="80px" display={{ base: 'none', md: 'block' }} />
            <Skeleton height="24px" width="50px" display={{ base: 'none', md: 'block' }} />
            <Flex gap={1}>
              <Skeleton height="24px" width="24px" borderRadius="md" />
              <Skeleton height="24px" width="24px" borderRadius="md" />
              <Skeleton height="24px" width="24px" borderRadius="md" />
            </Flex>
          </Flex>
        </Flex>
      ) : (
        <Flex
          width="full"
          height="40px"
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
