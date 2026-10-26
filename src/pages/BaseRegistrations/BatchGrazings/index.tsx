// src/pages/BaseRegistrations/BatchGrazings/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL, SEM
// filtro — mirror `Grazings/index.tsx`, `contrato-fe-lote-modulo.md §2`) do
// vínculo Lote/Módulo (BatchGrazing) — Cadastros Base / Pecuários.
// Rota: /cadastros-base/lote-modulo (guardada por `batch_grazing_view`,
// registrada em TASK-FE-2004, junto com as rotas irmãs `/novo`/`/:uuid`).
//
// Ações de linha: SÓ Visualizar (`FiEye`, navega para `/:uuid`) + Excluir
// (`FiTrash2`) — SEM Editar (a API não tem `PUT`/`PATCH`, D1 do contrato de
// API `contrato-lote-modulo.md`) — intencional, não remover o ícone "por
// engano" depois.
//
// Exclusão: `useMutation` DIRETO (TanStack), NÃO `useRequest` — mirror da
// convenção do projeto (`Grazings/index.tsx`), embora aqui não haja 422
// estruturado de bloqueio (`contrato-fe-lote-modulo.md §2`: "não há 422
// estruturado de 'in_use' documentado... o onError genérico basta").
// NÃO-DESTRUTIVA: o backend encerra o vínculo com registro de saída, nunca
// apaga histórico (D3/D12 do contrato de API) — por isso o diálogo usa a
// cópia de `baseRegistrations.batchGrazing.deleteDialog`, NÃO o texto
// genérico "esta ação não pode ser desfeita".
//
// Métricas (`animals_quantity`/`ua_quantity`/`taxa_lotacao_ua`) vêm sempre do
// `BatchGrazingResource` (nunca recalculadas no client) — `0` é valor
// legítimo, checagem explícita de `null`/`undefined`, nunca `campo || '-'`
// (mesmo cuidado de `Grazings/index.tsx`).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEye, FiLink2, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteBatchGrazing } from '@/services/v2/BaseRegistrations/batch-grazings-service';

import type { BatchGrazingListItem } from '@/@types/v2/BaseRegistrations/batch-grazings';

import { HeaderTable } from './HeaderTable';
import { useBatchGrazingList } from './useBatchGrazings';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// estável, mirror `Grazings/index.tsx` (`GRAZINGS_STORAGE_KEY`).
const BATCH_GRAZINGS_STORAGE_KEY =
  'BaseRegistrationsBatchGrazings' + queryKey.batchGrazings.batchGrazingsList;

// Quantos lotes exibir como badge antes de agrupar em "+N" — mirror da
// convenção de truncamento do contrato de tela (`contrato-fe-lote-modulo.md
// §2`, "truncar em N + '+X'").
const MAX_VISIBLE_BATCH_BADGES = 3;

