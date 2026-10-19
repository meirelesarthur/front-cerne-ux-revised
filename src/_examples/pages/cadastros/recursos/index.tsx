// src/_examples/pages/cadastros/recursos/index.tsx
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — tela de LISTAGEM (grid) da feature "Recursos".
//
// Organização MODULAR real do projeto: pages/<módulo>/<feature>/index.tsx
// (aqui: cadastros/recursos). Espelha o `Admin/Agents/index.tsx` do Rank:
//   - grid paginado (TableProvider + Table) via useResourcesList (GUID);
//   - HeaderTable  → SÓ botões de ação (Add / Filter) — arquivo à parte;
//   - FilterSideRecursos → drawer de filtro — arquivo à parte;
//   - mutation de delete via useRequest + DeleteConfirmDialog.
//
// As colunas da grid vivem AQUI (não no HeaderTable). Textos vêm do dicionário
// central `languageGB.examples.resource.*`, navegando direto no ponto de uso.
//
// Rota: /exemplo  (registrada em src/router/index.tsx, acessível só por URL).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiBox, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { useResourcesList } from '@/_examples/hooks/useResources';
import { deleteResource } from '@/_examples/services/resource-service';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { FilterSideRecursos } from './FilterSideRecursos';
import { HeaderTable } from './HeaderTable';

import type { ResourceData, ResourceFilterForm } from '@/_examples/types/resource';

export default function RecursosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'ExampleResources' + queryKey._example.list,
    }),
    []
  );

  const { handleFilterChange, handlePaginatedQuery, handleResetFilter, paginatedQuery } =
    userPaginatedQuery<ResourceFilterForm>(defaultQueryOptions);

  // ---- Filtro (drawer) -----------------------------------------------------
  // O estado do filtro NÃO vive aqui: vive em `paginatedQuery.filter` (padrão
  // Rank → Agents), aplicado via `handleFilterChange` e mapeado para a query
  // dentro de `useResourcesList`. O drawer é um componente controlado.
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = Object.keys(paginatedQuery?.filter ?? {}).filter(
    (key) => !!(paginatedQuery?.filter as Record<string, any>)?.[key]
  ).length;

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ResourceData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const resourceList = useResourcesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ resourceId }: { resourceId: string }) => {
      return await deleteResource(resourceId);
    },
    queryKey: queryKey._example.list,
    typesRequest: 'update',
    entityName: languageGB.examples.resource.singularLabel,
    personalizedMessage: languageGB.examples.resource.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (resource: ResourceData) => {
    setToDelete(resource);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ resourceId: toDelete.id });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ResourceData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: languageGB.examples.resource.list.table.id,
        cell: ({ row }) => <Text fontWeight="medium">#{row.original.id}</Text>,
        meta: styleColumTable.id,
      }),
      columnHelper.accessor('name', {
        header: languageGB.examples.resource.list.table.name,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={FiBox} color="blue.400" boxSize={4} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.name}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor('code', {
        header: languageGB.examples.resource.list.table.code,
        cell: ({ row }) => (
          <Text fontSize="xs" fontFamily="mono" color="fg.muted" lineClamp="1">
            {row.original.code || '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('description', {
        header: languageGB.examples.resource.list.table.description,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.description || '—'}
          </Text>
        ),
      }),
      columnHelper.accessor('enabled', {
        header: languageGB.examples.resource.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.enabled ? 'green' : 'red'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.enabled
              ? languageGB.examples.resource.list.table.active
              : languageGB.examples.resource.list.table.inactive}
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
              <Actions.Item
                icon={<Icon as={FiEdit} />}
                onClick={() => navigate(`/exemplo/${row.original.id}`)}
              >
                {languageGB.examples.resource.list.actions.edit}
              </Actions.Item>
              <Actions.Item
                icon={<Icon as={FiTrash2} />}
                onClick={() => handleDeleteClick(row.original)}
                color="red.400"
                disabled={isDeleting}
              >
                {languageGB.examples.resource.list.actions.delete}
              </Actions.Item>
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, languageGB]
  );

  const isLoading = checkLoadingStatus([resourceList]);

  return (
    <ContainerGrid>
      <TableProvider
        data={resourceList.data?.data?.items}
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
              {languageGB.examples.resource.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {languageGB.examples.resource.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table isLoading={isLoading} />
        </Box>
      </TableProvider>

      <FilterSideRecursos
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
        itemName={toDelete?.name}
      />
    </ContainerGrid>
  );
}
