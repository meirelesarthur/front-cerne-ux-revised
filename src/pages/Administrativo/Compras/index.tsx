// src/pages/Administrativo/Compras/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM "Compras" — fila de solicitações de compra do tenant, em
// qualquer status (`GET /request-purchases/in-purchase`, sem filtro fixo de
// status). Execução 081, T-081-FE-09, paridade com o legado
// (LEGADO-SUPRIMENTOS-08, `request-buy/index.blade.php`).
//
// - Permissões: rota e menu `request-buy_view`; Informar Status e Sub Solicitação
//   `request-buy_edit` (T-081-API-03). Esconder botão não protege: o 403 é da API.
// - Colunas na ordem do legado: bolinha de status, Código, Dt. Pedido,
//   Descrição/Chamado, Duração, Solicitante, Responsável Atual, Fazenda, ícones
//   de envio do pedido (WhatsApp e E-mail) e Ação. Tipo, Status e Prioridade
//   ficam no painel de colunas (acréscimo do novo mantido, D-01).
// - Linha do tipo U (Emergencial) destacada pelo token `supplyEmergencyRowBg`.
// - Filtro com os 9 campos e os 11 status (`FilterSideSolicitacao`); `?search=`
//   da URL (links "Compras nº X pendente" do sino) aplica a busca uma vez.
// - Ações do dropdown vêm de `purchaseActions` (regras puras por status, papel,
//   permissão e contagem de cotações aprovadas): Visualizar, Relatório SLA,
//   Receber, Transferir, Informar Status (1 aprovada), Sub Solicitação (mais de
//   uma), Download Arquivo e Voltar Etapa. Transferir e Voltar Etapa usam os
//   diálogos compartilhados de `components/Suprimentos`; Informar Status e Sub
//   Solicitação são diálogos únicos, também usados por Meus Processos.
// - Envio do pedido: WhatsApp (link pronto da API), E-mail (a API responde 422
//   se o fornecedor não tem e-mail, mostrado no toast) e PDF.
// -----------------------------------------------------------------------------

import { type ComponentProps, useEffect, useMemo, useRef, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { FileText, Split } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  FiCheckCircle,
  FiClock,
  FiCornerUpLeft,
  FiDownload,
  FiEye,
  FiInbox,
  FiMail,
  FiRepeat,
} from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { IconButtonTable } from '@/components/IconButtonTable';
import { emergencyRowHighlight } from '@/components/Suprimentos/emergencyRow';
import { invalidateSupplyQueries } from '@/components/Suprimentos/invalidateSupplyQueries';
import { openSlaReport } from '@/components/Suprimentos/slaReport';
import { StepBackDialog } from '@/components/Suprimentos/StepBackDialog';
import { TransferResponsibleDialog } from '@/components/Suprimentos/TransferResponsibleDialog';
import { useSupplyActionContext } from '@/components/Suprimentos/useSupplyActionContext';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

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
import { requestPurchasePriorityColor } from '@/constants/RequestPurchases/request-purchase-priority';
import type { RequestPurchasePriority } from '@/constants/RequestPurchases/request-purchase-priority';
import {
  requestPurchaseStatusDotToken,
} from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import {
  getOrderPdf,
  getWhatsappLink,
  listInPurchase,
  receiveRequestPurchase,
  sendOrderEmail,
} from '@/services/v2/RequestPurchases/request-purchase-service';

import type {
  RequestPurchaseFilterForm,
  RequestPurchaseListItem,
} from '@/@types/v2/RequestPurchases';

import { InformRequestPurchaseStatusDialog } from './InformRequestPurchaseStatusDialog';
import {
  canSendOrder,
  getPurchaseActions,
  purchaseRoutes,
  type PurchaseActionId,
} from './purchaseActions';
import { SeparateRequestPurchaseDialog } from './SeparateRequestPurchaseDialog';

import { FilterSideSolicitacao } from '../Solicitacao/FilterSideSolicitacao';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { StatusTag } from '@/components/ui/StatusTag';
import { useListSearch } from '@/hooks/useListSearch';

