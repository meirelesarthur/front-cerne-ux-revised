// src/pages/Administrativo/Recebimentos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM "Recebimentos" — hub de fluxos sobre a MESMA entidade
// `RequestPurchase` (`GET /request-receipts`). Execução 081, T-081-FE-10,
// paridade com o legado (LEGADO-SUPRIMENTOS-09, `request-receipts/index.blade.php`).
//
// - Colunas na ordem do legado (LM-01..13): bolinha de status, Código, Tipo, Dt.
//   Pedido, Descrição/Chamado, Nº NFe, Duração, Solicitante (`user`), Resp. Atual,
//   Fazenda, Dt. Atualização, Lançado (`has_financial` OU status 9) e Ação. A coluna
//   Status (texto) é acréscimo do novo mantido (D-01).
// - Ordenação do servidor (`sort`/`direction`) em Código, Dt. Pedido, Duração e Dt.
//   Atualização; sem ordenação explícita vale a ordem do legado (urgente, status,
//   prioridade, código). 10 por página.
// - Linha do tipo U (Emergencial) destacada pelo token `supplyEmergencyRowBg`.
// - Filtro com os 9 controles e os 11 status (`FilterSideRecebimentos`).
// - Ações do dropdown vêm de `receiptsActions` (regras puras por status, tipo,
//   responsável e permissão): Receber, Visualizar, Relatório SLA (nova aba),
//   Transferir, Confirmar Recebimento, Gerar Financeiro, Finalizar Pedido e Voltar
//   Etapa. Transferir e Voltar Etapa usam os diálogos de `components/Suprimentos`.
// -----------------------------------------------------------------------------

import type { ComponentProps, ElementType } from 'react';
import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCornerUpLeft,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiInbox,
  FiRepeat,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonFilter } from '@/components/ButtonFilter';
import { ContainerGrid } from '@/components/ContainerGrid';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { emergencyRowHighlight } from '@/components/Suprimentos/emergencyRow';
import { invalidateSupplyQueries } from '@/components/Suprimentos/invalidateSupplyQueries';
import { openSlaReport } from '@/components/Suprimentos/slaReport';
import { StepBackDialog } from '@/components/Suprimentos/StepBackDialog';
import { TransferResponsibleDialog } from '@/components/Suprimentos/TransferResponsibleDialog';
import { useSupplyActionContext } from '@/components/Suprimentos/useSupplyActionContext';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import {
  requestPurchaseStatusColor,
  requestPurchaseStatusDotToken,
} from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import { receiveRequestPurchase } from '@/services/v2/RequestPurchases/request-purchase-service';
import { listRequestReceipts } from '@/services/v2/RequestReceipts/request-receipt-service';

import type { RequestReceiptFilterForm, RequestReceiptListItem } from '@/@types/v2/RequestReceipts';

import { FilterSideRecebimentos } from './FilterSideRecebimentos';
import {
  getReceiptActions,
  isLaunched,
  receiptRoutes,
  type ReceiptActionId,
} from './receiptsActions';
import { SortableHeader } from './SortableHeader';

import { RequestPurchaseStatusLegend } from '../Solicitacao/RequestPurchaseStatusLegend';

import { PageHeader } from '@/components/ui/PageHeader';

