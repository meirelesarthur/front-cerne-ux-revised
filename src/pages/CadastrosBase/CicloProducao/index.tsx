// src/pages/CadastrosBase/CicloProducao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CICLOS DE PRODUÇÃO — Cadastros Base / Agrícola.
// Rota: /cadastros-base/ciclo-producao (guarda `production-cycles_view`).
// TASK-FE-01 (97-Esteiras/033) — fundação de dados + grid + detalhe + rotas
// de leitura. FORM create/edit fica para TASK-FE-02 (rota `/novo` referenciada
// pelo `HeaderTable`/`EmptyState` ainda NÃO é registrada nesta Tarefa).
//
// UX-GAP declarado (FID-G3F §1): sem tela desenhada no `ux_root` para Ciclo
// de Produção — decisão do dono = seguir-pelo-padrão. Estrutura mirror de
// `CadastrosBase/Safra/index.tsx` (grid+detalhe+clique-na-linha), adaptada ao
// contrato real de `production-cycles` (C40 do FID-G3F: 7 colunas — Código/
// Responsável/Safra/Data/Início/Fim/Ações; "Responsável" = `employee?.name ??
// user?.name`).
//
// SEM drawer de filtro nesta Tarefa — `Arquivos-Alvo` da TASK-FE-01 não lista
// um `FilterSideCicloProducao` próprio, e a DoD admite explicitamente "caso
// contrário, sem filtro". `ProductionCycleFilterForm` (harvest_uuid/
// user_uuid/start_date/end_date, C26 legado) já está tipado em
// `@types/v2/ProductionCycles` para quando o painel for materializado (Gap/
// Tarefa própria), sem inventar UI aqui.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ElementType } from 'react';
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

import { deleteProductionCycle } from '@/services/v2/ProductionCycles/production-cycle-service';

import type { ProductionCycle, ProductionCycleFilterForm } from '@/@types/v2/ProductionCycles';

import { HeaderTable } from './HeaderTable';
import { useProductionCyclesList } from './useProductionCycles';

// Clique na linha (fora da coluna de ações) navega para o Detalhe — mesmo
// mecanismo de `RowClickToDetail` de Safra/index.tsx (precisa estar DENTRO do
// `<TableProvider>` para ler `useTable()`).
function RowClickToDetail() {
  const navigate = useNavigate();
  const { table } = useTable();

  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as ProductionCycle | undefined;
    if (selected?.uuid) {
      navigate(`/cadastros-base/ciclo-producao/${selected.uuid}/detalhe`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return null;
}

export default function CicloProducaoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.productionCycles.productionCycle;

  const canCreate = can('production-cycles_create');
  const canEdit = can('production-cycles_edit');
  const canDelete = can('production-cycles_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseCicloProducao' + queryKey.productionCycles.productionCycles,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<ProductionCycleFilterForm>(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ProductionCycle | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const productionCyclesList = useProductionCyclesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ productionCycleUuid }: { productionCycleUuid: string }) => {
      return await deleteProductionCycle(productionCycleUuid);
    },
    queryKey: queryKey.productionCycles.productionCycles,
    queryKey2: queryKey.productionCycles.productionCycle,
    // `useRequest` não tem variante "delete" (mesma observação de
    // Safra/CentroCusto) — o texto do toast vem de `personalizedMessage`, o
    // rótulo genérico de "update" nunca aparece.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (productionCycle: ProductionCycle) => {
    setToDelete(productionCycle);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ productionCycleUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ProductionCycle>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.employee?.name ?? row.original.user?.name ?? '—'}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'harvest',
        header: text.list.table.harvest,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.harvest?.description ?? '—'}
          </Text>
        ),
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
      columnHelper.accessor('start_date', {
        header: text.list.table.startDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.start_date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('end_date', {
        header: text.list.table.endDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.end_date)}
          </Text>
        ),
        meta: styleColumTable.date,
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
                  navigate(`/cadastros-base/ciclo-producao/${row.original.uuid}/detalhe`)
                }
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/ciclo-producao/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([productionCyclesList]);
  const isError = productionCyclesList.isError;
  const items = productionCyclesList.data?.data?.items;
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
            isError={isError}
            error={productionCyclesList.error}
            isEmpty={isEmpty}
            onRetry={() => productionCyclesList.refetch()}
            isRetrying={productionCyclesList.isFetching}
            emptyIcon={FiRefreshCw as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/ciclo-producao/novo')}
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
        itemName={toDelete?.code}
      />
    </ContainerGrid>
  );
}
