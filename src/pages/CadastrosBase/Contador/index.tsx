// src/pages/CadastrosBase/Contador/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid paginado) de CONTADOR (Escritório de Contabilidade)
// — Cadastros Base, domínio Fiscal/Contábil (TASK-CT-03a).
//
// Rota: /cadastros-base/contador (guardada por `ctdr_view`, registrada em
// src/router/index.tsx — este arquivo não mexe em rota/menu, ambos já
// existiam).
//
// Estrutura: grid PAGINADO flat (sem hierarquia, `Contador` não tem
// `is_enabled`) via `useContadoresList` + `userPaginatedQuery` — mesmo
// precedente estrutural de `PlanAccount/index.tsx` (TableProvider+Table).
//
// Exclusão: NÃO usa `useRequest` (mesma razão documentada no cabeçalho de
// `Addressing/index.tsx` — o `onError` genérico dele só lê `resData?.message`,
// nunca `resData?.errors`, o que esconderia `errors.in_use[]`). Usa um
// `useMutation` DEDICADO: no sucesso invalida a listagem + toast; no erro, se
// `extractInUseItems` reconhecer o 422 estruturado, fecha `DeleteConfirmDialog`
// e abre o `InUseBlockedDialog` genérico com a lista (`table`+`count`,
// rótulo resolvido por `contadorInUseTableLabels`); qualquer outro erro cai
// no toast genérico. Molde antigo (`ContadorInUseDialog.tsx`) migrado para o
// componente genérico — TASK-CT-03c.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import type { ElementType } from 'react';
import { FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { InUseBlockedDialog, type InUseBlockedItem } from '@/components/InUseBlockedDialog';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { contadorInUseTableLabels } from '@/constants/Contador/options/contador-in-use-table-labels';
import { queryKey } from '@/constants/query-key';

import { deleteContador } from '@/services/v2/Contadores/contador-service';

import type { ContadorFilterForm, ContadorListItem } from '@/@types/v2/Contadores';

import { FilterSideContador } from './FilterSideContador';
import { HeaderTable } from './HeaderTable';
import { useContadoresList } from './useContadores';
import { extractApiFieldErrorMessage, extractInUseItems } from '@/utils/extractApiErrorMessage';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

export default function ContadorList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.contadores.contador;

  // `ContadorResource` não expõe flags de autorização por item — a
  // permissão global `ctdr_create` basta, sem exceção de papel.
  const canCreate = can('ctdr_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseContador' + queryKey.contadores.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ContadorFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const contadoresList = useContadoresList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<ContadorListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use[]`) —
  // itens normalizados por `extractInUseItems`.
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  // ⚠️ NÃO usa `useRequest` aqui — ver nota de topo do arquivo.
  const deleteMutation = useMutation({
    mutationFn: async (contadorUuid: string) => await deleteContador(contadorUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.contadores.list] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('Contador delete - error:', error);

      const inUseItems = extractInUseItems(error);
      if (inUseItems) {
        onCloseDeleteDialog();
        setBlockedInUse(inUseItems);
        onOpenBlockedDialog();
        return;
      }

      // Fallback: qualquer erro que NÃO seja o 422 estruturado de bloqueio
      // (403, 500, 422 residual de corrida sem `in_use` populado).
      let errorMessage = languageGB.common.errorLog.unknownError;
      if (isAxiosError(error)) {
        const statusCode = error.response?.status ?? null;
        const resData = error.response?.data as any;
        if (resData?.message) {
          const msg =
            extractApiFieldErrorMessage(error) ?? (typeof resData.message === 'string' ? resData.message : JSON.stringify(resData.message));
          errorMessage = `${statusCode} — ${msg}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  const handleDeleteClick = (contador: ContadorListItem) => {
    setToDelete(contador);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  };

  const handleCloseBlockedDialog = () => {
    onCloseBlockedDialog();
    setBlockedInUse(null);
    setToDelete(null);
  };

  const columnHelper = createColumnHelper<ContadorListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('razao_social', {
        header: text.list.table.razaoSocial,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.razao_social}
          </Text>
        ),
      }),
      columnHelper.accessor('nome_fantasia', {
        header: text.list.table.nomeFantasia,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.nome_fantasia}
          </Text>
        ),
      }),
      columnHelper.accessor('cnpj', {
        header: text.list.table.cnpj,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm">
            {row.original.cnpj}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.city?.title ?? '', {
        id: 'city',
        header: text.list.table.city,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.city?.title ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('fone', {
        header: text.list.table.fone,
        cell: ({ row }) => <Text fontSize="sm">{row.original.fone}</Text>,
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Actions size="sm">
            {can('ctdr_edit') && (
              <Actions.Item
                icon={<Icon as={FiEdit} />}
                onClick={() => navigate(`/cadastros-base/contador/${row.original.uuid}`)}
              >
                {text.list.actions.edit}
              </Actions.Item>
            )}
            {can('ctdr_delete') && (
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
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, can]
  );

  const isLoading = checkLoadingStatus([contadoresList]);
  const isError = contadoresList.isError;
  const items = contadoresList.data?.data?.items;
  const isEmpty = !isLoading && !isError && (items?.length ?? 0) === 0;

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
            isError={isError}
            error={contadoresList.error}
            isEmpty={isEmpty}
            onRetry={() => contadoresList.refetch()}
            isRetrying={contadoresList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiUsers as ElementType}
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
            onCreate={() => navigate('/cadastros-base/contador/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideContador
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
        itemName={toDelete?.razao_social}
      />

      <InUseBlockedDialog
        isOpen={isOpenBlockedDialog}
        onClose={handleCloseBlockedDialog}
        title={text.deleteBlocked.title}
        description={text.deleteBlocked.description}
        itemName={toDelete?.razao_social}
        items={blockedInUse}
        closeLabel={languageGB.defaltStrings.close}
        resourceLabelTemplate={text.deleteBlocked.resourceLabel}
        getResourceLabel={(table) => contadorInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
