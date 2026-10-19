// src/pages/Administrativo/RegistroEventos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de REGISTRO DE EVENTOS (Bonus) — Administrativo.
// Rota: /administrativo/registro-eventos (guarda `bonuses_view`). Esteira 037
// (registro-eventos-front-roteiro.md, TASK-FE-06).
//
// UX-GAP declarado (roteiro §UX): sem tela desenhada no `ux_root` — decisão
// do dono = seguir-pelo-padrão. Mirror estrutural de `Adiantamento/index.tsx`
// SEM `FilterSideBonus`/`ButtonFilter`/`filtersApplied` (decisão #2 do
// roteiro — `BonusRepository::list()` não aceita nenhum parâmetro de
// filtro, um drawer de filtro mentiria sobre o contrato real).
//
// Colunas: Funcionário (`employee.name`), Evento (`event.name`), Data
// (`formatDate`), Valor (moeda pt-BR — `amount` chega `decimal:2` cru como
// STRING do `BonusResource`, sempre `Number(...)` antes de formatar).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
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
import { useTable } from '@/hooks/useTable';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteBonus } from '@/services/v2/Bonuses/bonus-service';

import type { Bonus } from '@/@types/v2/Bonuses';

import { HeaderTable } from './HeaderTable';
import { useBonusesList } from './useBonuses';

// `amount` chega `decimal:2` cru como STRING do `BonusResource` — sempre
// `Number(...)` antes de formatar (essa é só a coluna de EXIBIÇÃO da grid).
function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Clique na linha (fora da coluna de ações) navega para o Detalhe — mesmo
// mecanismo de `RowClickToDetail` de `Adiantamento/index.tsx` (precisa estar
// DENTRO do `<TableProvider>` para ler `useTable()`).
function RowClickToDetail() {
  const navigate = useNavigate();
  const { table } = useTable();

  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as Bonus | undefined;
    if (selected?.uuid) {
      navigate(`/administrativo/registro-eventos/${selected.uuid}/detalhe`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return null;
}

export default function RegistroEventosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.bonuses.bonus;

  const canCreate = can('bonuses_create');
  const canEdit = can('bonuses_edit');
  const canDelete = can('bonuses_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'AdministrativoRegistroEventos' + queryKey.bonuses.bonuses,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<Bonus | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const bonusesList = useBonusesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ bonusUuid }: { bonusUuid: string }) => {
      return await deleteBonus(bonusUuid);
    },
    queryKey: queryKey.bonuses.bonuses,
    queryKey2: queryKey.bonuses.bonus,
    // `useRequest` não tem variante "delete" (mesma observação de
    // `Adiantamento/index.tsx`) — o texto do toast vem de `personalizedMessage`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (bonus: Bonus) => {
    setToDelete(bonus);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ bonusUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<Bonus>();
  const defaultColumns = useMemo(
    () => [
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
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: styleColumTable.date,
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
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() =>
                  navigate(`/administrativo/registro-eventos/${row.original.uuid}/detalhe`)
                }
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/administrativo/registro-eventos/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([bonusesList]);
  const items = bonusesList.data?.data?.items;
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
        <RowClickToDetail />

        <HeaderGrid header={<HeaderTable languageGB={languageGB} />}>
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
            isError={bonusesList.isError}
            error={bonusesList.error}
            isEmpty={isEmpty}
            onRetry={() => bonusesList.refetch()}
            isRetrying={bonusesList.isFetching}
            emptyIcon={FiRefreshCw as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/administrativo/registro-eventos/novo')}
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
        itemName={toDelete?.employee?.name ?? undefined}
      />
    </ContainerGrid>
  );
}
