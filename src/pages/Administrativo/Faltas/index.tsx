// src/pages/Administrativo/Faltas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de REGISTRO DE FALTAS — Administrativo / Gestão
// Pessoal (menu já existente, `adm-gp-fal`).
//
// Rota: /administrativo/faltas (guardada por `absences_view`, registrada em
// src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// UX-GAP declarado (FID-G3F §1): sem tela desenhada no `ux_root` — decisão
// do dono = seguir-pelo-padrão (mesma decisão já tomada 3x no módulo
// Administrativo: Adiantamento/Eventos/FuncionarioXEventos).
//
// Estrutura mirror `Administrativo/Eventos/index.tsx` (grid paginado REAL de
// servidor via `useAbsencesList` + `FilterSideFaltas` com re-hidratação +
// `HeaderTable`), com exclusão mirror `BaseRegistrations/Banks/index.tsx`
// (`useRequest`, `onError` GENÉRICO — sem mensagem de negócio fabricada, sem
// guarda de FK: nenhuma dependência confirmada no contrato de API §9).
//
// Colunas (contrato de tela §5 / FID-G3F FC-LIST-*): Data (dd/MM/yyyy,
// ordenação `date DESC` preservada), Funcionário, Evento, Valor
// (`formatCurrencyBRL(Number(amount))` — `amount` chega como string decimal
// crua, mesma armadilha de `Adiantamento`/`Contrato`), Período
// (`period_label ?? '—'`, nunca array), Ações (Editar/Excluir).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCalendar, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteAbsence } from '@/services/v2/Absences/absence-service';

import type { AbsenceFilterForm, AbsenceListItem } from '@/@types/v2/Absences';

import { FilterSideFaltas } from './FilterSideFaltas';
import { HeaderTable } from './HeaderTable';
import { useAbsencesList } from './useAbsences';

// `amount` chega `decimal:2` cru como STRING do `AbsenceResource` — sempre
// `Number(...)` antes de formatar (mesma nota de `Adiantamento/index.tsx`).
function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AbsencesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.absences.absence;

  const canCreate = can('absences_create');
  const canView = can('absences_view');
  const canEdit = can('absences_edit');
  const canDelete = can('absences_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'AdministrativoFaltas' + queryKey.absences.absencesList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AbsenceFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const absencesList = useAbsencesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<AbsenceListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `onError` NÃO customizado — usa o tratamento genérico interno do
  // `useRequest` (lê `message`/`error` do envelope). Sem guarda de FK
  // confirmada no contrato de API §9 (hard delete, mirror `Banks/index.tsx`).
  const deleteMutation = useRequest({
    asyncFunction: async ({ absenceUuid }: { absenceUuid: string }) => {
      return await deleteAbsence(absenceUuid);
    },
    queryKey: queryKey.absences.absencesList,
    queryKey2: queryKey.absences.absence,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por Adiantamento/Banks para a mesma operação.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  const handleDeleteClick = (item: AbsenceListItem) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ absenceUuid: toDelete.uuid });
    }
  };

  const columnHelper = createColumnHelper<AbsenceListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.display({
        id: 'employee',
        header: text.list.table.employee,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.employee?.name ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'event',
        header: text.list.table.event,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.event?.name ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('amount', {
        header: text.list.table.amount,
        cell: ({ row }) => (
          <Text
            fontSize="sm"
            fontWeight="medium"
            textAlign="right"
            fontVariantNumeric="tabular-nums"
          >
            {formatCurrencyBRL(row.original.amount)}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('period_label', {
        header: text.list.table.period,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.period_label ?? '—'}
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
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/administrativo/faltas/${row.original.uuid}?mode=view`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/administrativo/faltas/${row.original.uuid}`)}
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
    [navigate, isDeleting, text, canView, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([absencesList]);
  const items = absencesList.data?.data?.items;
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
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={absencesList.isError}
            error={absencesList.error}
            isEmpty={isEmpty}
            onRetry={() => absencesList.refetch()}
            isRetrying={absencesList.isFetching}
            emptyIcon={FiCalendar as ElementType}
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
            onCreate={() => navigate('/administrativo/faltas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFaltas
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
        itemName={toDelete?.employee?.name ?? undefined}
      />
    </ContainerGrid>
  );
}
