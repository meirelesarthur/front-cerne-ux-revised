// src/pages/Operacional/ChargeBillExpenses/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CONTAS A PAGAR (ChargeBillExpense — Operacional /
// Agricultura / Carregamento). TASK-CBE-05, esteira 97-Esteiras/062
// (contrato de tela §2.1/§2.4).
//
// Rota: `/operacional/carregamento/contas-a-pagar` (guardada por
// `charge_expense_view`, registrada em `src/router/index.tsx` na TASK-CBE-07).
//
// SEM painel de filtro — fidelidade ao legado (FILT-01: `index()` não possui
// formulário de filtro, só paginação + ordenação fixa server-side). Mirror
// ESTRUTURAL 1:1 de `Operacional/ChargeBillIncomes/index.tsx` (gêmeo, mesmo
// `useMutation` direto p/ delete 204 sem envelope).
//
// Colunas (COL-01..06): Código · Dt. Vencimento · Fornecedor · Rateio Produto
// · Valor · Ação. Ordem fixa `code DESC` (o servidor já entrega ordenado,
// RN-07) — SEM ordenação clicável em nenhuma coluna. `branch_id` NUNCA
// aparece na listagem.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import type { ElementType } from 'react';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { deleteChargeBillExpense } from '@/services/v2/ChargeBillExpense/charge-bill-expense-service';

import type { ChargeBillExpenseListItem } from '@/@types/v2/ChargeBillExpense';

import { useChargeBillExpenseColumns } from './columns';
import { useChargeBillExpensesList } from './useChargeBillExpenses';

const CHARGE_BILL_EXPENSES_LIST_ROUTE = '/operacional/carregamento/contas-a-pagar';
// Seletor de itens por página — 10/30/50/100, mirror `ChargeBillIncomes`.
// NUNCA 200: o servidor valida `per_page` como `max:100`.
const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function ChargeBillExpensesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.chargeBillExpenses.chargeBillExpense;

  const canCreate = can('charge_expense_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        'OperacionalChargeBillExpenses' + queryKey.chargeBillExpenses.chargeBillExpensesList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const chargeBillExpensesList = useChargeBillExpensesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ChargeBillExpenseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // DELETE 204 sem envelope — `useMutation` direto + `extractApiErrorMessage`/
  // `toaster`, mirror `ChargeBillIncomes/index.tsx` (o service não devolve
  // `Response<T>`, incompatível com `useRequest`). O backend pode responder
  // 422 quando o registro tem vínculo de FK — a mensagem chega via
  // `extractApiErrorMessage`.
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteChargeBillExpense(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.chargeBillExpenses.chargeBillExpensesList],
      });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleView(item: ChargeBillExpenseListItem) {
    navigate(`${CHARGE_BILL_EXPENSES_LIST_ROUTE}/${item.uuid}/detalhe`);
  }

  function handleEdit(item: ChargeBillExpenseListItem) {
    navigate(`${CHARGE_BILL_EXPENSES_LIST_ROUTE}/${item.uuid}`);
  }

  function handleDeleteClick(item: ChargeBillExpenseListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const columns = useChargeBillExpenseColumns({
    languageGB,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    isDeleting,
  });

  const isLoading = checkLoadingStatus([chargeBillExpensesList]);
  const items = chargeBillExpensesList.data?.data?.items;
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
        <HeaderGrid
          header={
            canCreate && (
              <ButtonAdd
                onClick={() => navigate(`${CHARGE_BILL_EXPENSES_LIST_ROUTE}/novo`)}
                languageGB={languageGB}
              />
            )
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
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={chargeBillExpensesList.isError}
            error={chargeBillExpensesList.error}
            isEmpty={isEmpty}
            onRetry={() => chargeBillExpensesList.refetch()}
            isRetrying={chargeBillExpensesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiDollarSign as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${CHARGE_BILL_EXPENSES_LIST_ROUTE}/novo`)}
          />
        </Box>
      </TableProvider>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteConfirm.title}
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
