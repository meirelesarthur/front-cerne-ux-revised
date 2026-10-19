// src/pages/Administrativo/MeusProcessos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM "Meus Processos" — solicitações de compra sob a
// responsabilidade do usuário autenticado (RequestPurchase, Administrativo /
// Suprimentos). Execução 081, T-081-FE-07, paridade com o legado
// (LEGADO-SUPRIMENTOS-04, `my-processes.blade.php`).
//
// - Fonte: `GET /request-purchases/my-processes` (já filtrado por
//   `responsible_id = auth()->id()` no servidor; ordem prioridade e código,
//   10 por página, vindas da API). A tela não tem filtro, como no legado.
// - Colunas na ordem do legado: bolinha de status, Código, Dt. Pedido,
//   Descrição/Chamado, Duração, Solicitante, Responsável Atual, Fazenda,
//   Cot. Recebidas e Ação. Tipo, Status e Prioridade ficam disponíveis pelo
//   painel de colunas (acréscimo do novo mantido, D-01).
// - Linha do tipo U (Emergencial) destacada pelo token `supplyEmergencyRowBg`.
// - As 16 ações do dropdown vêm de `myProcessesActions` (regras puras por
//   status, tipo e papel). Voltar Etapa (justificativa obrigatória) e
//   Transferir (novo responsável obrigatório) usam os diálogos compartilhados
//   de `components/Suprimentos`. Confirmar Recebimento, Gerar Financeiro e
//   Finalizar Pedido só navegam para as telas de Recebimentos (FE-10).
// - Modal "Sua(s) solicitação(ões) foram negada(s):" abre uma vez ao entrar.
// -----------------------------------------------------------------------------

