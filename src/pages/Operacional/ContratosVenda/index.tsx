// src/pages/Operacional/ContratosVenda/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Contratos de Venda (Operacional / Agricultura,
// esteira 036, TASK-FE-036-205). Rota `/operacional/contratos-venda`
// (guardada por `sale-contracts_view`, JÁ RESERVADA em `navigationTree.ts`/
// `navigationPermissions.ts` — este arquivo não mexe em rota/menu, wiring
// real é `TASK-FE-036-207`). Mirror mecânico do precedente arquitetural
// direto apontado pelo contrato de tela: `Financeiro/Contrato/index.tsx`.
//
// Coluna `status`: Badge por token (`SALE_CONTRACT_STATUS_BADGE_VARIANT`,
// `saleContractStatus.ts`) — corrige DIV-007 (rótulo fixo "Em Aberto" do
// legado), nunca hex cru.
//
// Ações Editar/Excluir condicionadas a permissão E `status.value < 2`
// (mirror legado `$item->status < 2`, `index.blade.php:139`) — a condição
// de status SOME o botão mesmo para quem TEM permissão (não é "sem
// permissão", é "contrato avançou de estágio"). `GAP-FE-036-201` (default
// Opção A, aprovado) cobre o reforço opcional na tela de edição; aqui a
// ocultação do botão é obrigatória e não depende do Gap.
//
// REWORK DE FIDELIDADE (`audit-contratos-de-venda.md`, P0 `SC-LST-001`/
// `SC-LST-002`): a API SEMPRE devolve `status` como objeto
// `{value,label,color}` (nunca inteiro puro) — a comparação `row.original.
// status === 1` era sempre falsa (objeto nunca é `===` a `1`), o que
// escondia Editar/Excluir mesmo com permissão, e o Badge renderizava
// `[object Object]`. Corrigido para `row.original.status.value`, ver
// `@types/v2/SaleContracts` (`SaleContractStatus`). Também restaura
// "Responsável" (`SC-LST-004`), "Qtd. Faltante" (`SC-LST-005`, via
// `balance`), formatação numérica de `quantity` (`SC-LST-003`, mirror
// `money()` legado) e a legenda global de status (`SC-LST-010`).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FileSignature } from 'lucide-react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTag } from '@/components/ui/StatusTag';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { useListSearch } from '@/hooks/useListSearch';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useTable } from '@/hooks/useTable';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteSaleContract,
  listSaleContracts,
} from '@/services/v2/SaleContracts/sale-contract-service';

import type { SaleContractFilterForm, SaleContractListItem } from '@/@types/v2/SaleContracts';

import { FilterSideContratosVenda } from './FilterSideContratosVenda';
import { formatSaleContractQuantity } from './saleContractFormat';
import { getSaleContractStatusLabel, getSaleContractStatusDotColor } from './saleContractStatus';

