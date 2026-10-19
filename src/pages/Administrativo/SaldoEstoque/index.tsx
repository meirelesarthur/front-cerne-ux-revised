// src/pages/Administrativo/SaldoEstoque/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de SALDO DE ESTOQUE (Stock, 100% leitura,
// Administrativo → Estoque, TASK-STK-FE-01). Rota
// `/administrativo/saldo-estoque`, guardada por `stocks_view` (menu
// `adm-est-sal`/permissão JÁ EXISTEM em navigationTree.ts:422/
// navigationPermissions.ts — zero edição nesta Tarefa).
//
// Mirror estrutural de `Administrativo/Solicitacao/index.tsx` (GridSettings +
// `meta.gridLabel`, `useCustomGridQuery` INLINE, protocolo
// `padrao-frontend-gb-cerne-v2.md`) combinado com o filtro por FK dupla
// (`product_uuid`+`warehouse_uuid`) de
// `CadastrosBase/EstoqueInicial/index.tsx` (`toRequestFilter`) — único
// precedente real desse formato no projeto.
//
// Módulo é 100% leitura (`Stock-contrato.md ## 0`, nunca foi CRUD no
// legado): sem `ButtonAdd`, sem ação de Excluir/Editar na grid — a única
// ação de linha é "Ver detalhe", que navega para
// `/administrativo/saldo-estoque/detalhe` (TASK-STK-FE-02) levando os 2
// UUIDs via querystring (`DA-STK-04`). O botão "Relatório" do `HeaderTable`
// navega para `/administrativo/saldo-estoque/relatorio` (TASK-STK-FE-03) —
// nenhuma das 2 rotas de destino existe ainda (fatiamento intencional em
// Tarefas separadas), a navegação em si já fica correta.
//
// `info` (coluna final) vem PRONTO do `StockBalanceResource` — exibido
// direto, nunca recalculado no front (`Stock-contrato.md ## 4.6`).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Boxes, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Checkbox } from '@/components/ui/checkbox';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { listStocks, previewStockConsolidation } from '@/services/v2/Stocks/stock-service';
import type { ListStocksParams } from '@/services/v2/Stocks/stock-service';

import type {
  StockConsolidationPreviewRow,
  StockFilterForm,
  StockListItem,
} from '@/@types/v2/Stocks';

import { FilterSideSaldoEstoque } from './FilterSideSaldoEstoque';
import { GroupStocksModal } from './GroupStocksModal';
import { HeaderTable } from './HeaderTable';
import { useConsolidateStocks } from './useConsolidateStocks';

import type { OnChangeFn, RowSelectionState } from '@tanstack/react-table';

// `average_cost`/`total` já vêm NUMBER do `StockBalanceResource` — sem cast
// `Number(...)` de string, mirror `Contrato/index.tsx::formatCurrencyBRL`.
function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Achatamento `StockFilterForm` (persistido, com `*_label` companion) →
// `ListStocksParams` (querystring real de `GET /stocks`) — `*_label` nunca é
// enviado à API, só existe para re-hidratar o drawer, mirror
// `EstoqueInicial/index.tsx::toRequestFilter`.
function toRequestFilter(filter?: StockFilterForm | null): ListStocksParams {
  return {
    search: filter?.search || undefined,
    product_uuid: filter?.product_uuid || undefined,
    warehouse_uuid: filter?.warehouse_uuid || undefined,
  };
}

