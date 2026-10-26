// src/pages/BaseRegistrations/Warehouses/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de ARMAZÉNS — Cadastros Base.
// Rota: /cadastros-base/armazens (guardada por `warehouses_view`, registrada
// em TASK-FE-020 — este arquivo não mexe em rota/menu).
//
// Mirror mecânico de CadastrosBase/CentroCusto/index.tsx, SIMPLIFICADO
// (Warehouse-contrato-frontend.md §5.1, APROVADO v1.1):
//   - SEM hierarquia (parent_uuid) — sem coluna "Cadastrar descendente", sem
//     indentação/ícone de pasta na Descrição;
//   - SEM flags por item (can_edit/can_delete) — `WarehouseResource` não as
//     expõe; gating de ação de linha é 100% via permissão GLOBAL (`can()`);
//   - SEM ordenação clicável de coluna (§11.6 do contrato — API ordena fixo
//     por `initials`, sem parâmetro client-controlável);
//   - Empty state com só 2 variantes (filtrado / vazio) — sem a 3ª variante
//     "NoCreate" de CostCenter (exclusiva de DEC-005/hasRole, não se aplica
//     aqui).
//
// Fidelidade à Referência UX (GB.Cerne.UX/.../ArmazensLista.tsx, commit
// 73b5fa86e0) COM adaptação ao contrato real: sem SortHeader (API não expõe
// ordenação client-controlável), sem checagem de duplicidade de sigla nem
// auto-sugestão (o mock só funciona com a lista inteira em memória — contra
// paginação server-side real dão falso-negativo), badge de Tipo usando
// `type_label` da própria API (nunca lookup local duplicado).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiPackage, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteWarehouse, listWarehouses } from '@/services/v2/Warehouses/warehouse-service';

import type {
  WarehouseFilterForm,
  WarehouseListItem,
  WarehouseTypeSlug,
} from '@/@types/v2/Warehouses';

import { FilterSideWarehouses } from './FilterSideWarehouses';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Cor do Badge de Tipo por slug — puramente cosmético/ajustável
// (Warehouse-contrato-frontend.md §5.1/§10 item 9).
const TYPE_BADGE_COLOR: Record<WarehouseTypeSlug, string> = {
  insumos: 'green',
  formulacao: 'info',
  producao: 'orange',
};

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (mesmo padrão de CentroCusto/index.tsx).
const WAREHOUSE_STORAGE_KEY = 'CadastrosBaseArmazem' + queryKey.warehouses.list;

export default function WarehousesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.warehouses.warehouse;

  // Sem exceção `hasRole` (DEC-005 é particularidade de CentroCusto/hierarquia
  // — Warehouse não tem regra de negócio equivalente, §7 do contrato).
  const canCreate = can('warehouses_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: WAREHOUSE_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<WarehouseFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<WarehouseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const warehousesList = useCustomGridQuery<WarehouseListItem, WarehouseFilterForm>({
    asyncFunction: listWarehouses,
    queryKey: queryKey.warehouses.list,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as WarehouseFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ warehouseUuid }: { warehouseUuid: string }) => {
      return await deleteWarehouse(warehouseUuid);
    },
    queryKey: queryKey.warehouses.list,
    queryKey2: queryKey.warehouses.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a única opção compilável e é
    // o mesmo truque já usado por CostCenter/Perfil para a mesma operação. O
    // texto exibido no toast vem de `personalizedMessage`, então o rótulo
    // genérico associado a "update" nunca aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (warehouse: WarehouseListItem) => {
    setToDelete(warehouse);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ warehouseUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<WarehouseListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('initials', {
        header: text.list.table.initials,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.initials}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.initials },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette={TYPE_BADGE_COLOR[row.original.type]} variant="subtle">
            {row.original.type_label}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
      }),
      columnHelper.accessor('is_active', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_active ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_active ? text.list.table.activeLabel : text.list.table.inactiveLabel}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.active },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {can('warehouses_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/armazens/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('warehouses_delete') && (
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, text, can, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<WarehouseListItem>({
    storageKey: WAREHOUSE_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([warehousesList]);
  const items = warehousesList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={warehousesList.isError}
            error={warehousesList.error}
            isEmpty={isEmpty}
            onRetry={() => warehousesList.refetch()}
            isRetrying={warehousesList.isFetching}
            emptyIcon={FiPackage as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/armazens/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideWarehouses
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
