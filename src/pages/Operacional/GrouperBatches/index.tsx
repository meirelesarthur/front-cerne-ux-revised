// src/pages/Operacional/GrouperBatches/index.tsx
// -----------------------------------------------------------------------------
// Tela "Agrupar Lotes" (GrouperBatch — Operacional / Pecuária /
// Transferências, execução 042, TASK-FE-042-303) — rota
// `/operacional/agrupar-lotes` (TASK-FE-042-306). Grid mirror ESTRUTURAL de
// `Administrativo/SaldoEstoque/index.tsx` (grid + `rowSelection` + botão
// "Agrupar" no header), MAS a fonte de dados é `useBatchesList`/`getBatches`
// de `CadastrosBase/Batches/` (D-front-1, reuso — NENHUM service de listagem
// novo criado nesta tela).
//
// Colunas: checkbox de seleção · `code` · `description` · `total_animals` —
// SEM Status, SEM Ações (D-front-1). Seleção múltipla CONTROLADA por `uuid`,
// SEM regra de rejeição (D-front-2/13, diferente de `SaldoEstoque` — qualquer
// combinação de lotes é aceita no cliente).
//
// `handleClickAgrupar`: <2 selecionados → `toaster.warning` (D-front-3), SEM
// desabilitar o botão; ≥2 → `GET /grouper-batches` (lookup); sucesso abre
// `GroupBatchesModal`; erro → `toaster.error` (D-front-4), modal não abre.
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Layers } from 'lucide-react';

import { useBatchesList } from '@/pages/CadastrosBase/Batches/useBatches';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Checkbox } from '@/components/ui/checkbox';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';

import { queryKey } from '@/constants/query-key';

import { lookupGrouperBatches } from '@/services/v2/GrouperBatches/grouper-batch-service';

import type { BatchData, BatchFilterForm } from '@/@types/v2/Batches';
import type { GrouperBatchLookupItem } from '@/@types/v2/GrouperBatches';

import { FilterSideGrouperBatches } from './FilterSideGrouperBatches';
import { GroupBatchesModal } from './GroupBatchesModal';
import { HeaderTable } from './HeaderTable';
import { NewBatchModal } from './NewBatchModal';
import { useGroupBatches } from './useGroupBatches';

import type { RowSelectionState } from '@tanstack/react-table';

export default function GrouperBatchesList() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.grouperBatches.grouperBatch;

  // Permissão ÚNICA da tela (D-front-2, mirror `SaldoEstoque`'s `canGroup =
  // can('stocks_view')` — aqui não há permissão de "ver" separada de
  // "agrupar"/"criar", SC-B03/AM-005 do contrato legado confirmam).
  const canGroup = can('grouper_batches');
  const canCreate = can('grouper_batches');

  // Seleção múltipla CONTROLADA por `uuid` — SEM regra de rejeição
  // (D-front-2/13, diferente de `SaldoEstoque`, que rejeita unidades
  // diferentes; aqui qualquer combinação de lotes é aceita no cliente, a
  // regra real — mesma fazenda — já é garantida pelo escopo de tenant).
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Prévia sob demanda (`GET /grouper-batches`, disparada no clique de
  // "Agrupar") — `useState`+`try/catch/finally`, SEM `useQuery`/query-key
  // nova (D-front-3/4, mirror `SaldoEstoque/index.tsx::handleClickAgrupar`).
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState<GrouperBatchLookupItem[]>([]);

  const {
    open: isGroupModalOpen,
    onOpen: onOpenGroupModal,
    onClose: onCloseGroupModal,
  } = useDisclosure();

  const {
    open: isNewBatchModalOpen,
    onOpen: onOpenNewBatchModal,
    onClose: onCloseNewBatchModal,
  } = useDisclosure();

  const groupMutation = useGroupBatches({
    onSuccess: () => {
      onCloseGroupModal();
      setRowSelection({});
      setPreviewRows([]);
    },
  });

  // Paginação — `storageKey` PRÓPRIO desta tela (NUNCA reusar o de
  // `Batches/`, que persiste filtro/página separado).
  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'OperacionalGrouperBatches' + queryKey.batches.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BatchFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  // Dados do grid — `useBatchesList`/`getBatches` de `Batches/` (D-front-1,
  // reuso; NENHUM service de listagem novo criado nesta tela).
  const batchesList = useBatchesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const items = batchesList.data?.data?.items ?? [];

  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );

  // Clique em "Agrupar": exige ≥ 2 (alerta no clique, NÃO desabilita o botão
  // — fiel ao legado, D-front-3). Sucesso abre o modal com a prévia
  // resolvida; erro exibe toast e o modal NÃO abre (D-front-4, substitui o
  // silêncio do legado — mandato "nenhum estado silencioso").
  async function handleClickAgrupar() {
    if (selectedUuids.length < 2) {
      toaster.warning({
        title: text.group.alertTitle,
        description: text.group.selectAtLeastTwoAlert,
      });
      return;
    }

    setIsFetchingPreview(true);
    try {
      const response = await lookupGrouperBatches({ batch_uuids: selectedUuids });
      setPreviewRows(response.data);
      onOpenGroupModal();
    } catch {
      toaster.error({
        title: text.group.previewErrorTitle,
        description: text.group.previewErrorToast,
      });
    } finally {
      setIsFetchingPreview(false);
    }
  }

  const columnHelper = createColumnHelper<BatchData>();
  const defaultColumns = useMemo(
    () => [
      ...(canGroup
        ? [
            columnHelper.display({
              id: 'select',
              header: '',
              enableHiding: false,
              cell: ({ row }: any) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={() => row.toggleSelected()}
                  aria-label={row.original.description}
                />
              ),
              meta: {
                gridLabel: text.group.buttonLabel,
                gridOrder: 'fixed-start',
                gridDataColumn: false,
              },
            }),
          ]
        : []),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        enableHiding: false,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.description}</Text>,
      }),
      columnHelper.accessor('total_animals', {
        header: text.list.table.totalAnimals,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.total_animals ?? 0}
          </Text>
        ),
      }),
    ],
    [canGroup, text]
  );

  const isLoading = checkLoadingStatus([batchesList]);
  const isEmpty = !isLoading && items.length === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={canGroup}
        getRowId={(row: BatchData) => row.uuid}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              canGroup={canGroup}
              canCreate={canCreate}
              isFetchingPreview={isFetchingPreview}
              onClickGroup={handleClickAgrupar}
              onOpenNewBatchModal={onOpenNewBatchModal}
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
            isError={batchesList.isError}
            error={batchesList.error}
            isEmpty={isEmpty}
            onRetry={() => batchesList.refetch()}
            isRetrying={batchesList.isFetching}
            emptyIcon={Layers as ElementType}
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
            onCreate={onOpenNewBatchModal}
          />
        </Box>
      </TableProvider>

      <FilterSideGrouperBatches
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* Modal "Agrupar" — só renderizado quando o usuário PODE agrupar; abre
          já com a prévia resolvida (nunca com spinner interno). */}
      {canGroup && (
        <GroupBatchesModal
          isOpen={isGroupModalOpen}
          onClose={onCloseGroupModal}
          previewRows={previewRows}
          languageGB={languageGB}
          mutation={groupMutation}
        />
      )}

      {canCreate && <NewBatchModal isOpen={isNewBatchModalOpen} onClose={onCloseNewBatchModal} />}
    </ContainerGrid>
  );
}
