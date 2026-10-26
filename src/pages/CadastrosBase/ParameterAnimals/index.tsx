// src/pages/CadastrosBase/ParameterAnimals/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia) de PARÂMETROS ANIMAIS
// (ParameterAnimal) — Cadastros Base / Pecuária (TASK-FE-1078, regeneração).
//
// Rota: /parameter-animals (guardada por `parameter-animals_view`, registrada
// em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Referência UX: UX-GAP (nenhum design dedicado no `cerne` confirmado —
// contrato v1.1 não referencia Referência UX, só o legado). Molde estrutural
// direto de `CadastrosBase/Atividades/index.tsx` (paginação REAL server-side,
// mesmo shape de estado/filtro/delete, SEM bloco de erro manual — erro de
// rede vai para o `ErrorLogPanel` global via interceptor, nenhum tratamento
// aqui). 5 colunas conforme DoD da Tarefa + contrato v1.1 §2: Código/
// Descrição/Categoria (`category_animal.description`)/Encarregado
// (`employee.name`)/Peso Médio.
//
// Delete físico incondicional (contrato v1.1 §3 DELETE — sem FK dependente
// conhecida) — `onError` genérico do `useRequest`, sem diálogo de "em uso"
// dedicado (diferente de Function/`FunctionInUseDialog`, que não se aplica
// aqui).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiEdit, FiTrash2 } from 'react-icons/fi';
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

import { deleteParameterAnimal } from '@/services/v2/ParameterAnimals/parameter-animal-service';

import type {
  ParameterAnimalData,
  ParameterAnimalFilterForm,
} from '@/@types/v2/ParameterAnimals/parameter-animal';

import { FilterSideParameterAnimals } from './FilterSideParameterAnimals';
import { HeaderTable } from './HeaderTable';
import { useParameterAnimalsList } from './useParameterAnimals';

import { PageHeader } from '@/components/ui/PageHeader';

export default function ParameterAnimalsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.parameterAnimals.parameterAnimal;

  const canCreate = can('parameter-animals_create');
  const canEdit = can('parameter-animals_edit');
  const canDelete = can('parameter-animals_delete');

  // Paginação padrão universal do projeto — default 10 (teto 100 aplicado
  // pelo backend, `AnimalParameterIndexRequest`, contrato v1.1 §3).
  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseParameterAnimals' + queryKey.parameterAnimals.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ParameterAnimalFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ParameterAnimalData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const parameterAnimalsList = useParameterAnimalsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // onError NÃO customizado — sem FK dependente conhecida (contrato v1.1 §3),
  // trata pelo genérico do `useRequest` (mesmo racional de Atividades).
  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => await deleteParameterAnimal(uuid),
    queryKey: queryKey.parameterAnimals.list,
    queryKey2: queryKey.parameterAnimals.detail,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (item: ParameterAnimalData) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ uuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ParameterAnimalData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text lineClamp="1">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor((row) => row.category_animal?.description ?? '', {
        id: 'category',
        header: text.list.table.category,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.category_animal?.description ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.employee?.name ?? '', {
        id: 'employee',
        header: text.list.table.employee,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.employee?.name ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('average_weight', {
        header: text.list.table.averageWeight,
        cell: ({ row }) => (
          <Text lineClamp="1">
            {row.original.average_weight !== null ? row.original.average_weight : '—'}
          </Text>
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
                  onClick={() => navigate(`/parameter-animals/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([parameterAnimalsList]);
  const items = parameterAnimalsList.data?.data?.items;
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
            isError={parameterAnimalsList.isError}
            error={parameterAnimalsList.error}
            isEmpty={isEmpty}
            onRetry={() => parameterAnimalsList.refetch()}
            isRetrying={parameterAnimalsList.isFetching}
            emptyIcon={FiClipboard}
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
            onCreate={() => navigate('/parameter-animals/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideParameterAnimals
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
        title={text.list.deleteConfirm.title}
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
