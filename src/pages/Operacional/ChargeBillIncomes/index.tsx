// src/pages/Operacional/ChargeBillIncomes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CONTAS A RECEBER (ChargeBillIncome — Operacional /
// Agricultura / Carregamento). TASK-CBI-FE-02, esteira 97-Esteiras/059
// (contrato de tela §4/§8 SURF-FE-LIST/-ACTIONS/-DELETE).
//
// Rota: `/operacional/carregamento/contas-a-receber` (guardada por
// `charge_income_view`, registrada em `src/router/index.tsx`).
//
// SEM painel de filtro — fidelidade ao legado (FILT-01: `index()` não possui
// formulário de filtro, só paginação + ordenação fixa server-side). Mirror
// estrutural de `Operacional/FechamentoSemana/index.tsx` (mesma ausência de
// filtro, mesmo `useMutation` direto p/ delete 204 sem envelope) — NÃO o
// mirror `Incomes`/`ContasBancarias` (que têm filtro/seleção em lote, fora de
// escopo aqui, DEC-FE-06).
//
// Colunas (list_manifest COL-01..06): Código · Dt. Vencimento · Fornecedor ·
// Rateio Produto · Valor · Ações. Ordem fixa `code DESC` (o servidor já
// entrega ordenado, RN-07) — SEM ordenação clicável em nenhuma coluna.
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

import { deleteChargeBillIncome } from '@/services/v2/ChargeBillIncome/charge-bill-income-service';

import type { ChargeBillIncomeListItem } from '@/@types/v2/ChargeBillIncome';

import { useChargeBillIncomeColumns } from './columns';
import { useChargeBillIncomesList } from './useChargeBillIncomes';

const CHARGE_BILL_INCOMES_LIST_ROUTE = '/operacional/carregamento/contas-a-receber';
// Seletor de itens por página — 10/30/50/100, mirror `FechamentoSemana`/
// `Carregamento`. NUNCA 200: o servidor valida `per_page` como `max:100`.
const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

export default function ChargeBillIncomesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.chargeBillIncomes.chargeBillIncome;

  const canCreate = can('charge_income_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalChargeBillIncomes' + queryKey.chargeBillIncomes.chargeBillIncomesList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const chargeBillIncomesList = useChargeBillIncomesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ChargeBillIncomeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // DELETE 204 sem envelope (SFX-03 do contrato legado) — `useMutation` direto
  // + `extractApiErrorMessage`/`toaster`, mirror `FechamentoSemana/index.tsx`
  // (o service não devolve `Response<T>`, incompatível com `useRequest`).
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteChargeBillIncome(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.chargeBillIncomes.chargeBillIncomesList],
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

  function handleView(item: ChargeBillIncomeListItem) {
    navigate(`${CHARGE_BILL_INCOMES_LIST_ROUTE}/${item.uuid}/detalhe`);
  }

  function handleEdit(item: ChargeBillIncomeListItem) {
    navigate(`${CHARGE_BILL_INCOMES_LIST_ROUTE}/${item.uuid}`);
  }

  function handleDeleteClick(item: ChargeBillIncomeListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const columns = useChargeBillIncomeColumns({
    languageGB,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    isDeleting,
  });

  const isLoading = checkLoadingStatus([chargeBillIncomesList]);
  const items = chargeBillIncomesList.data?.data?.items;
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
                onClick={() => navigate(`${CHARGE_BILL_INCOMES_LIST_ROUTE}/novo`)}
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
            isError={chargeBillIncomesList.isError}
            error={chargeBillIncomesList.error}
            isEmpty={isEmpty}
            onRetry={() => chargeBillIncomesList.refetch()}
            isRetrying={chargeBillIncomesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiDollarSign as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${CHARGE_BILL_INCOMES_LIST_ROUTE}/novo`)}
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
