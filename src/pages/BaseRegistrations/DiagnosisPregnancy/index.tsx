// src/pages/BaseRegistrations/DiagnosisPregnancy/index.tsx
// Tela de LISTAGEM de Diagnóstico de Gestação (Cadastros Base → Pecuários).

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Stethoscope } from 'lucide-react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteDiagnosisPregnancy,
  listDiagnosisPregnancies,
} from '@/services/v2/BaseRegistrations/diagnosisPregnancy-service';

import type {
  DiagnosisPregnanciesFilterForm,
  DiagnosisPregnancyListItem,
} from '@/@types/v2/BaseRegistrations/diagnosisPregnancy';

import { FilterSideDiagnosisPregnancy } from './FilterSideDiagnosisPregnancy';
import { HeaderTable } from './HeaderTable';

export default function DiagnosisPregnancyList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can('diagnosis_pregnancies_create');
  const canEdit = can('diagnosis_pregnancies_edit');
  const canDelete = can('diagnosis_pregnancies_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.diagnosisPregnancies,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DiagnosisPregnanciesFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<DiagnosisPregnancyListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const diagnosisPregnanciesList = useCustomGridQuery<
    DiagnosisPregnancyListItem,
    DiagnosisPregnanciesFilterForm
  >({
    asyncFunction: listDiagnosisPregnancies,
    queryKey: queryKey.baseRegistrations.diagnosisPregnancies,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as DiagnosisPregnanciesFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ diagnosisPregnancyUuid }: { diagnosisPregnancyUuid: string }) => {
      return await deleteDiagnosisPregnancy(diagnosisPregnancyUuid);
    },
    queryKey: queryKey.baseRegistrations.diagnosisPregnancies,
    queryKey2: queryKey.baseRegistrations.diagnosisPregnancy,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // Espécies para a mesma operação. O texto exibido no toast vem de
    // `personalizedMessage`, então o rótulo genérico associado a "update"
    // nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). Guarda de FK 422
    // (BusinessRuleException) para registro referenciado por
    // `pregnancy_diagnosis_animals` — tratado aqui como qualquer outro erro de
    // negócio (toast com a message do envelope), sem parsing de
    // `errors.in_use[]` (este endpoint não emite esse shape estruturado).
    typesRequest: 'update',
    entityName: languageGB.baseRegistrations.diagnosisPregnancy.singularLabel,
    personalizedMessage: languageGB.baseRegistrations.diagnosisPregnancy.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (diagnosisPregnancy: DiagnosisPregnancyListItem) => {
    setToDelete(diagnosisPregnancy);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ diagnosisPregnancyUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<DiagnosisPregnancyListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: languageGB.baseRegistrations.diagnosisPregnancy.list.table.description,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={Stethoscope} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor('is_enabled', {
        header: languageGB.baseRegistrations.diagnosisPregnancy.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled
              ? languageGB.baseRegistrations.diagnosisPregnancy.list.table.active
              : languageGB.baseRegistrations.diagnosisPregnancy.list.table.inactive}
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
                    navigate(`/cadastros-base/diagnostico-gestacao/${row.original.uuid}`)
                  }
                >
                  {languageGB.baseRegistrations.diagnosisPregnancy.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {languageGB.baseRegistrations.diagnosisPregnancy.list.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, languageGB, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([diagnosisPregnanciesList]);
  const items = diagnosisPregnanciesList.data?.data?.items;
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
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {languageGB.baseRegistrations.diagnosisPregnancy.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {languageGB.baseRegistrations.diagnosisPregnancy.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={diagnosisPregnanciesList.isError}
            error={diagnosisPregnanciesList.error}
            isEmpty={isEmpty}
            onRetry={() => diagnosisPregnanciesList.refetch()}
            isRetrying={diagnosisPregnanciesList.isFetching}
            emptyIcon={Stethoscope}
            emptyTitle={
              filtersApplied > 0
                ? languageGB.baseRegistrations.diagnosisPregnancy.list.emptyState.titleFiltered
                : languageGB.baseRegistrations.diagnosisPregnancy.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? languageGB.baseRegistrations.diagnosisPregnancy.list.emptyState
                    .descriptionFiltered
                : languageGB.baseRegistrations.diagnosisPregnancy.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={languageGB.baseRegistrations.diagnosisPregnancy.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/diagnostico-gestacao/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideDiagnosisPregnancy
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