export default function SaldoEstoqueList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.stocks.stock;

  // "Agrupar" (Consolidação de Estoque, TASK-STK-FE-04) é gated por
  // `stocks_view` — fiel ao legado, que NÃO gateia o botão/checkbox de
  // Agrupar por permissão de grupo-de-produtos (`groupproducts_create`).
  // Decisão do dono (2026-08-06): quem vê a tela de Saldo de Estoque vê o
  // checkbox de seleção e o botão "Agrupar".
  const canGroup = can('stocks_view');

  // Seleção múltipla CONTROLADA (chaves = `uuid`, via `getRowId`). Controlada
  // (não interna do TanStack) para VALIDAR "mesma unidade" num único ponto —
  // `handleRowSelectionChange` intercepta TODA fonte de toggle (checkbox OU
  // clique de célula, ver `Table.tsx`), mirror "valida antes de aceitar a
  // seleção" de `GrazingMap.tsx`.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Prévia sob demanda (`GET /stock-consolidations`, disparada no clique de
  // "Agrupar") — `useState`+`try/catch/finally`, SEM `useQuery`/query-key
  // nova, mirror `SaldoEstoqueRelatorio.tsx::onGeneratePreview`.
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewRows, setPreviewRows] = useState<StockConsolidationPreviewRow[]>([]);

  const {
    open: isGroupModalOpen,
    onOpen: onOpenGroupModal,
    onClose: onCloseGroupModal,
  } = useDisclosure();

  // Mutação de execução (`POST /stock-consolidations`) — o `onSuccess` do
  // `useRequest` invalida `queryKey.stocks.stocks` (grid recarrega sozinha);
  // aqui só fechamos o modal e limpamos a seleção.
  const consolidateMutation = useConsolidateStocks({
    onSuccess: () => {
      onCloseGroupModal();
      setRowSelection({});
    },
  });

  // Paginação (`userPaginatedQuery`) e personalização de grid
  // (`useGridSettings`) derivam da MESMA expressão de chave para nunca
  // divergirem (DEC-007 §12, mirror Solicitacao/DiagnosisPregnancy).
  const stocksStorageKey = text.singularLabel + queryKey.stocks.stocks + ':v1';

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: stocksStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<StockFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação do drawer) — não
        // devem inflar o badge "Filtros(N)" (mirror `EstoqueInicial/index.tsx`).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  const stocksList = useCustomGridQuery<StockListItem, ListStocksParams>({
    asyncFunction: listStocks,
    queryKey: queryKey.stocks.stocks,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  function handleViewDetail(item: StockListItem) {
    const params = new URLSearchParams({
      product_uuid: item.product.uuid,
      warehouse_uuid: item.warehouse.uuid,
    });
    navigate(`/administrativo/saldo-estoque/detalhe?${params.toString()}`);
  }

  const columnHelper = createColumnHelper<StockListItem>();
  const defaultColumns = useMemo(
    () => [
      // Coluna de checkbox de seleção múltipla (TASK-STK-FE-04) — só quando
      // `canGroup`. `enableHiding: false` + `gridOrder: 'fixed-start'` (âncora
      // à esquerda) + `gridDataColumn: false` (não conta como coluna de dados
      // no GridSettings) — mirror da coluna `acoes` com `'fixed-end'`. A
      // largura estreita vem da extensão ADITIVA do ternário de `Table.tsx`
      // (`id === 'select'` → 48px). O toggle do checkbox flui pelo
      // `onRowSelectionChange` controlado (valida "mesma unidade").
      ...(canGroup
        ? [
            columnHelper.display({
              id: 'select',
              header: '',
              enableHiding: false,
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={() => row.toggleSelected()}
                  aria-label={row.original.product.description}
                />
              ),
              meta: {
                gridLabel: text.consolidation.groupButton,
                gridOrder: 'fixed-start',
                gridDataColumn: false,
              },
            }),
          ]
        : []),
      columnHelper.accessor((row) => row.product.description, {
        id: 'product',
        header: text.list.table.product,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text lineClamp="1">
            <Text as="span" fontFamily="mono" fontSize="sm" color="fg.muted" mr={2}>
              {row.original.product.code}
            </Text>
            <Text as="span" fontWeight="medium">
              {row.original.product.description}
            </Text>
          </Text>
        ),
        meta: { gridLabel: text.list.table.product },
      }),
      columnHelper.accessor((row) => row.warehouse.description, {
        id: 'warehouse',
        header: text.list.table.warehouse,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.warehouse.description}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.warehouse },
      }),
      columnHelper.accessor('quantity', {
        header: text.list.table.quantity,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatQuantity(row.original.quantity)} {row.original.unit}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.quantity },
      }),
      columnHelper.accessor((row) => row.lot ?? row.provider_lot ?? '', {
        id: 'lot',
        header: text.list.table.lot,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.lot || row.original.provider_lot || '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.lot },
      }),
      columnHelper.accessor((row) => row.expiration_date ?? '', {
        id: 'expiration_date',
        header: text.list.table.expirationDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.expiration_date ? formatDate(row.original.expiration_date) : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.expirationDate },
      }),
      columnHelper.accessor('average_cost', {
        header: text.list.table.averageCost,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCurrencyBRL(row.original.average_cost)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.averageCost },
      }),
      columnHelper.accessor('total', {
        header: text.list.table.total,
        cell: ({ row }) => (
          <Text
            fontSize="sm"
            fontWeight="medium"
            textAlign="right"
            fontVariantNumeric="tabular-nums"
          >
            {formatCurrencyBRL(row.original.total)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.total },
      }),
      // `info` — campo PRONTO do `StockBalanceResource`, exibido direto,
      // NUNCA recalculado no front (Stock-contrato.md ## 4.6).
      columnHelper.accessor('info', {
        header: text.list.table.info,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.info}
          </Text>
        ),
        meta: { ...styleColumTable.lg, gridLabel: text.list.table.info },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item icon={<Icon as={Eye} />} onClick={() => handleViewDetail(row.original)}>
                {text.list.table.actions.viewDetail}
              </Actions.Item>
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
    [navigate, text, languageGB, canGroup]
  );

  const gridSettings = useGridSettings<StockListItem>({
    storageKey: stocksStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([stocksList]);
  const items = stocksList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  // Índice `uuid → StockListItem` da página corrente — a resposta da prévia
  // (`StockResource`) NÃO traz `unit`, então mesclamos por `uuid` com o item
  // já carregado na grid ao montar o modal (ficha, Leitura do dev #7). Também
  // é a fonte da validação "mesma unidade".
  const itemsByUuid = useMemo(() => {
    const map = new Map<string, StockListItem>();
    (items ?? []).forEach((item) => map.set(item.uuid, item));
    return map;
  }, [items]);

  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );

  // Ponto ÚNICO de validação da seleção — intercepta checkbox E clique de
  // célula (`Table.tsx` dispara `getToggleSelectedHandler` para ambos). Se a
  // seleção resultante misturaria unidades de medida diferentes, REJEITA (não
  // aplica a mudança) e alerta — mirror `GrazingMap.tsx:194-213` (`warning` +
  // `return` sem aplicar). Sem estado controlado, um clique de célula
  // contornaria a regra (ficha, Leitura do dev #4).
  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next = typeof updater === 'function' ? updater(rowSelection) : updater;

    const distinctUnits = new Set(
      Object.keys(next)
        .filter((uuid) => next[uuid])
        .map((uuid) => itemsByUuid.get(uuid)?.unit)
        .filter((unit): unit is string => !!unit)
    );

    if (distinctUnits.size > 1) {
      toaster.warning({
        title: text.consolidation.alertTitle,
        description: text.consolidation.differentUnitAlert,
      });
      return; // rejeita — mantém a seleção anterior intacta
    }

    setRowSelection(next);
  };

  // Clique em "Agrupar": exige ≥ 2 (alerta no clique, NÃO desabilita o botão —
  // fiel ao legado). Prévia enviando `correct_stock_uuid = stock_uuids[0]`
  // como PLACEHOLDER (o Form Request compartilhado exige o campo mesmo na
  // prévia — ficha, Riscos #1); o valor REAL é escolhido no modal. Em sucesso,
  // mescla `unit` e abre o modal; em erro, toast e o modal NÃO abre.
  async function handleClickAgrupar() {
    if (selectedUuids.length < 2) {
      toaster.warning({
        title: text.consolidation.alertTitle,
        description: text.consolidation.selectAtLeastTwoAlert,
      });
      return;
    }

    setIsFetchingPreview(true);
    try {
      const response = await previewStockConsolidation({
        stock_uuids: selectedUuids,
        correct_stock_uuid: selectedUuids[0],
      });

      const rows: StockConsolidationPreviewRow[] = response.data.map((item) => ({
        ...item,
        unit: itemsByUuid.get(item.uuid)?.unit ?? '',
      }));

      setPreviewRows(rows);
      onOpenGroupModal();
    } catch {
      toaster.error({
        title: text.consolidation.previewErrorTitle,
        description: text.consolidation.previewErrorToast,
      });
    } finally {
      setIsFetchingPreview(false);
    }
  }

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={canGroup}
        // Chaves de `rowSelection` = `uuid` (não índice de linha, que muda com
        // paginação/refetch) + seleção controlada/validada (TASK-STK-FE-04).
        getRowId={(row) => row.uuid}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
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
              canGroup={canGroup}
              isFetchingPreview={isFetchingPreview}
              onClickGroup={handleClickAgrupar}
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
            isError={stocksList.isError}
            error={stocksList.error}
            isEmpty={isEmpty}
            onRetry={() => stocksList.refetch()}
            isRetrying={stocksList.isFetching}
            emptyIcon={Boxes}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideSaldoEstoque
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
        <GroupStocksModal
          isOpen={isGroupModalOpen}
          onClose={onCloseGroupModal}
          previewRows={previewRows}
          languageGB={languageGB}
          mutation={consolidateMutation}
        />
      )}
    </ContainerGrid>
  );
}
