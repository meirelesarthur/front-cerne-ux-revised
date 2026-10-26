// src/pages/BaseRegistrations/ParameterWeights/index.tsx
// Tela de LISTAGEM de Parâmetros / Peso (Cadastros Base → Pecuários).
//
// Mirror estrutural de `src/pages/BaseRegistrations/DiagnosisPregnancy/index.tsx`
// (grid flat real, paginação server-side, hook de grid INLINE — sem
// `useParameterWeights.tsx` intermediário, proibido pela ficha).
//
// Exclusão: `useMutation`/`useQueryClient` do TanStack Query DIRETO (mesmo
// racional documentado em `Marcadores/index.tsx` — o `onError` genérico do
// `useRequest` só lê `message`, nunca `errors`, o que esconderia
// `errors.in_use`). 422 estruturado normalizado por `extractInUseItems` abre
// o `InUseBlockedDialog` genérico (caminho ESPERADO: 135/167 registros reais,
// 81%, têm vínculo em `batches`).
//
// Preparação para personalização de colunas (painel NÃO ligado nesta
// Tarefa — `useGridSettings` não existe em `develop`, ver Lacuna §7 do
// contrato de tela): `meta.gridLabel` em todas as colunas de dado,
// `enableHiding:false` na coluna-âncora `description`, `meta:{gridOrder:
// 'fixed-end', gridDataColumn:false}` na coluna `acoes`, `storageKey`
// extraída para a constante nomeada `PARAMETER_WEIGHTS_STORAGE_KEY`.

import { useMemo, useState } from 'react';

import { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { Scale } from 'lucide-react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
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

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractInUseItems } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';

import { InUseBlockedDialog, type InUseBlockedItem } from '@/components/InUseBlockedDialog';

import { parameterWeightInUseTableLabels } from '@/constants/ParameterWeight/options/parameter-weight-in-use-table-labels';
import { queryKey } from '@/constants/query-key';

import {
  deleteParameterWeight,
  listParameterWeights,
} from '@/services/v2/BaseRegistrations/parameterWeights-service';

import type {
  ParameterWeightListItem,
  ParameterWeightsFilterForm,
} from '@/@types/v2/BaseRegistrations/parameterWeights';

import { FilterSideParameterWeights } from './FilterSideParameterWeights';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

export default function ParameterWeightsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.parameterWeight;

  const canCreate = can('parameter-weight_create');
  const canEdit = can('parameter-weight_edit');
  const canDelete = can('parameter-weight_delete');

  // Derivada da tradução (query-key), NUNCA string literal — reaproveitável
  // pelo futuro `useGridSettings({ storageKey })` (mesma string usada por
  // paginação e personalização de colunas nunca divergirem).
  const PARAMETER_WEIGHTS_STORAGE_KEY =
    languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.parameterWeights;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: PARAMETER_WEIGHTS_STORAGE_KEY,
    }),
    [PARAMETER_WEIGHTS_STORAGE_KEY]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ParameterWeightsFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const parameterWeightsList = useCustomGridQuery<
    ParameterWeightListItem,
    ParameterWeightsFilterForm
  >({
    asyncFunction: listParameterWeights,
    queryKey: queryKey.baseRegistrations.parameterWeights,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as ParameterWeightsFilterForm),
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<ParameterWeightListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use`, mapa
  // `{batches: count}`, shape confirmado por leitura direta de
  // `DeleteParameterWeightAction.php`). Itens normalizados por
  // `extractInUseItems` (FRONT-03-InUseBlockedDialog.md).
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  // ⚠️ NÃO usa `useRequest` aqui — mesma razão documentada em
  // `Marcadores/index.tsx`: o `onError` genérico só lê `message`, nunca
  // `errors`, o que esconderia `errors.in_use`.
  const deleteMutation = useMutation({
    mutationFn: async (parameterWeightUuid: string) =>
      await deleteParameterWeight(parameterWeightUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.parameterWeights] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('ParameterWeight delete - error:', error);

      const inUseItems = extractInUseItems(error);
      if (inUseItems) {
        onCloseDeleteDialog();
        setBlockedInUse(inUseItems);
        onOpenBlockedDialog();
        return;
      }

      // Fallback: qualquer erro que NÃO seja o 422 estruturado de bloqueio
      // (403, 500, 422 residual sem `in_use` populado).
      let errorMessage = languageGB.common.errorLog.unknownError;
      if (isAxiosError(error)) {
        const statusCode = error.response?.status ?? null;
        const resData = error.response?.data as any;
        if (resData?.message) {
          const msg =
            typeof resData.message === 'string' ? resData.message : JSON.stringify(resData.message);
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

  const handleDeleteClick = (parameterWeight: ParameterWeightListItem) => {
    setToDelete(parameterWeight);
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

  const columnHelper = createColumnHelper<ParameterWeightListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        meta: { gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={Scale} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
        meta: { gridLabel: text.list.table.description },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: { gridLabel: text.list.table.date },
      }),
      columnHelper.accessor('info', {
        // Campo pronto do backend (`ParameterWeightListResource.info`) — NÃO
        // recalcular `description + pesos` no front (contrato de leitura de
        // 8 telas).
        header: text.list.table.info,
        meta: { gridLabel: text.list.table.info },
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
                  onClick={() => navigate(`/cadastros-base/parametros-peso/${row.original.uuid}`)}
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
        meta: { gridOrder: 'fixed-end', gridDataColumn: false },
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([parameterWeightsList]);
  const items = parameterWeightsList.data?.data?.items;
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
            isError={parameterWeightsList.isError}
            error={parameterWeightsList.error}
            isEmpty={isEmpty}
            onRetry={() => parameterWeightsList.refetch()}
            isRetrying={parameterWeightsList.isFetching}
            emptyIcon={Scale as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/parametros-peso/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideParameterWeights
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

      <InUseBlockedDialog
        isOpen={isOpenBlockedDialog}
        onClose={handleCloseBlockedDialog}
        title={text.deleteBlocked.title}
        description={text.deleteBlocked.description}
        itemName={toDelete?.description}
        items={blockedInUse}
        closeLabel={languageGB.defaltStrings.close}
        resourceLabelTemplate={text.deleteBlocked.resourceLabel}
        getResourceLabel={(table) => parameterWeightInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