export default function ContratosVendaList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can('sale-contracts_create');
  const canView = can('sale-contracts_view');
  const canEdit = can('sale-contracts_edit');
  const canDelete = can('sale-contracts_delete');

  // Paginação (`userPaginatedQuery`) e personalização de grid
  // (`useGridSettings`) derivam da MESMA expressão de chave (DEC-007 §12,
  // mirror `ContratoList`).
  const saleContractsStorageKey =
    languageGB.saleContracts.saleContract.pluralLabel +
    queryKey.saleContracts.saleContractsList +
    ':v1';

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: saleContractsStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<SaleContractFilterForm>(defaultQueryOptions);
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
  const [toDelete, setToDelete] = useState<SaleContractListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const saleContractsList = useCustomGridQuery<SaleContractListItem, SaleContractFilterForm>({
    asyncFunction: listSaleContracts,
    queryKey: queryKey.saleContracts.saleContractsList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as SaleContractFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ saleContractUuid }: { saleContractUuid: string }) => {
      return await deleteSaleContract(saleContractUuid);
    },
    queryKey: queryKey.saleContracts.saleContractsList,
    queryKey2: queryKey.saleContracts.saleContract,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção de `ContratoList`/`SolicitacaoList` para a mesma
    // operação (o texto exibido no toast vem de `personalizedMessage`).
    typesRequest: 'update',
    entityName: languageGB.saleContracts.saleContract.singularLabel,
    personalizedMessage: languageGB.saleContracts.saleContract.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (saleContract: SaleContractListItem) => {
    setToDelete(saleContract);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ saleContractUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<SaleContractListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: languageGB.saleContracts.saleContract.list.table.code,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.saleContracts.saleContract.list.table.code,
        },
      }),
      columnHelper.accessor('number', {
        header: languageGB.saleContracts.saleContract.list.table.number,
        cell: ({ row }) => (
          <Text fontSize="sm" fontWeight="medium">
            {row.original.number}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.saleContracts.saleContract.list.table.number,
        },
      }),
      columnHelper.accessor((row) => row.client?.label ?? '', {
        id: 'client',
        header: languageGB.saleContracts.saleContract.list.table.client,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.client?.label ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.saleContracts.saleContract.list.table.client,
        },
      }),
      // "Responsável" — coluna restaurada (`SC-LST-004` da auditoria; a API
      // já expõe `responsible.name`, mirror `Auth::id()` readonly legado).
      columnHelper.accessor((row) => row.responsible?.name ?? '', {
        id: 'responsible',
        header: languageGB.saleContracts.saleContract.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.responsible?.name ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.saleContracts.saleContract.list.table.responsible,
        },
      }),
      columnHelper.accessor((row) => row.product?.label ?? '', {
        id: 'product',
        header: languageGB.saleContracts.saleContract.list.table.product,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.product?.label ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.saleContracts.saleContract.list.table.product,
        },
      }),
      columnHelper.accessor((row) => row.harvest?.label ?? '', {
        id: 'harvest',
        header: languageGB.saleContracts.saleContract.list.table.harvest,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.harvest?.label ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.saleContracts.saleContract.list.table.harvest,
        },
      }),
      columnHelper.accessor('date', {
        header: languageGB.saleContracts.saleContract.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: {
          ...styleColumTable.date,
          gridLabel: languageGB.saleContracts.saleContract.list.table.date,
        },
      }),
      columnHelper.accessor('delivery_end_date', {
        header: languageGB.saleContracts.saleContract.list.table.deliveryEndDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.delivery_end_date)}
          </Text>
        ),
        meta: {
          ...styleColumTable.date,
          gridLabel: languageGB.saleContracts.saleContract.list.table.deliveryEndDate,
        },
      }),
      columnHelper.accessor('quantity', {
        header: languageGB.saleContracts.saleContract.list.table.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatSaleContractQuantity(row.original.quantity)}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.saleContracts.saleContract.list.table.quantity,
        },
      }),
      // "Qtd. Faltante" — coluna restaurada (`SC-LST-005`; mirror
      // `quantity - total_quantity` legado, aqui já pronto em `balance`).
      columnHelper.accessor('balance', {
        id: 'missingQuantity',
        header: languageGB.saleContracts.saleContract.list.table.missingQuantity,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatSaleContractQuantity(row.original.balance)}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.saleContracts.saleContract.list.table.missingQuantity,
        },
      }),
      columnHelper.accessor((row) => row.status.value, {
        id: 'status',
        header: languageGB.defaltStrings.statusColumn,
        cell: ({ row }) => (
          <StatusTag
            label={getSaleContractStatusLabel(row.original.status.value, languageGB)}
            color={getSaleContractStatusDotColor(row.original.status.value)}
          />
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.defaltStrings.statusColumn,
        },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {/* "Visualizar" (item 2, homologação 036fix5) — ação
                  read-only, mirror `ExpenseActionsMenu`/legado `sale-
                  contracts` `show`. Sempre disponível para quem acessa a
                  listagem (mesmo gate `sale-contracts_view` da página),
                  independente de `status`/permissão de edição. */}
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() =>
                    navigate(`/operacional/contratos-venda/${row.original.uuid}/visualizar`)
                  }
                >
                  {languageGB.saleContracts.saleContract.list.table.actions.view}
                </Actions.Item>
              )}
              {canEdit && row.original.status.value < 2 && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/operacional/contratos-venda/${row.original.uuid}`)}
                >
                  {languageGB.saleContracts.saleContract.list.table.actions.edit}
                </Actions.Item>
              )}
              {canDelete && row.original.status.value < 2 && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  tone="danger"
                  disabled={isDeleting}
                >
                  {languageGB.saleContracts.saleContract.list.table.actions.delete}
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
    [navigate, isDeleting, languageGB, canView, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<SaleContractListItem>({
    storageKey: saleContractsStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([saleContractsList]);
  const items = saleContractsList.data?.data?.items;
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
        <SaleContractRowSelectionNavigate />

        <HeaderGrid
          header={
            <>
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate('/operacional/contratos-venda/novo')}
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
          <PageHeader
            title={languageGB.saleContracts.saleContract.list.pageTitle}
            description={languageGB.saleContracts.saleContract.list.pageSubtitle}
          />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={saleContractsList.isError}
            error={saleContractsList.error}
            onRetry={() => saleContractsList.refetch()}
            isRetrying={saleContractsList.isFetching}
            isEmpty={isEmpty}
            emptyIcon={FileSignature as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? languageGB.saleContracts.saleContract.list.emptyState.titleFiltered
                : languageGB.saleContracts.saleContract.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? languageGB.saleContracts.saleContract.list.emptyState.descriptionFiltered
                : languageGB.saleContracts.saleContract.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={languageGB.saleContracts.saleContract.list.emptyState.cta}
            onCreate={() => navigate('/operacional/contratos-venda/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideContratosVenda
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
// mirror `ContractRowSelectionNavigate`) — precisa estar DENTRO do
// `<TableProvider>` (consome `useTable()`).
function SaleContractRowSelectionNavigate() {
  const navigate = useNavigate();
  const { table } = useTable();

  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as
      SaleContractListItem | undefined;
    if (selected?.uuid) {
      navigate(`/operacional/contratos-venda/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return null;
}
