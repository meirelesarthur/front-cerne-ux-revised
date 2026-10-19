// src/pages/Administrativo/Cotacoes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) "Cotações" — hub TENANT-WIDE de RequestPurchase
// filtrado a `status IN [1, 2]` (Administrativo / Suprimentos, esteira
// 97-Esteiras/035, TASK-CQ-FE-13). Rota `/administrativo/cotacoes`, item de
// menu JÁ RESERVADO (`adm-sup-cot`, `navigationTree.ts:451`) guardado por
// `request-quotation_view` (`navigationPermissions.ts:225`, DEC-CQ-09 —
// fiel ao legado CL-002, reusa o slug já existente, não é expansão de
// acesso).
//
// NÃO é uma tela nova de `RequestQuotation` — é o MESMO hub de Solicitações
// (`RequestPurchaseController@index` legado consultava `RequestPurchase`,
// não `RequestQuotation`), só com fonte de dados e filtro de status
// diferentes (ver FEAT-16a01176-cotacoes.md, DEC-CQ-08 "REVISÃO 2"):
// `listRequestPurchases`/`index()` é USER-SCOPED (`where('user_id')`, regra
// 17/DA-RP-13) — mostraria só as solicitações do próprio usuário, incompleto
// para esta tela. Esta tela consome `listRequestPurchasesInQuotation`
// (`GET /request-purchases/in-quotation`, TASK-CQ-API-13), endpoint DEDICADO
// TENANT-WIDE que já aplica `status IN (1, 2)` server-side.
//
// Mirror ESTRUTURAL de `Administrativo/Solicitacao/index.tsx` — DUPLICAÇÃO
// CONSCIENTE (não componente compartilhado), pelo mesmo critério já aplicado
// pelo próprio projeto em `Administrativo/MeusProcessos/index.tsx` e
// `Administrativo/Rejeitados/index.tsx` (duas outras variantes de listagem
// deste MESMO hub, cada uma com fonte/queryKey/storageKey próprias e
// nenhuma abstração compartilhada introduzida). Diferente daquelas duas,
// esta tela reusa a grade INTEIRA de 11 colunas (código/tipo/dt.
// pedido/descrição/duração/solicitante/responsável/fazenda/prioridade/
// status/cotações + ações), por instrução explícita do task-packet — não a
// versão reduzida de 6 colunas usada por Rejeitados/MeusProcessos.
//
// Diferenças aditivas desta variante (vs. `Solicitacao/index.tsx`):
//   1. Fonte: `listRequestPurchasesInQuotation` (não `listRequestPurchases`).
//   2. queryKey/storageKey PRÓPRIAS (`inQuotationList`) — zero colisão de
//      cache/preferência de grid com a tela "Solicitação".
//   3. SEM botão "criar" (nem no header, nem no CTA do EmptyState) — a
//      criação de cotação acontece DENTRO da aba Cotações do formulário
//      único (FE-03), o legado não cria RequestPurchase a partir deste hub.
//   4. Filtro de status restrito a `{1: solicitação, 2: cotação em
//      andamento}` (FM-02) via prop aditiva `statusOptions` de
//      `FilterSideSolicitacao` — os outros 9 valores do enum continuam
//      disponíveis na tela "Solicitação" (prop não passada lá = default).
// A tela "Solicitação" (`Administrativo/Solicitacao/index.tsx`) NÃO foi
// alterada por este arquivo — zero regressão.
//
// -- Execução 081, T-081-FE-08 (paridade com o legado, contrato LEGADO 05 P72) --
// Colunas na ordem do legado (`request-quotations/index.blade.php:99-186`):
// bolinha de status, Código, Dt. Pedido, Descrição/Chamado, Duração,
// Solicitante, Resp. Atual, Fazenda, "Cot. Recebidas" (recebidas/total) e Ação;
// Tipo, Status, Prioridade e a contagem total ficam pelo painel de colunas
// (acréscimos do novo mantidos, D-01). Linha U (Emergencial) destacada por token.
// Ações por `getQuotationQueueActions` (Visualizar, Relatório SLA, Receber,
// Transferir, Cotar Pedido, Enviar Autorização, Criar Sub Solicitação e Voltar
// Etapa; Editar/Excluir como acréscimo do novo). Voltar Etapa e Transferir usam
// os diálogos compartilhados; Criar Sub Solicitação usa o diálogo da cotação.
// O modal de negadas é montado pela FE-11 (A-11). LACUNA: o indicador "Refazer"
// (triângulo quando o status é 1/2 e a solicitação já passou pelo status 3)
// depende de um flag que a lista da API não expõe (legado: `movements_count`);
// sem inventar dado, a coluna não é exibida e a dependência fica registrada.
// -----------------------------------------------------------------------------

