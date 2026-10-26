// src/pages/CadastrosBase/EstagioReprodutivo/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia) de ESTÁGIO REPRODUTIVO
// (`CategoryMatrix` — nome técnico do legado; nomenclatura de negócio "Estágio
// Reprodutivo" em toda a UI) — Cadastros Base > Pecuária.
// Rota: /cadastros-base/estagio-reprodutivo (guardada por `catymt_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Referência UX (TASK-CATYMT-01, Decisão do Desenvolvedor): não existe tela
// oficial de Estágio Reprodutivo/Pecuária no design system `cerne` — dev
// decidiu reusar o mesmo precedente INTERNO já em produção
// `CadastrosBase/Especies/` (mesma família "Cadastros Base > Pecuária").
//
// Divergência estrutural do precedente (achado #1 da ficha): este índice
// PAGINA DE VERDADE — `listCategoryMatrices` adapta o envelope
// `ApiResponse::paginated()` real (meta.current_page/last_page/per_page/total),
// não o truque `meta:null` de Espécies.
//
// Estrutura:
//   - grid via useCategoryMatricesList (paginação REAL);
//   - HeaderTable → botões de ação (Add respeita catymt_create);
//   - FilterSideEstagioReprodutivo → drawer (search/is_enabled/specie, este
//     último SERVER-SIDE via specie_uuid — achado #2);
//   - delete via useRequest + DeleteConfirmDialog (respeita catymt_delete;
//     onError GENÉRICO — a API já devolve 422 estruturado com a mensagem de
//     negócio real quando o registro está em uso por FK, achado #4).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Repeat } from 'lucide-react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteCategoryMatrix } from '@/services/v2/CategoryMatrices/category-matrix-service';

import type {
  CategoryMatrixFilterForm,
  CategoryMatrixListItem,
} from '@/@types/v2/CategoryMatrices/category-matrix';

import { FilterSideEstagioReprodutivo } from './FilterSideEstagioReprodutivo';
import { HeaderTable } from './HeaderTable';
import { useCategoryMatricesList } from './useCategoryMatrices';

import { PageHeader } from '@/components/ui/PageHeader';

// `specie_label` é display-only (só re-hidrata o nome da Espécie no drawer;
// NUNCA vai à API — ver comentário espelho em `category-matrix-service.ts`
// e em `FilterSideEstagioReprodutivo.tsx`). Contar essa chave junto com
// `specie_uuid` infla o badge "Filtros(N)": uma única Espécie selecionada
// gera 2 chaves truthy no mesmo filtro.
const DISPLAY_ONLY_FILTER_KEYS = ['specie_label'];

export default function EstagioReprodutivoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.categoryMatrix.categoryMatrix;

  const canCreate = can('catymt_create');
  const canEdit = can('catymt_edit');
  const canDelete = can('catymt_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseEstagioReprodutivo' + queryKey.categoryMatrices.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CategoryMatrixFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, v]) =>
          !DISPLAY_ONLY_FILTER_KEYS.includes(key) &&
          v !== undefined &&
          v !== null &&
          v !== '' &&
          v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<CategoryMatrixListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const categoryMatricesList = useCategoryMatricesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ categoryMatrixUuid }: { categoryMatrixUuid: string }) => {
      return await deleteCategoryMatrix(categoryMatrixUuid);
    },
    queryKey: queryKey.categoryMatrices.list,
    queryKey2: queryKey.categoryMatrices.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por Espécies/Armazém/Motivos de Baixa para a
    // mesma operação. O texto exibido no toast vem de `personalizedMessage`,
    // então o rótulo genérico associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). A API JÁ devolve 422
    // estruturado com a mensagem de negócio real quando o registro está em
    // uso por FK (achado #4) — nenhum tratamento especial de código é
    // necessário, só não sobrescrever com texto fixo.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (categoryMatrix: CategoryMatrixListItem) => {
    setToDelete(categoryMatrix);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ categoryMatrixUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<CategoryMatrixListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={Repeat} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor((row) => row.specie?.description ?? '-', {
        id: 'specie',
        header: text.list.table.specie,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.specie?.description ?? '-'}
          </Text>
        ),
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.active : text.list.table.inactive}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`/cadastros-base/estagio-reprodutivo/${row.original.uuid}`)
                  }
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {text.list.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([categoryMatricesList]);
  const items = categoryMatricesList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={categoryMatricesList.isError}
            error={categoryMatricesList.error}
            isEmpty={isEmpty}
            onRetry={() => categoryMatricesList.refetch()}
            isRetrying={categoryMatricesList.isFetching}
            emptyIcon={Repeat as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/estagio-reprodutivo/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideEstagioReprodutivo
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
