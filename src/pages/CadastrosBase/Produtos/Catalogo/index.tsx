// src/pages/CadastrosBase/Produtos/Catalogo/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM paginada de PRODUTOS (Catálogo) — Cadastros Base /
// Estrutura, execução 025 (TASK-FE-502). Rota:
// /cadastros-base/produtos (nó de menu JÁ RESERVADO, guardada por
// `products_view`, wiring de rota real em `TASK-FE-506` — CHOKEPOINT; URL
// renomeada de `/produtos/catalogo` em TASK-FE-1000, fora do escopo desta
// Tarefa).
//
// Passo UX: layout adotado de `ProdutosLista.tsx` (GB.Cerne.UX, commit
// 305e10e3), implementado com o catálogo real do fork (`ContainerGrid`/
// `Table`+`FilterSide`), não com os componentes visuais do `cerne` — mirror
// estrutural de `Produtos/Classes/index.tsx` (Kind, execução 024) para a
// casca da grid, combinado com o guard de fazenda ativa de
// `Embalagens/index.tsx` (`hasFarm`, catálogo tenant-wide sob `farm.context`
// estrito).
//
// 8 COLUNAS exatas (Product-Frontend-Contrato.md v1.1 §3.2 — SEM "Tipo", que
// não existe em `Product`, §5.2/5.3): Código/Descrição/Grupo/Categoria/
// Classe/Estoque Mínimo/Ativo/Ações. Ações = SOMENTE Ver/Editar — `DELETE
// /products` CONFIRMADO inexistente (`->except(['destroy'])`), nenhum botão
// de exclusão é renderizado, nem condicionalmente. SEM checkbox de seleção
// múltipla nem `BulkActionBar` (`GAP-FE-141`, gate ao dev ainda aberto).
// Ordenação FIXA `description asc` — sem `SortHeader` clicável (fiel ao
// legado, divergência deliberada da referência UX).
//
// PAGINAÇÃO: seletor 10/20/30/50/80/100 (NÃO 200 — teto real do backend é
// `per_page` max:100, `ProductIndexRequest`, decisão consciente de hardening
// já registrada no contrato; 200 causaria 422). `Table.tsx` foi estendido
// (aditivo, `pageSizeOptions?`) para repassar essas opções ao
// `SelectPagination` compartilhado sem afetar nenhuma outra tela que não
// passe a prop.
//
// CASCATA Grupo→Categoria→Classe: inteiramente implementada em
// `FilterSideCatalogo.tsx` (RHF + `setValue` no `onChange`, nunca
// `useEffect`). `paginatedQuery.filter` guarda o shape ACHATADO
// (`ProductFilterForm`, strings + `*_label` companion) — `toRequestFilter`
// abaixo faz o achatamento final (já sem `*_label`) para `ListProductsParams`
// (`useProductsList`, `TASK-FE-500`), responsabilidade explicitamente
// delegada a esta Tarefa pelo cabeçalho de `useProducts.tsx`.
//
// ⚠️ ACHADO desta Tarefa (reconciliação contra `ProductResource.php` REAL,
// ver `@/@types/v2/Products/index.d.ts`): `group`/`category`/`kind` chegam
// todos como `{ uuid, description }` (a chave é SEMPRE `description`, mesmo
// quando o Model de origem guarda o dado em `name`, caso de `Kind`) — a
// presunção de `TASK-FE-500` (`kind.name`) estava errada, corrigida no
// `@types`.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiBox, FiEdit, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import type { ListProductsParams } from '@/services/v2/Products/product-service';

import type { ProductFilterForm, ProductListItem } from '@/@types/v2/Products';

import { FilterSideCatalogo } from './FilterSideCatalogo';
import { HeaderTable } from './HeaderTable';
import { useProductsList } from './useProducts';

// Seletor de tamanho de página desta tela — teto real 100 (NÃO 200, ver
// cabeçalho do arquivo). `Table.tsx` (`pageSizeOptions?`, aditivo) repassa ao
// `SelectPagination` compartilhado.
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 80, 100];