import { type ComponentProps, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { FileText, Split } from 'lucide-react';
import {
  FiCheck,
  FiCheckCircle,
  FiCheckSquare,
  FiClock,
  FiCornerUpLeft,
  FiDollarSign,
  FiDownload,
  FiEdit,
  FiEye,
  FiPackage,
  FiRepeat,
  FiSend,
  FiTag,
  FiTrash2,
  FiFlag,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { DeniedRequestsModal } from '@/components/Suprimentos/DeniedRequestsModal';
import { emergencyRowHighlight } from '@/components/Suprimentos/emergencyRow';
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
  requestPurchaseStatusColor,
  requestPurchaseStatusDotToken,
} from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import {
  deleteRequestPurchase,
  getOrderPdf,
  listMyProcesses,
} from '@/services/v2/RequestPurchases/request-purchase-service';

import type {
  RequestPurchaseFilterForm,
  RequestPurchaseListItem,
} from '@/@types/v2/RequestPurchases';

import {
  getMyProcessesActions,
  myProcessesRoutes,
  type MyProcessesActionId,
} from './myProcessesActions';

import { InformRequestPurchaseStatusDialog } from '../Compras/InformRequestPurchaseStatusDialog';
import { SeparateRequestPurchaseDialog } from '../Compras/SeparateRequestPurchaseDialog';
import { RequestPurchaseStatusLegend } from '../Solicitacao/RequestPurchaseStatusLegend';

export default function MeusProcessosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.requestPurchases.requestPurchase;
  // A lista já vem filtrada por responsável: "Resp." é sempre verdadeiro aqui.
  const supplyContext = useSupplyActionContext({ assumeResponsible: true });

  const myProcessesStorageKey =
    text.myProcesses.titleModule + queryKey.requestPurchases.myProcessesList;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: myProcessesStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<RequestPurchaseFilterForm>(defaultQueryOptions);

  // ---- Diálogos por linha (uuid da linha selecionada) -------------------------
  const [stepBackUuid, setStepBackUuid] = useState<string | null>(null);
  const [transferUuid, setTransferUuid] = useState<string | null>(null);
  const [informStatusUuid, setInformStatusUuid] = useState<string | null>(null);
  const [separateUuid, setSeparateUuid] = useState<string | null>(null);

  // ---- Excluir (status 1) -----------------------------------------------------
  const [toDelete, setToDelete] = useState<RequestPurchaseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ requestPurchaseUuid }: { requestPurchaseUuid: string }) => {
      return await deleteRequestPurchase(requestPurchaseUuid);
    },
    queryKey: queryKey.requestPurchases.myProcessesList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    // `TypesRequest` não tem "delete"; o texto do toast vem de `personalizedMessage`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (requestPurchase: RequestPurchaseListItem) => {
    setToDelete(requestPurchase);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ requestPurchaseUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Download Arquivo (pedido de compra em PDF) -----------------------------
  function extractErrorMessage(error: unknown): string {
    return isAxiosError(error) && (error.response?.data as { message?: string })?.message
      ? (error.response!.data as { message: string }).message
      : text.inPurchase.toasts.actionError;
  }

  const pdfMutation = useMutation({
    mutationFn: (uuid: string) => getOrderPdf(uuid),
  });

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

  const myProcessesList = useCustomGridQuery<RequestPurchaseListItem, RequestPurchaseFilterForm>({
    asyncFunction: listMyProcesses,
    queryKey: queryKey.requestPurchases.myProcessesList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as RequestPurchaseFilterForm),
  });

  const columnHelper = createColumnHelper<RequestPurchaseListItem>();
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
          gridLabel: text.supply.filters.status,
          gridOrder: 'fixed-start',
          gridDataColumn: false,
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
      // "Cot. Recebidas" = recebidas/total (só populado por `my-processes`).
      columnHelper.display({
        id: 'quotationsReceived',
        header: text.supply.columns.receivedQuotations,
        cell: ({ row }) => {
          const received = row.original.received_quotations_count ?? 0;
          const total = row.original.quotations_count ?? 0;
          return (
            <Badge colorPalette={received > 0 ? 'blue' : 'gray'} variant="subtle" py={1} px={3}>
              {`${received}/${total}`}
            </Badge>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.supply.columns.receivedQuotations },
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
          const visible = getMyProcessesActions(item, supplyContext);

          // Mapa id -> item de menu; a ORDEM e a visibilidade vêm das regras.
          const menu: Record<
            MyProcessesActionId,
            {
              label: string;
              icon: ComponentProps<typeof Icon>['as'];
              onClick: () => void;
              tone?: 'danger';
              disabled?: boolean;
            }
          > = {
            view: {
              label: actionLabels.view,
              icon: FiEye,
              onClick: () => navigate(myProcessesRoutes.view(uuid)),
            },
            slaReport: {
              label: actionLabels.slaReport,
              icon: FiClock,
              onClick: () => openSlaReport(uuid),
            },
            authorize: {
              label: actionLabels.authorize,
              icon: FiCheckSquare,
              onClick: () => navigate(myProcessesRoutes.authorization(uuid)),
            },
            acknowledge: {
              label: actionLabels.acknowledge,
              icon: FiCheck,
              onClick: () => navigate(myProcessesRoutes.authorization(uuid)),
            },
            edit: {
              label: actionLabels.edit,
              icon: FiEdit,
              onClick: () => navigate(myProcessesRoutes.edit(uuid)),
            },
            delete: {
              label: actionLabels.delete,
              icon: FiTrash2,
              onClick: () => handleDeleteClick(item),
              tone: 'danger',
              disabled: isDeleting,
            },
            transfer: {
              label: actionLabels.transfer,
              icon: FiRepeat,
              onClick: () => setTransferUuid(uuid),
            },
            quote: {
              label: actionLabels.quote,
              icon: FiTag,
              onClick: () => navigate(myProcessesRoutes.quotationTab(uuid)),
            },
            sendToAuthorization: {
              label: actionLabels.sendToAuthorization,
              icon: FiSend,
              onClick: () => navigate(myProcessesRoutes.quotationTab(uuid)),
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
            confirmReceipt: {
              label: actionLabels.confirmReceipt,
              icon: FiPackage,
              onClick: () => navigate(myProcessesRoutes.confirmReceipt(uuid)),
            },
            generateFinancial: {
              label: actionLabels.generateFinancial,
              icon: FiDollarSign,
              onClick: () => navigate(myProcessesRoutes.generateFinancial(uuid)),
            },
            finalize: {
              label: actionLabels.finalize,
              icon: FiFlag,
              onClick: () => navigate(myProcessesRoutes.finalize(uuid)),
            },
            stepBack: {
              label: actionLabels.stepBack,
              icon: FiCornerUpLeft,
              onClick: () => setStepBackUuid(uuid),
            },
            downloadOrder: {
              label: actionLabels.downloadFile,
              icon: FiDownload,
              onClick: () => handlePdfClick(uuid),
              disabled: pdfMutation.isPending && pdfMutation.variables === uuid,
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
                    tone={menu[id].tone}
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
      isDeleting,
      pdfMutation.isPending,
      pdfMutation.variables,
    ]
  );

  const gridSettings = useGridSettings<RequestPurchaseListItem>({
    storageKey: myProcessesStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([myProcessesList]);
  const items = myProcessesList.data?.data?.items;
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
            <GridSettingsFloatingPanel
              gridSettings={gridSettings}
              triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.myProcesses.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.myProcesses.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={4}>
          <RequestPurchaseStatusLegend />
        </Box>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            getRowHighlight={emergencyRowHighlight}
            isError={myProcessesList.isError}
            error={myProcessesList.error}
            isEmpty={isEmpty}
            onRetry={() => myProcessesList.refetch()}
            isRetrying={myProcessesList.isFetching}
            emptyIcon={FileText}
            emptyTitle={text.supply.list.empty}
            emptyDescription=""
            canCreate={false}
          />
        </Box>
      </TableProvider>

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

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteConfirm.title}
        description={text.list.deleteConfirm.description}
        confirmButtonText={text.list.deleteConfirm.confirm}
        cancelButtonText={text.list.deleteConfirm.cancel}
        warningText=""
        hideQuestionMark
        tone="danger"
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

      {/* Solicitações negadas: abre uma vez e marca as notificações como lidas. */}
      <DeniedRequestsModal />
    </ContainerGrid>
  );
}
