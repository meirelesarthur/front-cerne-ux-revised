// src/pages/BaseRegistrations/Apportionments/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM de Rateio - Categoria Financeira (Apportionment, Cadastros
// Base → Estrutura, TASK-AP-FE-07). Rota `/cadastros-base/rateios-categorias`
// (registrada em TASK-AP-FE-09).
//
// Mirror estrutural de `BaseRegistrations/DiagnosisPregnancy/index.tsx`
// (`useCustomGridQuery` inline, SEM ID de contexto — Apportionment é catálogo
// por fazenda via `X-Farm-Id`, não filho de outra entidade) +
// `Financeiro/MovCaixaBancario/index.tsx` (`GridSettings`,
// `useGridSettings`/`GridSettingsFloatingPanel`, regra 8 do protocolo v2).
//
// Exclusão via `useRequest` GENÉRICO (não `useMutation` dedicado) — o
// destroy do contrato (`Apportionment-contrato.md ## 3`/DA-AP-14) é uma
// guarda 23503 simples, sem shape estruturado `errors.in_use[]` (diferente
// de `AccountingGrouper`/`Addressing`) — o `onError` interno do `useRequest`
// já prioriza `extractApiFieldErrorMessage` antes do fallback genérico
// (mirror `DiagnosisPregnancyList`, mesma decisão documentada lá).
//
// [RISCO herdado da ficha] Sem prova de render contra dado real — a tela
// compila e a estática passa, mas paginação/vazio/erro reais só são
// confirmáveis quando a API (`api`, TASK-AP-0N) estiver `done`.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Percent } from 'lucide-react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteApportionment,
  listApportionments,
} from '@/services/v2/BaseRegistrations/apportionment-service';
import type { ListApportionmentsParams } from '@/services/v2/BaseRegistrations/apportionment-service';

import type {
  ApportionmentData,
  ApportionmentFilterForm,
} from '@/@types/v2/BaseRegistrations/apportionment';

import { FilterSideApportionment } from './FilterSideApportionment';
import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `MOV_CAIXA_BANCARIO_STORAGE_KEY` de `MovCaixaBancario/index.tsx`).
const APPORTIONMENTS_STORAGE_KEY =
  'BaseRegistrationsApportionments' + queryKey.baseRegistrations.apportionments;

// TASK-AP-FE-17 — guarda numérica (mesma disciplina de `Number(x) || 0` já
// usada em `CreateOrUpdateApportionment.tsx:299-303`): `total_ha`/
// `total_percentage` chegam `undefined` sempre que a Resource de LISTAGEM
// (`ApportionmentResource::toArray()`, `whenLoaded('items', ...)`) não tem
// `items` eager-loaded — o que é o caso de `GET /apportionments`
// (`ApportionmentRepository::listWithFilters()` só carrega
// `financialCategory`). `Number(undefined)` é `NaN`, e `NaN.toLocaleString()`
// devolve a STRING `"NaN"`. Coage para `0` antes de formatar; elimina o
// sintoma independente da causa raiz (sinal de possível lacuna de API
// reportado ao Maestro, fora do escopo desta correção).
function formatHa(value: number): string {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ApportionmentList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.apportionment;

  const canCreate = can('apportionments_create');
  const canEdit = can('apportionments_edit');
  const canDelete = can('apportionments_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: APPORTIONMENTS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ApportionmentFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ApportionmentData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const apportionmentsList = useCustomGridQuery<ApportionmentData, ListApportionmentsParams>({
    asyncFunction: listApportionments,
    queryKey: queryKey.baseRegistrations.apportionments,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {
      search: paginatedQuery.filter?.search || undefined,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ apportionmentUuid }: { apportionmentUuid: string }) => {
      return await deleteApportionment(apportionmentUuid);
    },
    queryKey: queryKey.baseRegistrations.apportionments,
    queryKey2: queryKey.baseRegistrations.apportionment,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por `DiagnosisPregnancyList`/`MovimentoList`
    // para a mesma operação (o rótulo genérico associado a "update" nunca
    // aparece, o texto exibido vem de `personalizedMessage`).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (apportionment: ApportionmentData) => {
    setToDelete(apportionment);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ apportionmentUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ApportionmentData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.financial_category?.description ?? '', {
        id: 'financialCategory',
        header: text.list.table.financialCategory,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={Percent} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.financial_category.code} — {row.original.financial_category.description}
            </Text>
          </Flex>
        ),
        meta: { gridLabel: text.list.table.financialCategory },
      }),
      columnHelper.accessor('total_ha', {
        header: text.list.table.totalHa,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatHa(row.original.total_ha)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.totalHa },
      }),
      columnHelper.accessor('total_percentage', {
        header: text.list.table.totalPercentage,
        cell: ({ row }) => (
          <Badge colorPalette="gray" variant="outline">
            {formatHa(row.original.total_percentage)}%
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.totalPercentage },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`/cadastros-base/rateios-categorias/${row.original.uuid}`)
                  }
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB, canEdit, canDelete, text]
  );

  const gridSettings = useGridSettings<ApportionmentData>({
    storageKey: APPORTIONMENTS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([apportionmentsList]);
  const items = apportionmentsList.data?.data?.items;
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
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
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
            isError={apportionmentsList.isError}
            error={apportionmentsList.error}
            isEmpty={isEmpty}
            onRetry={() => apportionmentsList.refetch()}
            isRetrying={apportionmentsList.isFetching}
            emptyIcon={Percent as ElementType}
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
            onCreate={() => navigate('/cadastros-base/rateios-categorias/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideApportionment
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
        itemName={toDelete?.financial_category?.description}
        tone="danger"
      />
    </ContainerGrid>
  );
}