// Achatamento `ProductFilterForm` (persistido, com `*_label` companion) →
// `ListProductsParams` (querystring real de `GET /products`) — responsabi-
// lidade desta Tarefa (ver nota em `useProducts.tsx`). `*_label` nunca é
// enviado à API, só existe para re-hidratar o drawer.
function toRequestFilter(filter?: ProductFilterForm | null): ListProductsParams {
  return {
    search: filter?.search || undefined,
    group_uuid: filter?.group_uuid || undefined,
    category_uuid: filter?.category_uuid || undefined,
    kind_uuid: filter?.kind_uuid || undefined,
    // Strings 'true'/'false' — 'false' é truthy em JS, então `||` NUNCA
    // descarta o filtro "Não" (ver nota em FilterSideCatalogo.tsx).
    has_lot: filter?.has_lot || undefined,
    is_equipment: filter?.is_equipment || undefined,
    // ERRO-FE-016: campo ausente aqui — o service nunca recebia o valor,
    // então o filtro "É Produto Fiscal" era descartado em silêncio antes de
    // chegar em `listProducts`. Mesma disciplina de string 'true'/'false'
    // (nunca boolean) dos dois campos acima.
    is_fiscal: filter?.is_fiscal || undefined,
  };
}

export default function ProdutosCatalogoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can, hasFarm } = usePermissions();
  const text = languageGB.products.product;

  const canCreate = can('products_create');
  const canEdit = can('products_edit');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseProdutosCatalogo' + queryKey.products.productsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ProductFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação do drawer) — não
        // devem inflar o badge "Filtros(N)" (mesma regra de
        // `CategoriasAnimais/index.tsx`).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  // Guard de fazenda ativa (`farm.context` estrito, catálogo tenant-wide —
  // Product-Frontend-Contrato.md §1/§8) — a query só dispara quando `hasFarm`
  // é verdadeiro. Sem fazenda ativa, NENHUMA chamada de rede é feita (evita
  // 403 cru do backend).
  const productsList = useProductsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: requestFilter,
    enabled: hasFarm,
  });

  const items = hasFarm ? (productsList.data?.data?.items ?? []) : [];

  const columnHelper = createColumnHelper<ProductListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" color="fg.muted">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor((row) => row.group?.description ?? '', {
        id: 'group',
        header: text.list.table.group,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.group.description}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.category?.description ?? '', {
        id: 'category',
        header: text.list.table.category,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.category.description}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.kind?.description ?? '', {
        id: 'kind',
        header: text.list.table.kind,
        // `kind` é opcional (`kind_uuid` nullable) — sem Classe atribuída
        // exibe o placeholder (`kindEmpty`), mesmo padrão de
        // `CategoriasAnimais/index.tsx` (`specieEmpty`).
        cell: ({ row }) =>
          row.original.kind ? (
            <Text fontSize="sm" color="fg.muted" lineClamp="1">
              {row.original.kind.description}
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              {text.list.table.kindEmpty}
            </Text>
          ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('min_stock', {
        header: text.list.table.minStock,
        cell: ({ row }) => (
          <Box width="full" textAlign="right">
            <Text fontSize="sm" color="fg.muted">
              {row.original.min_stock !== null
                ? Number(row.original.min_stock).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : '—'}
            </Text>
          </Box>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      // Ações = SOMENTE Ver/Editar — SEM Excluir (`DELETE /products` não
      // existe, confirmado pelo contrato backend, ver cabeçalho do arquivo).
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/cadastros-base/produtos/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/produtos/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, text, canEdit]
  );

  const isLoading = hasFarm && checkLoadingStatus([productsList]);
  const isEmpty = hasFarm && !isLoading && items.length === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          {!hasFarm ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiBox} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.noFarmSelected.title}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.noFarmSelected.description}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              isError={productsList.isError}
              error={productsList.error}
              isEmpty={isEmpty}
              onRetry={() => productsList.refetch()}
              isRetrying={productsList.isFetching}
              emptyIcon={FiBox}
              emptyTitle={
                filtersApplied > 0
                  ? text.list.emptyState.titleFiltered
                  : canCreate
                    ? text.list.emptyState.titleEmpty
                    : text.list.emptyState.titleEmptyNoCreate
              }
              emptyDescription={
                filtersApplied > 0
                  ? text.list.emptyState.descriptionFiltered
                  : canCreate
                    ? text.list.emptyState.descriptionEmpty
                    : text.list.emptyState.descriptionEmptyNoCreate
              }
              canCreate={filtersApplied === 0 && canCreate}
              createLabel={text.list.emptyState.cta}
              onCreate={() => navigate('/cadastros-base/produtos/novo')}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideCatalogo
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={(applied) => handleFilterChange(applied)}
        handleReset={() => handleResetFilter()}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />
    </ContainerGrid>
  );
}
