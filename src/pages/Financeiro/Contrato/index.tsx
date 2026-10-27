// src/pages/Financeiro/Contrato/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Gestão de Contratos (Contract — Financeiro,
// esteira 97-Esteiras/023, TASK-CTR-FE-07). Rota `/financeiro/contratos`
// (guardada por `contracts_view`, JÁ RESERVADA em `navigationTree.ts:580`/
// `navigationPermissions.ts:233` — este arquivo não mexe em rota/menu,
// wiring real é `TASK-CTR-FE-09`).
//
// Estrutura mirror `Administrativo/Solicitacao/index.tsx` (grid flat,
// `useCustomGridQuery` INLINE — sem wrapper de hook intermediário) +
// `useGridSettings`/`GridSettingsFloatingPanel` (protocolo padrão v2). Header
// de ações (adicionar/grid settings/filtro) INLINE nesta tela — não existe
// `HeaderTable.tsx` separado (fora do escopo de "Arquivos Afetados" da
// Tarefa; mesmo resultado visual, um arquivo a menos).
//
// `GET /contracts` já filtra por `farm_id` server-side (`HasFarmTenantScope`
// genérico, DA-CT-02, Contrato de tela §2) — esta tela NÃO reaplica filtro
// de fazenda manualmente (Riscos + solução da Tarefa).
//
// Colunas (ordem do task-packet — código/documento primeiro, ação por
// último): code, number, provider.label, employee.label, date,
// expiration_date, installments, quantity, amount (moeda, Text simples, SEM
// Badge — campo numérico informativo, não enum), ações (Editar/Excluir,
// gate contracts_edit/contracts_delete).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FileSignature } from 'lucide-react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
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
import { useTable } from '@/hooks/useTable';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteContract, listContracts } from '@/services/v2/Contracts/contract-service';

import type { ContractFilterForm, ContractListItem } from '@/@types/v2/Contracts';