export default function BatchGrazingsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.batchGrazing;

  const canDelete = can('batch_grazing_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: BATCH_GRAZINGS_STORAGE_KEY,
    }),
    []
  );

  // pageSize 10 = paginação REAL, per_page dinâmico. SEM filtro — a feature
  // não tem busca (contrato de tela §2). `Record<string, never>` satisfaz o
  // genérico de filtro sem criar nenhuma chave de negócio.
  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<Record<string, never>>(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<BatchGrazingListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const batchGrazingsList = useBatchGrazingList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  // `useMutation` DIRETO (não `useRequest`) — mirror `Grazings/index.tsx`.
  // NÃO-destrutiva: o backend fecha o vínculo com registro de saída, nunca
  // apaga histórico (D3/D12 do contrato de API).
  const deleteMutation = useMutation({
    mutationFn: async (batchGrazingUuid: string) => await deleteBatchGrazing(batchGrazingUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.batchGrazings.batchGrazingsList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('BatchGrazing delete - error:', error);

      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  const handleDeleteClick = (batchGrazing: BatchGrazingListItem) => {
    setToDelete(batchGrazing);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  };

  const columnHelper = createColumnHelper<BatchGrazingListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        enableHiding: false,
        meta: { gridLabel: text.list.table.code },
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
      }),
      // `grazing` sempre vem eager-carregado (é a raiz do agrupamento do
      // índice, contrato de API §1.2 item 3 — só módulos com ≥1 lote
      // vinculado aparecem) — sem necessidade de `?.` defensivo aqui.
      columnHelper.accessor((row) => row.grazing.description, {
        id: 'grazing',
        header: text.list.table.grazing,
        enableHiding: false,
        meta: { gridLabel: text.list.table.grazing },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.grazing.description}
          </Text>
        ),
      }),
      // Lotes vinculados — badges truncadas em `MAX_VISIBLE_BATCH_BADGES` +
      // "+N" (contrato de tela §2).
      columnHelper.accessor('batches', {
        header: text.list.table.batches,
        meta: { gridLabel: text.list.table.batches },
        cell: ({ row }) => {
          const batches = row.original.batches;
          const visible = batches.slice(0, MAX_VISIBLE_BATCH_BADGES);
          const remaining = batches.length - visible.length;
          return (
            <Flex gap={1} wrap="wrap">
              {visible.map((batch) => (
                <Badge key={batch.uuid} colorPalette="gray" variant="subtle">
                  {batch.description}
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge colorPalette="gray" variant="outline">
                  +{remaining}
                </Badge>
              )}
            </Flex>
          );
        },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        meta: { gridLabel: text.list.table.date },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
      }),
      // `employee` pode vir `null`/ausente — a coluna física `employee_id`
      // nunca é preenchida por este fluxo (§9 do contrato de API, D6),
      // acesso SEMPRE via `?.`, placeholder "—" sem quebrar a renderização.
      columnHelper.accessor((row) => row.employee?.name, {
        id: 'employee',
        header: text.list.table.employee,
        meta: { gridLabel: text.list.table.employee },
        cell: ({ row }) => (
          <Text fontSize="sm" color={row.original.employee?.name ? undefined : 'fg.muted'}>
            {row.original.employee?.name ?? '—'}
          </Text>
        ),
      }),
      // Métricas do backend — `0` é valor legítimo (módulo recém-vinculado
      // com poucos animais), NUNCA `campo || '-'`, checagem explícita de
      // `null`/`undefined` (mesmo cuidado de `Grazings/index.tsx`).
      columnHelper.accessor('animals_quantity', {
        header: text.list.table.animalQuantity,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.animalQuantity },
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.animals_quantity === null || row.original.animals_quantity === undefined
              ? '—'
              : row.original.animals_quantity}
          </Text>
        ),
      }),
      columnHelper.accessor('ua_quantity', {
        header: text.list.table.uaQuantity,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.uaQuantity },
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.ua_quantity === null || row.original.ua_quantity === undefined
              ? '—'
              : row.original.ua_quantity}
          </Text>
        ),
      }),
      columnHelper.accessor('taxa_lotacao_ua', {
        header: text.list.table.stockingRate,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.stockingRate },
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.taxa_lotacao_ua === null || row.original.taxa_lotacao_ua === undefined
              ? '—'
              : row.original.taxa_lotacao_ua}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/cadastros-base/lote-modulo/${row.original.uuid}`)}
              >
                {text.list.actions.view}
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB, text, canDelete]
  );

  const gridSettings = useGridSettings<BatchGrazingListItem>({
    storageKey: BATCH_GRAZINGS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([batchGrazingsList]);
  const items = batchGrazingsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid header={<HeaderTable languageGB={languageGB} gridSettings={gridSettings} />}>
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={batchGrazingsList.isError}
            error={batchGrazingsList.error}
            isEmpty={isEmpty}
            onRetry={() => batchGrazingsList.refetch()}
            isRetrying={batchGrazingsList.isFetching}
            emptyIcon={FiLink2 as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={can('batch_grazing_create')}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/lote-modulo/novo')}
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
        title={text.deleteDialog.title}
        description={text.deleteDialog.description}
        warningText={text.deleteDialog.warningText}
        confirmButtonText={text.deleteDialog.confirm}
        itemName={toDelete ? `${toDelete.grazing.description} (${toDelete.code})` : undefined}
        hideQuestionMark
        tone="warning"
      />
    </ContainerGrid>
  );
}