export default function RecebimentosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const text = languageGB.requestReceipts.requestReceipt;
  const supplyContext = useSupplyActionContext();

  const storageKey = text.titleModule + queryKey.requestReceipts.requestReceiptsList;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey,
      filter: {} as RequestReceiptFilterForm,
    }),
    []
  );

  const {
    paginatedQuery,
    handlePaginatedQuery,
    handleFilterChange,
    handleResetFilter,
    handleOrderByChange,
  } = userPaginatedQuery<RequestReceiptFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // ---- Diálogos por linha (uuid da linha selecionada) -------------------------
  const [stepBackUuid, setStepBackUuid] = useState<string | null>(null);
  const [transferUuid, setTransferUuid] = useState<string | null>(null);

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  const requestReceiptsList = useCustomGridQuery<RequestReceiptListItem, RequestReceiptFilterForm>({
    asyncFunction: listRequestReceipts,
    queryKey: queryKey.requestReceipts.requestReceiptsList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as RequestReceiptFilterForm),
  });

  // "Receber Solicitação" (AM-01) — `POST request-purchases/{uuid}/receive`. O
  // servidor rejeita se alguém já assumiu; a mensagem dele vai para o toast.
  const receiveMutation = useRequest({
    asyncFunction: async (uuid: string) => receiveRequestPurchase(uuid),
    entityName: text.singularLabel,
    queryKey: queryKey.requestReceipts.requestReceiptsList,
    typesRequest: 'update',
    personalizedMessage: text.actions.receiveToast,
    actionSuccess: () => {
      invalidateSupplyQueries(queryClient);
    },
  });

  const columnHelper = createColumnHelper<RequestReceiptListItem>();
  const orderBy = paginatedQuery.orderBy;

  function sortableHeader(label: string, sortKey: string) {
    return () => (
      <SortableHeader
        label={label}
        sortKey={sortKey}
        orderBy={orderBy}
        onSort={handleOrderByChange}
      />
    );
  }

  const defaultColumns = useMemo(
    () => [
      // Bolinha de status do legado (cor pelo token, nome acessível pelo status).
      columnHelper.display({
        id: 'statusDot',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Box
            boxSize="2.5"
            borderRadius="full"
            backgroundColor={
              requestPurchaseStatusDotToken[row.original.status as RequestPurchaseStatus]
            }
            role="img"
            aria-label={row.original.status_label}
            title={row.original.status_label}
          />
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: text.list.table.status,
          gridOrder: 'fixed-start',
          gridDataColumn: false,
        },
      }),
      columnHelper.accessor('code', {
        header: sortableHeader(text.list.table.code, 'code'),
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
            {row.original.type_label}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
      }),
      columnHelper.accessor('request_date', {
        header: sortableHeader(text.list.table.requestDate, 'request_date'),
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.request_date)}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.requestDate },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={FiFileText} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
        meta: { gridLabel: text.list.table.description },
      }),
      columnHelper.accessor('nfe', {
        header: text.list.table.nfe,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.nfe ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.nfe },
      }),
      columnHelper.accessor('duration_label', {
        header: sortableHeader(text.list.table.duration, 'duration'),
        cell: ({ row }) => (
          <Flex align="center" gap={1}>
            <Icon as={FiClock} boxSize={3} color="fg.muted" />
            <Text fontSize="sm" color="fg.muted">
              {row.original.duration_label ?? '—'}
            </Text>
          </Flex>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.duration },
      }),
      // "Solicitante" lê `user` (T-081-API-04 renomeou `solicitante`).
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'requester',
        header: text.list.table.requester,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.user?.name ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.requester },
      }),
      columnHelper.accessor((row) => row.responsible?.name ?? '', {
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.responsible?.name ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.responsible },
      }),
      columnHelper.accessor((row) => row.farm?.description ?? '', {
        id: 'farm',
        header: text.list.table.farm,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.farm?.description ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.farm },
      }),
      columnHelper.accessor('updated_on', {
        header: sortableHeader(text.list.table.updatedOn, 'updated_on'),
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.updated_on, 'dd/MM/yyyy HH:mm')}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.updatedOn },
      }),
      // LM-12 — ícone verde (lançado) ou vermelho (pendente); `has_financial` OU status 9.
      columnHelper.accessor('has_financial', {
        header: text.list.table.launched,
        cell: ({ row }) => {
          const launched = isLaunched(row.original);
          const label = launched ? text.list.launchedYes : text.list.launchedNo;
          return (
            <Box as="span" display="inline-flex" title={label}>
              <Icon
                as={launched ? FiCheckCircle : FiAlertCircle}
                boxSize={4}
                color={launched ? 'green.500' : 'red.500'}
                role="img"
                aria-label={label}
              />
            </Box>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.launched },
      }),
      // Acréscimo do novo (D-01 manter): Status em texto.
      columnHelper.accessor('status_label', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={
              requestPurchaseStatusColor[row.original.status as RequestPurchaseStatus] ?? 'gray'
            }
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.status_label}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.status },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const uuid = item.uuid;
          const actionLabels = text.actions;
          const visible = getReceiptActions(item, supplyContext);

          // Mapa id -> item de menu; a ORDEM e a visibilidade vêm das regras.
          const menu: Record<
            ReceiptActionId,
            {
              label: string;
              icon: ComponentProps<typeof Icon>['as'];
              onClick: () => void;
              disabled?: boolean;
            }
          > = {
            receive: {
              label: actionLabels.receive,
              icon: FiInbox,
              onClick: () => receiveMutation.mutate(uuid),
              disabled: receiveMutation.isPending && receiveMutation.variables === uuid,
            },
            view: {
              label: actionLabels.view,
              icon: FiEye,
              onClick: () => navigate(receiptRoutes.view(uuid)),
            },
            slaReport: {
              label: actionLabels.sla,
              icon: FiClock,
              onClick: () => openSlaReport(uuid),
            },
            transfer: {
              label: actionLabels.transfer,
              icon: FiRepeat,
              onClick: () => setTransferUuid(uuid),
            },
            confirmReceipt: {
              label: actionLabels.confirmReceipt,
              icon: FiCheckCircle,
              onClick: () => navigate(receiptRoutes.confirm(uuid)),
            },
            generateFinancial: {
              label: actionLabels.financial,
              icon: FiDollarSign,
              onClick: () => navigate(receiptRoutes.financial(uuid)),
            },
            finalize: {
              label: actionLabels.informPayment,
              icon: FiCheckCircle,
              onClick: () => navigate(receiptRoutes.finalize(uuid)),
            },
            stepBack: {
              label: actionLabels.changeStatus,
              icon: FiCornerUpLeft,
              onClick: () => setStepBackUuid(uuid),
            },
          };

          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {visible.map((id) => (
                  <Actions.Item
                    key={id}
                    icon={<Icon as={menu[id].icon} />}
                    onClick={menu[id].onClick}
                    disabled={menu[id].disabled}
                  >
                    {menu[id].label}
                  </Actions.Item>
                ))}
              </Actions>
            </Flex>
          );
        },
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [
      navigate,
      languageGB,
      text,
      supplyContext,
      orderBy,
      receiveMutation.isPending,
      receiveMutation.variables,
    ]
  );

  const gridSettings = useGridSettings<RequestReceiptListItem>({
    storageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([requestReceiptsList]);
  const items = requestReceiptsList.data?.data?.items;
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
            <>
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </>
          }
        >
          <PageHeader title={text.pageTitle} description={text.pageSubtitle} />
        </HeaderGrid>

        {/* Legenda de status — mesmo componente reutilizável já usado em
            `Compras`/`Cotacoes`/`Solicitacao`/`Rejeitados`/`Autorizacao`/
            `MeusProcessos` (`RequestPurchaseStatusLegend`, hub RequestPurchase
            compartilhado), posição equivalente: acima do grid, abaixo do
            cabeçalho/filtros. TODOS os 11 status do enum (default do
            componente), fiel ao legado — Recebimentos filtra a LISTAGEM por
            {7,8,9}, mas a legenda não é restringida (mesmo padrão de
            `Autorizacao`/`Rejeitados`). */}
        <Box mt={4}>
          <RequestPurchaseStatusLegend />
        </Box>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            getRowHighlight={emergencyRowHighlight}
            isError={requestReceiptsList.isError}
            error={requestReceiptsList.error}
            isEmpty={isEmpty}
            onRetry={() => requestReceiptsList.refetch()}
            isRetrying={requestReceiptsList.isFetching}
            emptyIcon={FiFileText as ElementType}
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
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideRecebimentos
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <StepBackDialog
        isOpen={stepBackUuid !== null}
        onClose={() => setStepBackUuid(null)}
        requestPurchaseUuid={stepBackUuid}
        onSuccess={() => setStepBackUuid(null)}
      />

      <TransferResponsibleDialog
        isOpen={transferUuid !== null}
        onClose={() => setTransferUuid(null)}
        requestPurchaseUuid={transferUuid}
        onSuccess={() => setTransferUuid(null)}
      />
    </ContainerGrid>
  );
}