export default function ComprasList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const text = languageGB.requestPurchases.requestPurchase;
  const supplyContext = useSupplyActionContext();

  const inPurchaseStorageKey =
    text.inPurchase.titleModule + queryKey.requestPurchases.inPurchaseList;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: inPurchaseStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RequestPurchaseFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `?search=` (links do sino "Compras nº X pendente"): aplica o filtro uma vez.
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search')?.trim() || undefined;
  const appliedUrlSearch = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!urlSearch || appliedUrlSearch.current === urlSearch) return;
    appliedUrlSearch.current = urlSearch;
    handleFilterChange({ search: urlSearch });
  }, [urlSearch]);

  // ---- Diálogos por linha (uuid da linha selecionada) -------------------------
  const [informStatusUuid, setInformStatusUuid] = useState<string | null>(null);
  const [separateUuid, setSeparateUuid] = useState<string | null>(null);
  const [stepBackUuid, setStepBackUuid] = useState<string | null>(null);
  const [transferUuid, setTransferUuid] = useState<string | null>(null);

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação dos selects assíncronos).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  const inPurchaseList = useCustomGridQuery<RequestPurchaseListItem, RequestPurchaseFilterForm>({
    asyncFunction: listInPurchase,
    queryKey: queryKey.requestPurchases.inPurchaseList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as RequestPurchaseFilterForm),
  });

  // ---- Receber Solicitação (assume a responsabilidade) -------------------------
  const receiveMutation = useRequest({
    asyncFunction: async (uuid: string) => receiveRequestPurchase(uuid),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.inPurchaseList,
    typesRequest: 'update',
    personalizedMessage: text.actions.receiveToast,
    actionSuccess: () => {
      invalidateSupplyQueries(queryClient);
    },
  });

  // ---- Envio do pedido (WhatsApp, E-mail e PDF): efeitos sem toast de entidade --
  function extractErrorMessage(error: unknown): string {
    const message = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message
      : undefined;
    return message ?? text.inPurchase.toasts.actionError;
  }

  const whatsappMutation = useMutation({
    mutationFn: (uuid: string) => getWhatsappLink(uuid),
  });
  const emailMutation = useMutation({
    mutationFn: (uuid: string) => sendOrderEmail(uuid),
  });
  const pdfMutation = useMutation({
    mutationFn: (uuid: string) => getOrderPdf(uuid),
  });

  function handleWhatsappClick(uuid: string) {
    const toastId = `inpurchase-whatsapp-${uuid}`;
    toaster.create({
      id: toastId,
      type: 'loading',
      title: text.inPurchase.toasts.whatsappGenerating,
    });
    whatsappMutation.mutate(uuid, {
      onSuccess: (result) => {
        toaster.dismiss(toastId);
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
      },
      onError: (error) => {
        toaster.dismiss(toastId);
        toaster.error({ title: text.singularLabel, description: extractErrorMessage(error) });
      },
    });
  }

  function handleEmailClick(uuid: string) {
    emailMutation.mutate(uuid, {
      onSuccess: () => {
        toaster.success({
          title: text.singularLabel,
          description: text.inPurchase.toasts.emailQueued,
        });
      },
      onError: (error) => {
        toaster.error({ title: text.singularLabel, description: extractErrorMessage(error) });
      },
    });
  }

  function handlePdfClick(uuid: string) {
    pdfMutation.mutate(uuid, {
      onSuccess: (result) => {
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
        toaster.success({
          title: text.singularLabel,
          description: text.inPurchase.toasts.pdfReady,
        });
      },
      onError: (error) => {
        toaster.error({ title: text.singularLabel, description: extractErrorMessage(error) });
      },
    });
  }

  const columnHelper = createColumnHelper<RequestPurchaseListItem>();
  const defaultColumns = useMemo(
    () => [
      // Bolinha de status do legado (cor pelo token, nome acessível pelo status).
      // Situação escrita na linha (tag colorida): substitui a bolinha + a legenda acima do grid.
      columnHelper.accessor('status_label', {
        header: languageGB.defaltStrings.statusColumn,
        enableHiding: false,
        cell: ({ row }) => (
          <StatusTag
            label={row.original.status_label}
            color={requestPurchaseStatusDotToken[row.original.status as RequestPurchaseStatus]}
          />
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.defaltStrings.statusColumn,
          gridOrder: 'fixed-start',
        },
      }),
      columnHelper.accessor('code', {
        header: text.supply.columns.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.supply.columns.code },
      }),
      columnHelper.accessor('request_date', {
        header: text.supply.columns.requestDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.request_date)}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.supply.columns.requestDate },
      }),
      // "Descrição/Chamado" lê `description` (não `justification`), como o legado.
      columnHelper.accessor('description', {
        header: text.supply.columns.description,
        enableHiding: false,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={FileText} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description ?? '—'}
            </Text>
          </Flex>
        ),
        meta: { gridLabel: text.supply.columns.description },
      }),
      columnHelper.accessor('duration_label', {
        header: text.supply.columns.duration,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.duration_label ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.supply.columns.duration },
      }),
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'requester',
        header: text.supply.columns.requester,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.user?.name ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.supply.columns.requester },
      }),
      columnHelper.accessor((row) => row.responsible?.name ?? '', {
        id: 'responsible',
        header: text.supply.columns.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.responsible?.name ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.supply.columns.responsible },
      }),
      columnHelper.accessor((row) => row.farm?.description ?? '', {
        id: 'farm',
        header: text.supply.columns.farm,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.farm?.description ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.supply.columns.farm },
      }),
      // LM-09 — ícones WhatsApp e E-mail só com uma cotação aprovada (status >= 6).
      columnHelper.display({
        id: 'sendOrder',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const uuid = row.original.uuid;
          if (!canSendOrder(row.original, supplyContext)) return null;
          return (
            <Flex gap={1} justify="center">
              <IconButtonTable
                aria-label={text.inPurchase.actions.whatsapp}
                mensegerTooltip={text.inPurchase.actions.sendOrder}
                size="sm"
                variant="ghost"
                color="green.500"
                disabled={whatsappMutation.isPending && whatsappMutation.variables === uuid}
                onClick={() => handleWhatsappClick(uuid)}
              >
                <Icon as={FaWhatsapp} />
              </IconButtonTable>
              <IconButtonTable
                aria-label={text.inPurchase.actions.email}
                mensegerTooltip={text.inPurchase.actions.sendOrder}
                size="sm"
                variant="ghost"
                disabled={emailMutation.isPending && emailMutation.variables === uuid}
                onClick={() => handleEmailClick(uuid)}
              >
                <Icon as={FiMail} />
              </IconButtonTable>
            </Flex>
          );
        },
        meta: {
          ...styleColumTable.sm,
          gridLabel: text.inPurchase.actions.sendOrder,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
      // Acréscimos do novo (D-01 manter): Tipo, Status e Prioridade.
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
            {row.original.type_label}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
      }),
      columnHelper.accessor('priority_label', {
        header: text.list.table.priority,
        cell: ({ row }) => (
          <Badge
            colorPalette={
              requestPurchasePriorityColor[row.original.priority as RequestPurchasePriority] ??
              'gray'
            }
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.priority_label}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.priority },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const uuid = item.uuid;
          const actionLabels = text.supply.actions;
          const visible = getPurchaseActions(item, supplyContext);

          // Mapa id -> item de menu; a ORDEM e a visibilidade vêm das regras.
          const menu: Record<
            PurchaseActionId,
            {
              label: string;
              icon: ComponentProps<typeof Icon>['as'];
              onClick: () => void;
              disabled?: boolean;
            }
          > = {
            view: {
              label: actionLabels.view,
              icon: FiEye,
              onClick: () => navigate(purchaseRoutes.view(uuid)),
            },
            slaReport: {
              label: actionLabels.slaReport,
              icon: FiClock,
              onClick: () => openSlaReport(uuid),
            },
            receive: {
              label: actionLabels.receive,
              icon: FiInbox,
              onClick: () => receiveMutation.mutate(uuid),
              disabled: receiveMutation.isPending && receiveMutation.variables === uuid,
            },
            transfer: {
              label: actionLabels.transfer,
              icon: FiRepeat,
              onClick: () => setTransferUuid(uuid),
            },
            informStatus: {
              label: actionLabels.informStatus,
              icon: FiCheckCircle,
              onClick: () => setInformStatusUuid(uuid),
            },
            createSub: {
              label: actionLabels.createSub,
              icon: Split,
              onClick: () => setSeparateUuid(uuid),
            },
            downloadOrder: {
              label: actionLabels.downloadFile,
              icon: FiDownload,
              onClick: () => handlePdfClick(uuid),
              disabled: pdfMutation.isPending && pdfMutation.variables === uuid,
            },
            stepBack: {
              label: actionLabels.stepBack,
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
          gridLabel: text.supply.columns.action,
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
      receiveMutation.isPending,
      receiveMutation.variables,
      whatsappMutation.isPending,
      whatsappMutation.variables,
      emailMutation.isPending,
      emailMutation.variables,
      pdfMutation.isPending,
      pdfMutation.variables,
    ]
  );

  const gridSettings = useGridSettings<RequestPurchaseListItem>({
    storageKey: inPurchaseStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([inPurchaseList]);
  const items = inPurchaseList.data?.data?.items;
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
            </>
          }
        >
          <PageHeader title={text.inPurchase.pageTitle} description={text.inPurchase.pageSubtitle} />
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
            getRowHighlight={emergencyRowHighlight}
            isError={inPurchaseList.isError}
            error={inPurchaseList.error}
            isEmpty={isEmpty}
            onRetry={() => inPurchaseList.refetch()}
            isRetrying={inPurchaseList.isFetching}
            emptyIcon={FileText}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.supply.list.empty
            }
            emptyDescription={filtersApplied > 0 ? text.list.emptyState.descriptionFiltered : ''}
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideSolicitacao
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <InformRequestPurchaseStatusDialog
        isOpen={informStatusUuid !== null}
        onClose={() => setInformStatusUuid(null)}
        requestPurchaseUuid={informStatusUuid}
      />

      <SeparateRequestPurchaseDialog
        isOpen={separateUuid !== null}
        onClose={() => setSeparateUuid(null)}
        requestPurchaseUuid={separateUuid}
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