import { type ComponentProps, type ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FileText, Split } from 'lucide-react';
import {
  FiClock,
  FiAlertTriangle,
  FiCornerUpLeft,
  FiEdit,
  FiEye,
  FiInbox,
  FiRepeat,
  FiSend,
  FiTag,
  FiTrash2,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ButtonFilter } from '@/components/ButtonFilter';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { DeniedRequestsModal } from '@/components/Suprimentos/DeniedRequestsModal';
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
import { requestPurchaseStatusOptions } from '@/constants/RequestPurchases/options/request-purchase-status-options';
import { requestPurchasePriorityColor } from '@/constants/RequestPurchases/request-purchase-priority';
import type { RequestPurchasePriority } from '@/constants/RequestPurchases/request-purchase-priority';
import {
  requestPurchaseStatus,
  requestPurchaseStatusColor,
  requestPurchaseStatusDotToken,
} from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import {
  deleteRequestPurchase,
  listRequestPurchasesInQuotation,
  receiveRequestPurchase,
} from '@/services/v2/RequestPurchases/request-purchase-service';

import type {
  RequestPurchaseFilterForm,
  RequestPurchaseListItem,
} from '@/@types/v2/RequestPurchases';

import {
  formatReceivedQuotations,
  getQuotationQueueActions,
  quotationQueueRoutes,
  type QuotationQueueActionId,
} from './quotationQueueActions';
import { SeparateAtQuotationDialog } from './SeparateAtQuotationDialog';

import { FilterSideSolicitacao } from '../Solicitacao/FilterSideSolicitacao';
import { RequestPurchaseStatusLegend } from '../Solicitacao/RequestPurchaseStatusLegend';

