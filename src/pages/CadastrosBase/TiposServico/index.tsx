// src/pages/CadastrosBase/TiposServico/index.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026, não portar) — lista de TIPOS DE SERVIÇO (o antigo cadastro de Operações).
// Rota: /cadastros-base/tipos-de-servico (só com `PURCHASE_ORDER_PROTOTYPE`; permissões `operations_*`).
//
// Mesma estrutura da lista de Operações (CadastrosBase/Operacoes/index.tsx): colunas Nome, Agrupador,
// Ordem e Status, mais "Uso" e "Gera execução"; busca, Filtros, paginação de 10 em 10 e ações por linha
// (editar e excluir com confirmação). Os dados vêm do simulador (`/prototype/service-types`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiFileText, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTag } from '@/components/ui/StatusTag';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useListSearch } from '@/hooks/useListSearch';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { serviceQueryKey } from '../ServicosAgricolas/serviceService';
import { FilterSideTiposServico } from './FilterSideTiposServico';
import { HeaderTable } from './HeaderTable';
import { SERVICE_TYPES_ROUTE } from './serviceTypeRoutes';
import {
  deleteServiceType,
  listServiceTypes,
  type ServiceTypeFilter,
  type ServiceTypeListItem,
  serviceTypeQueryKey,
} from './serviceTypeService';

// Colunas curtas (Uso, Gera execução, Status): deixam espaço para Nome e Agrupador.
const NARROW_COLUMN = { style: { width: 120 } } as const;

export default function TiposServicoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.serviceTypes.serviceType;

  const canEdit = can('operations_edit');
  const canDelete = can('operations_delete');
  const canCreate = can('operations_create');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: 'CadastrosBaseTiposServico' + serviceTypeQueryKey.list }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ServiceTypeFilter>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `grouper_label` é só do rótulo do filtro: não conta como filtro à parte.
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, v]) => key !== 'grouper_label' && v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<ServiceTypeListItem | null>(null);
  const { open: isOpenDelete, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  const typesList = useCustomGridQuery<ServiceTypeListItem, ServiceTypeFilter>({
    asyncFunction: listServiceTypes,
    queryKey: serviceTypeQueryKey.list,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => deleteServiceType(uuid),
    queryKey: serviceTypeQueryKey.list,
    queryKey2: serviceTypeQueryKey.options,
    queryKey3: serviceQueryKey.list,
    // `useRequest` não tem variante "delete"; "update" é a convenção das listas atuais.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDelete();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ServiceTypeListItem>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="2">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.accessor('grouper_name', {
        header: text.list.table.grouper,
        cell: ({ row }) => <Text lineClamp="1">{row.original.grouper_name || text.list.table.noGrouper}</Text>,
      }),
      columnHelper.accessor('order', {
        header: text.list.table.order,
        cell: ({ row }) => <Text>{row.original.order}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('use', {
        header: text.list.table.use,
        cell: ({ row }) => (
          <Text>
            {row.original.use === 'agricultura'
              ? text.useOptions.agriculture
              : row.original.use === 'pecuaria'
                ? text.useOptions.livestock
                : text.useOptions.both}
          </Text>
        ),
        meta: NARROW_COLUMN,
      }),
      columnHelper.accessor('generates_execution', {
        header: text.list.table.generatesExecution,
        cell: ({ row }) => <Text>{row.original.generates_execution ? text.list.table.yes : text.list.table.no}</Text>,
        meta: NARROW_COLUMN,
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <StatusTag
            size="sm"
            label={row.original.is_enabled ? text.list.table.active : text.list.table.inactive}
            color={row.original.is_enabled ? 'green.600' : 'semanticNeutral.400'}
          />
        ),
        meta: NARROW_COLUMN,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => navigate(`${SERVICE_TYPES_ROUTE}/${row.original.uuid}`)}>
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => {
                    setToDelete(row.original);
                    onOpenDelete();
                  }}
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

  const isLoading = checkLoadingStatus([typesList]);
  const items = typesList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={columns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid header={<HeaderTable languageGB={languageGB} />}>
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          <Table
            isLoading={isLoading}
            isError={typesList.isError}
            error={typesList.error}
            isEmpty={isEmpty}
            onRetry={() => typesList.refetch()}
            isRetrying={typesList.isFetching}
            emptyIcon={FiFileText}
            emptyTitle={filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty}
            emptyDescription={
              filtersApplied > 0 ? text.list.emptyState.descriptionFiltered : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${SERVICE_TYPES_ROUTE}/novo`)}
          />
        </Box>
      </TableProvider>

      <FilterSideTiposServico
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDelete}
        onClose={() => {
          onCloseDelete();
          setToDelete(null);
        }}
        onConfirm={() => toDelete && deleteMutation.mutate({ uuid: toDelete.uuid })}
        isLoading={isDeleting}
        itemName={toDelete?.name}
      />
    </ContainerGrid>
  );
}
