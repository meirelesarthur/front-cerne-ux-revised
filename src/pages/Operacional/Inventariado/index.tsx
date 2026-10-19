// src/pages/Operacional/Inventariado/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de INVENTARIADO — Operacional → Pecuária (F-041,
// CORE_WORKSPACE/97-Esteiras/060, TASK-INV-FE-02). Rota
// `/operacional/inventariado` (item de menu `ope-pec-inv`/permissão
// `inventoried-animals_view` JÁ EXISTEM — `navigationTree.ts:1442`/
// `navigationPermissions.ts:406`, zero edição nesta Tarefa; a ROTA em si é
// criada em `src/router/index.tsx` por esta mesma Tarefa).
//
// Mirror ESTRUTURAL de `Administrativo/CorrecaoEstoque/index.tsx` (grid SEM
// filtro — `filter_manifest` do legado vazio, prova de ausência,
// legacy-contract-inventoried-animals.md `filter_manifest_nota` — + import
// no header + delete via `useRequest`), acrescido da ação "Relatório" (S4 do
// contrato de tela, abre PDF via blob em nova aba).
//
// Sem `ButtonAdd`/rota de formulário — feature SEM create/edit (SR-06 do
// legado); o único ponto de criação é a importação de planilha
// (`HeaderTable.tsx`/`InventariadoImportModal.tsx`, TASK-INV-FE-03).
//
// Paginação: a API pagina FIXO em 10/página (`paginate(10)` no Repository) e
// IGNORA `per_page` na querystring (`inventoried-service.ts::listInventoried`
// nunca o envia). Para não fabricar uma capacidade que a API não tem, o
// seletor de tamanho de página do `<Table>` é restrito a uma única opção
// (Regra 9 — honestidade de UI).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteInventoried,
  downloadInventoriedReport,
  listInventoried,
} from '@/services/v2/Inventoried/inventoried-service';

import type { InventoriedListItem } from '@/@types/v2/Inventoried';

import { HeaderTable } from './HeaderTable';

// Único tamanho de página aceito — mirror da limitação real do backend (ver
// nota de cabeçalho acima).
const PAGE_SIZE_OPTIONS = [10];

function formatCount(value: number): string {
  return value.toLocaleString('pt-BR');
}

export default function InventariadoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.inventoried.inventoried;

  const canDelete = can('inventoried-animals_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalInventariado' + queryKey.inventoried.inventoriedList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const inventoriedList = useCustomGridQuery<InventoriedListItem, Record<string, never>>({
    asyncFunction: listInventoried,
    queryKey: queryKey.inventoried.inventoriedList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<InventoriedListItem | null>(null);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  // `destroy()` sempre executa (hard delete transacional, sem guarda de
  // dependência) — `useRequest` comum basta aqui (mirror `deleteStockCorrection`,
  // `typesRequest: 'update'` — `useRequest` não tem variante "delete" própria).
  const deleteMutation = useRequest({
    asyncFunction: async ({ inventoriedUuid }: { inventoriedUuid: string }) => {
      return await deleteInventoried(inventoriedUuid);
    },
    queryKey: queryKey.inventoried.inventoriedList,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      setIsOpenDeleteDialog(false);
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: InventoriedListItem) {
    setToDelete(item);
    setIsOpenDeleteDialog(true);
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ inventoriedUuid: toDelete.uuid });
    }
  }

  function handleViewDetail(item: InventoriedListItem) {
    navigate(`/operacional/inventariado/${item.uuid}`);
  }

  // ---- Ação Relatório (S4) — abre PDF em nova aba, feedback por linha ------
  const [reportLoadingUuid, setReportLoadingUuid] = useState<string | null>(null);

  async function handleReport(uuid: string) {
    setReportLoadingUuid(uuid);
    try {
      const blob = await downloadInventoriedReport(uuid);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.singularLabel, description: text.report.popupBlocked });
      }
    } catch {
      toaster.error({ title: text.singularLabel, description: text.report.error });
    } finally {
      setReportLoadingUuid(null);
    }
  }

  const columnHelper = createColumnHelper<InventoriedListItem>();
  const defaultColumns = useMemo(
    () => [
      // COL-IDX-01 — Data (= created_at, DEF-02; campo JSON `date`).
      columnHelper.accessor('date', {
        header: text.list.table.date,
        enableHiding: false,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        meta: styleColumTable.date,
      }),
      // COL-IDX-02 — Quantidade de Animais.
      columnHelper.accessor('animals_count', {
        header: text.list.table.animalsCount,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCount(row.original.animals_count)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // COL-IDX-03 — Em Lote (status 1).
      columnHelper.accessor('em_lote', {
        header: text.list.table.inBatch,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCount(row.original.em_lote)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // COL-IDX-04 — Fora do Lote (status 2).
      columnHelper.accessor('fora_do_lote', {
        header: text.list.table.outOfBatch,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCount(row.original.fora_do_lote)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // COL-IDX-05 — Faltantes na Planilha (status 3).
      columnHelper.accessor('faltantes', {
        header: text.list.table.missing,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCount(row.original.faltantes)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // COL-IDX-06 — Ação (Visualizar/Relatório/Excluir). Visualizar e
      // Relatório sempre renderizados (ACT-01/ACT-02, `report` não tem gate
      // próprio no legado — DEF-01 aplicou `_view` no backend, sem impacto
      // aqui já que a rota inteira já exige `_view`).
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => handleViewDetail(row.original)}
              >
                {text.list.actions.view}
              </Actions.Item>
              <Actions.Item
                icon={<Icon as={FiFileText} />}
                onClick={() => handleReport(row.original.uuid)}
                disabled={reportLoadingUuid === row.original.uuid}
              >
                {text.list.actions.report}
              </Actions.Item>
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
        meta: { ...styleColumTable.sm, gridOrder: 'fixed-end' },
      }),
    ],
    [navigate, text, canDelete, isDeleting, reportLoadingUuid]
  );

  const isLoading = checkLoadingStatus([inventoriedList]);
  const items = inventoriedList.data?.data?.items;
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
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={inventoriedList.isError}
            error={inventoriedList.error}
            isEmpty={isEmpty}
            onRetry={() => inventoriedList.refetch()}
            isRetrying={inventoriedList.isFetching}
            emptyIcon={FiClipboard as ElementType}
            emptyTitle={text.list.emptyState.title}
            emptyDescription={text.list.emptyState.description}
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          setIsOpenDeleteDialog(false);
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        tone="danger"
        warningText={text.list.deleteDialog.warning}
      />
    </ContainerGrid>
  );
}