export default function CotacoesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const text = languageGB.requestPurchases.requestPurchase;
  const queueText = languageGB.requestQuotations.requestQuotation.stage.queue;
  // Lista de TODO o tenant: "Resp." compara o responsável da linha com o usuário.
  const supplyContext = useSupplyActionContext();

  // FM-02 — só os 2 status que compõem a fila de cotação (mirror do legado,
  // ver cabeçalho do arquivo). Os outros 9 valores continuam disponíveis na
  // tela "Solicitação" (não afetada por este arquivo).
  const inQuotationStatusOptions = useMemo(
    () =>
      requestPurchaseStatusOptions
        .options(languageGB)
        .filter(
          (option) =>
            option.value === requestPurchaseStatus.solicitacao ||
            option.value === requestPurchaseStatus.cotacaoEmAndamento
        ),
    [languageGB]
  );

  // Paginação (`userPaginatedQuery`) e personalização de grid
  // (`useGridSettings`) derivam da MESMA expressão de chave — mirror
  // DEC-007 §12 já aplicada em `Solicitacao/index.tsx`.
  const inQuotationStorageKey =
    text.inQuotation.titleModule + queryKey.requestPurchases.inQuotationList;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: inQuotationStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RequestPurchaseFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY — não devem inflar o badge
        // "Filtros(N)" (mesma regra de `Solicitacao/index.tsx`).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  // ---- Diálogos por linha (uuid da linha selecionada) -------------------------
  const [stepBackUuid, setStepBackUuid] = useState<string | null>(null);
  const [transferUuid, setTransferUuid] = useState<string | null>(null);
  const [separateUuid, setSeparateUuid] = useState<string | null>(null);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<RequestPurchaseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const inQuotationList = useCustomGridQuery<RequestPurchaseListItem, RequestPurchaseFilterForm>({
    asyncFunction: listRequestPurchasesInQuotation,
    queryKey: queryKey.requestPurchases.inQuotationList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as RequestPurchaseFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ requestPurchaseUuid }: { requestPurchaseUuid: string }) => {
      return await deleteRequestPurchase(requestPurchaseUuid);
    },
    queryKey: queryKey.requestPurchases.inQuotationList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    // Mesma convenção de `Solicitacao/index.tsx`: `useRequest`'s TypesRequest
    // não tem variante "delete" — "update" é usada só para escolher o
    // tratamento interno; o texto exibido vem de `personalizedMessage`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  // "Receber Solicitação" (sem responsável, sem gate de permissão — T-081-API-03).
  const receiveMutation = useRequest({
    asyncFunction: async (uuid: string) => receiveRequestPurchase(uuid),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.inQuotationList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    typesRequest: 'update',
    personalizedMessage: queueText.receivedToast,
    actionSuccess: () => {
      // Receber move a solicitação para "Meus Processos" e demais listas.
      invalidateSupplyQueries(queryClient);
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
  const isReceiving = receiveMutation.isPending;

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
        enableHiding: false, // coluna-âncora — nunca ocultável
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
      // Legado: cabeçalho "Resp. Atual" nesta fila.
      columnHelper.accessor((row) => row.responsible?.name ?? '', {
        id: 'responsible',
        header: text.supply.columns.responsibleShort,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.responsible?.name ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.supply.columns.responsibleShort },
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
      // "Cot. Recebidas" = recebidas/total (`received_quotations_count`, status 3).
      columnHelper.display({
        id: 'quotationsReceived',
        header: text.supply.columns.receivedQuotations,
        cell: ({ row }) => (
          <Badge
            colorPalette={(row.original.received_quotations_count ?? 0) > 0 ? 'blue' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {formatReceivedQuotations(row.original)}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.supply.columns.receivedQuotations },
      }),
      // "Refazer" (legado `request-quotations/index.blade.php:126`): triângulo
      // vermelho quando a solicitação está em cotação (status 1/2) e tem
      // movimento aguardando aprovação (`needs_redo`, API-10).
      columnHelper.display({
        id: 'needsRedo',
        header: text.supply.list.redoIndicator,
        cell: ({ row }) =>
          row.original.needs_redo ? (
            <Box
              as="span"
              display="inline-flex"
              role="img"
              aria-label={text.supply.list.redoIndicator}
              title={text.supply.list.redoIndicator}
            >
              <Icon as={FiAlertTriangle} color="red.500" boxSize={4} />
            </Box>
          ) : null,
        meta: { ...styleColumTable.sm, gridLabel: text.supply.list.redoIndicator },
      }),
      // Acréscimos do novo (D-01 manter): Tipo, Prioridade e Status.
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
          const actionLabels = text.supply.actions;
          const visible = getQuotationQueueActions(item, supplyContext);

          // Mapa id -> item de menu; a ORDEM e a visibilidade vêm das regras.
          const menu: Record<
            QuotationQueueActionId,
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
              onClick: () => navigate(quotationQueueRoutes.view(uuid)),
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
              disabled: isReceiving,
            },
            transfer: {
              label: actionLabels.transfer,
              icon: FiRepeat,
              onClick: () => setTransferUuid(uuid),
            },
            quote: {
              label: actionLabels.quote,
              icon: FiTag,
              onClick: () => navigate(quotationQueueRoutes.quotationTab(uuid)),
            },
            sendToAuthorization: {
              label: actionLabels.sendToAuthorization,
              icon: FiSend,
              onClick: () => navigate(quotationQueueRoutes.quotationTab(uuid)),
            },
            createSub: {
              label: actionLabels.createSub,
              icon: Split,
              onClick: () => setSeparateUuid(uuid),
            },
            stepBack: {
              label: actionLabels.stepBack,
              icon: FiCornerUpLeft,
              onClick: () => setStepBackUuid(uuid),
            },
            edit: {
              label: actionLabels.edit,
              icon: FiEdit,
              onClick: () => navigate(quotationQueueRoutes.edit(uuid)),
            },
            delete: {
              label: actionLabels.delete,
              icon: FiTrash2,
              onClick: () => handleDeleteClick(item),
              tone: 'danger',
              disabled: isDeleting,
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
    [navigate, isDeleting, isReceiving, languageGB, text, supplyContext]
  );

  const gridSettings = useGridSettings<RequestPurchaseListItem>({
    storageKey: inQuotationStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([inQuotationList]);
  const items = inQuotationList.data?.data?.items;
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
            // SEM `ButtonAdd` — a criação de cotação acontece dentro da aba
            // Cotações do formulário único (FE-03), este hub NUNCA cria
            // (ver cabeçalho do arquivo).
            <>
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </>
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.inQuotation.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.inQuotation.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        {/* Legenda de status — fidelidade ao legado (`request-purchase.
            _legend.blade.php`), acima do grid. TODOS os 11 status do enum. */}
        <Box mt={4}>
          <RequestPurchaseStatusLegend />
        </Box>

        <Box mt={6}>
          {/* SEM CTA de criação (ver cabeçalho do arquivo). */}
          <Table
            isLoading={isLoading}
            getRowHighlight={emergencyRowHighlight}
            isError={inQuotationList.isError}
            error={inQuotationList.error}
            isEmpty={isEmpty}
            onRetry={() => inQuotationList.refetch()}
            isRetrying={inQuotationList.isFetching}
            emptyIcon={FileText as ElementType}
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
        statusOptions={inQuotationStatusOptions}
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

      <SeparateAtQuotationDialog
        isOpen={separateUuid !== null}
        onClose={() => setSeparateUuid(null)}
        requestPurchaseUuid={separateUuid}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.code ?? toDelete?.justification}
        tone="danger"
      />

      {/* Solicitações negadas: abre uma vez e marca as notificações como lidas (legado: Cotações). */}
      <DeniedRequestsModal />
    </ContainerGrid>
  );
}