import { FilterSideContrato } from './FilterSideContrato';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// `amount` já vem NUMBER do `ContractResource` (sempre recalculado
// server-side, DA-CT-06) — sem cast `Number(...)` de string, diferente de
// `formatCurrencyBRL` de telas que recebem `decimal:2` cru como string.
function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ContratoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can('contracts_create');
  const canEdit = can('contracts_edit');
  const canDelete = can('contracts_delete');

  // Paginação (`userPaginatedQuery`) e personalização de grid
  // (`useGridSettings`) derivam da MESMA expressão de chave para nunca
  // divergirem (DEC-007 §12, mirror SolicitacaoList/DiagnosisPregnancy).
  const contractsStorageKey =
    languageGB.contracts.contract.titleModule + queryKey.contracts.contractsList + ':v1';

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: contractsStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ContractFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ContractListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const contractsList = useCustomGridQuery<ContractListItem, ContractFilterForm>({
    asyncFunction: listContracts,
    queryKey: queryKey.contracts.contractsList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as ContractFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ contractUuid }: { contractUuid: string }) => {
      return await deleteContract(contractUuid);
    },
    queryKey: queryKey.contracts.contractsList,
    queryKey2: queryKey.contracts.contract,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/
    // create/apply/export/revoke/restore) — "update" é a mesma convenção de
    // SolicitacaoList/DiagnosisPregnancy/CentroCusto para a mesma operação.
    // O texto exibido no toast vem de `personalizedMessage`, então o rótulo
    // genérico associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). Guarda de FK 422
    // ("Contrato está em uso e não pode ser excluído", DA-CT-09) tratada
    // aqui como qualquer outro erro de negócio (toast com a message do
    // envelope) — mesmo padrão de SolicitacaoList, sem customização especial.
    typesRequest: 'update',
    entityName: languageGB.contracts.contract.singularLabel,
    personalizedMessage: languageGB.contracts.contract.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (contract: ContractListItem) => {
    setToDelete(contract);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ contractUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ContractListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: languageGB.contracts.contract.list.table.code,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.contracts.contract.list.table.code,
        },
      }),
      columnHelper.accessor('number', {
        header: languageGB.contracts.contract.list.table.number,
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium">
            {row.original.number}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.contracts.contract.list.table.number,
        },
      }),
      columnHelper.accessor((row) => row.provider?.label ?? '', {
        id: 'provider',
        header: languageGB.contracts.contract.list.table.provider,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.provider?.label ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.contracts.contract.list.table.provider,
        },
      }),
      columnHelper.accessor((row) => row.employee?.label ?? '', {
        id: 'employee',
        header: languageGB.contracts.contract.list.table.employee,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.employee?.label ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.contracts.contract.list.table.employee,
        },
      }),
      columnHelper.accessor('date', {
        header: languageGB.contracts.contract.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: {
          ...styleColumTable.date,
          gridLabel: languageGB.contracts.contract.list.table.date,
        },
      }),
      columnHelper.accessor('expiration_date', {
        header: languageGB.contracts.contract.list.table.expirationDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.expiration_date)}
          </Text>
        ),
        meta: {
          ...styleColumTable.date,
          gridLabel: languageGB.contracts.contract.list.table.expirationDate,
        },
      }),
      columnHelper.accessor('installments', {
        header: languageGB.contracts.contract.list.table.installments,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right">
            {row.original.installments}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.contracts.contract.list.table.installments,
        },
      }),
      columnHelper.accessor('quantity', {
        header: languageGB.contracts.contract.list.table.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right" fontVariantNumeric="tabular-nums">
            {row.original.quantity}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.contracts.contract.list.table.quantity,
        },
      }),
      // Campo numérico informativo (sempre recalculado server-side,
      // DA-CT-06) — Text simples, SEM Badge (não é enum, task-packet
      // `## Objetivo`).
      columnHelper.accessor('amount', {
        header: languageGB.contracts.contract.list.table.amount,
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
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.contracts.contract.list.table.amount,
        },
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
                  onClick={() => navigate(`/financeiro/contratos/${row.original.uuid}`)}
                >
                  {languageGB.contracts.contract.list.table.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  tone="danger"
                  disabled={isDeleting}
                >
                  {languageGB.contracts.contract.list.table.actions.delete}
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
    [navigate, isDeleting, languageGB, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<ContractListItem>({
    storageKey: contractsStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([contractsList]);
  const items = contractsList.data?.data?.items;
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
        <ContractRowSelectionNavigate />

        <HeaderGrid
          header={
            <>
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate('/financeiro/contratos/novo')}
                  languageGB={languageGB}
                />
              )}
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
            </>
          }
        >
          <PageHeader title={languageGB.contracts.contract.list.pageTitle} description={languageGB.contracts.contract.list.pageSubtitle} />
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
            isError={contractsList.isError}
            error={contractsList.error}
            isEmpty={isEmpty}
            onRetry={() => contractsList.refetch()}
            isRetrying={contractsList.isFetching}
            emptyIcon={FileSignature as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? languageGB.contracts.contract.list.emptyState.titleFiltered
                : languageGB.contracts.contract.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? languageGB.contracts.contract.list.emptyState.descriptionFiltered
                : languageGB.contracts.contract.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={languageGB.contracts.contract.list.emptyState.cta}
            onCreate={() => navigate('/financeiro/contratos/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideContrato
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
        itemName={toDelete?.code ?? toDelete?.number}
        tone="danger"
      />
    </ContainerGrid>
  );
}

// Ao selecionar uma linha da grid, navega para a edição (padrão do projeto,
// mirror `Administrativo/Solicitacao/HeaderTable.tsx`) — precisa estar
// DENTRO do `<TableProvider>` (consome `useTable()`), por isso um componente
// interno em vez de um hook solto no corpo de `ContratoList`.
function ContractRowSelectionNavigate() {
  const navigate = useNavigate();
  const { table } = useTable();

  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as
      ContractListItem | undefined;
    if (selected?.uuid) {
      navigate(`/financeiro/contratos/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return null;
}
