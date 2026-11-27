// src/pages/CadastrosBase/ServicosAgricolas/index.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026, não portar) — lista de SERVIÇOS (o antigo cadastro de Atividades).
// Rota: /cadastros-base/servicos-agricolas (provisória: `/cadastros-base/servicos` já é de outro
// cadastro, Gerais › Serviços). Só com `PURCHASE_ORDER_PROTOTYPE`; permissões `activities_*`.
//
// Colunas: Nome, Descrição, Tipos de serviço (etiquetas; um serviço pode estar em vários) e Status.
// "Valor/Hectare" e "Tipo (À Definir)" saíram: o Serviço é só descrição e situação (decisão de 26/11).
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
import { Badge } from '@/components/ui/Badge';
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

import { SERVICES_ROUTE } from '../TiposServico/serviceTypeRoutes';
import { FilterSideServicos } from './FilterSideServicos';
import { HeaderTable } from './HeaderTable';
import {
  deleteService,
  listServices,
  type ServiceFilter,
  type ServiceListItem,
  serviceQueryKey,
} from './serviceService';

export default function ServicosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.serviceTypes.service;

  const canEdit = can('activities_edit');
  const canDelete = can('activities_delete');
  const canCreate = can('activities_create');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: 'CadastrosBaseServicos' + serviceQueryKey.list }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ServiceFilter>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `service_type_label` é só do rótulo do filtro: não conta como filtro à parte.
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, v]) => key !== 'service_type_label' && v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<ServiceListItem | null>(null);
  const { open: isOpenDelete, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  const servicesList = useCustomGridQuery<ServiceListItem, ServiceFilter>({
    asyncFunction: listServices,
    queryKey: serviceQueryKey.list,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => deleteService(uuid),
    queryKey: serviceQueryKey.list,
    queryKey2: serviceQueryKey.detail,
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

  const columnHelper = createColumnHelper<ServiceListItem>();
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
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => <Text lineClamp="1">{row.original.description || '—'}</Text>,
      }),
      columnHelper.accessor('service_types', {
        header: text.list.table.serviceTypes,
        cell: ({ row }) =>
          row.original.service_types.length ? (
            <Flex gap="6px" wrap="wrap">
              {row.original.service_types.map((type) => (
                <Badge key={type.uuid} label={type.name} variant="neutral" />
              ))}
            </Flex>
          ) : (
            <Text color="fg.muted">{text.list.table.noTypes}</Text>
          ),
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
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => navigate(`${SERVICES_ROUTE}/${row.original.uuid}`)}>
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

  const isLoading = checkLoadingStatus([servicesList]);
  const items = servicesList.data?.data?.items;
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
            isError={servicesList.isError}
            error={servicesList.error}
            isEmpty={isEmpty}
            onRetry={() => servicesList.refetch()}
            isRetrying={servicesList.isFetching}
            emptyIcon={FiFileText}
            emptyTitle={filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty}
            emptyDescription={
              filtersApplied > 0 ? text.list.emptyState.descriptionFiltered : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${SERVICES_ROUTE}/novo`)}
          />
        </Box>
      </TableProvider>

      <FilterSideServicos
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
