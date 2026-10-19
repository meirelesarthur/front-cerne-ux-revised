// src/pages/Administrativo/Solicitacao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Solicitação de Compras (RequestPurchase —
// Administrativo / Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-08).
// Rota `/administrativo/solicitacao` (guardada por `request-purchases_view`,
// JÁ RESERVADA em `navigationTree.ts:390`/`navigationPermissions.ts:180` —
// este arquivo não mexe em rota/menu, wiring real é `TASK-RP-FE-10`).
//
// Estrutura mirror `BaseRegistrations/DiagnosisPregnancy/index.tsx` (grid
// flat, `useCustomGridQuery` INLINE — sem wrapper `useRequestPurchases.tsx`
// intermediário, mandato explícito do task-packet) + canário
// `CadastrosBase/CentroCusto/index.tsx`/`BaseRegistrations/Headbands/
// index.tsx` (`useGridSettings`/`GridSettingsFloatingPanel`, protocolo de
// padrão v2).
//
// `listRequestPurchases` chama `GET /request-purchases` (`index()`) — já
// filtrado por `user_id = auth()->id()` server-side (contrato de API §3,
// DA-RP-13/regra 17 da Doc Bruta): "cada usuário só vê as próprias
// solicitações". Distinto de `listMyProcesses` (filtro `responsible_id`,
// tela "Meus Processos") e `listRejectedRequestPurchases` (filtro `status IN
// (5,10)`, tela "Rejeitados") — ambos fora do escopo desta Tarefa
// (`TASK-RP-FE-13`, GRUPO B).
//
// ⚠️ O endpoint `/request-purchases` AINDA NÃO EXISTE no fork (backend em
// curso EM PARALELO, mesma esteira) — esta tela RENDERIZA e COMPILA
// normalmente (o erro só ocorre em runtime, ao montar e disparar o fetch).
// Confirmação end-to-end contra o servidor real é `TASK-RP-FE-11` (GRUPO B).
//
// Badges por enum (NUNCA `bg` inline, regra do task-packet):
// `type_label` → Badge neutro (cinza, sem mapa de cor — só 1 badge
// informativo, sem semântica de estado); `status_label` → Badge
// `colorPalette={requestPurchaseStatusColor[status]}`; `priority_label` →
// Badge `colorPalette={requestPurchasePriorityColor[priority]}` (mapas
// definidos em `TASK-RP-FE-02`, sugestão visual do Arquiteto/Executor, não
// regra de negócio).
//
// -- Execução 081 / T-081-FE-05 (paridade com o legado, LEGADO-SUPRIMENTOS-03) --
// - Bolinha de status (tokens `supplyStatus1..11`) como 1ª coluna e linha do tipo
//   U destacada pelo token `supplyEmergencyRowBg` (`Table.getRowHighlight`).
// - Ações pelas regras de `supplyActionRules`: Visualizar, Relatório SLA (gate
//   `status-sla_report_view`, nova aba), Editar/Excluir (status 1) e Voltar Etapa
//   (responsável com `request-purchases_edit`, fora do status 1) com o
//   `StepBackDialog` compartilhado.
// - Excluir confirma com os literais do legado ("Você está certo ?" / "Uma vez
//   deletado, você não poderá recuperar esse item novamente!").
// - Ordenação por código desc, busca por código/descrição e 10 por página vêm do
//   servidor (T-081-API-04); a tela só repassa `search` e `per_page`.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FileText } from 'lucide-react';
import { FiClock, FiCornerUpLeft, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { DeniedRequestsModal } from '@/components/Suprimentos/DeniedRequestsModal';
import { emergencyRowHighlight } from '@/components/Suprimentos/emergencyRow';
import { canSlaReport, openSlaReport } from '@/components/Suprimentos/slaReport';
import { StepBackDialog } from '@/components/Suprimentos/StepBackDialog';
import {
  canDelete as canDeleteRule,
  canEdit as canEditRule,
  canStepBack,
} from '@/components/Suprimentos/supplyActionRules';
import { useSupplyActionContext } from '@/components/Suprimentos/useSupplyActionContext';
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
  listRequestPurchases,
} from '@/services/v2/RequestPurchases/request-purchase-service';

import type {
  RequestPurchaseFilterForm,
  RequestPurchaseListItem,
} from '@/@types/v2/RequestPurchases';

import { FilterSideSolicitacao } from './FilterSideSolicitacao';
import { HeaderTable } from './HeaderTable';
import { RequestPurchaseStatusLegend } from './RequestPurchaseStatusLegend';

export default function SolicitacaoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can('request-purchases_create');
  const canView = can('request-purchases_view');
  const supplyContext = useSupplyActionContext();
  const showSlaReport = canSlaReport(can);
  const text = languageGB.requestPurchases.requestPurchase;

  // Paginação (`userPaginatedQuery`) e personalização de grid
  // (`useGridSettings`) derivam da MESMA expressão de chave para nunca
  // divergirem (DEC-007 §12, mirror DiagnosisPregnancy/Headbands).
  const requestPurchasesStorageKey =
    languageGB.requestPurchases.requestPurchase.titleModule +
    queryKey.requestPurchases.requestPurchasesList +
    ':v3';

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: requestPurchasesStorageKey,
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
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação dos
        // `SelectAsyncPaginate` novos, TASK-CQ-FE-02) — não devem inflar o
        // badge "Filtros(N)" (mesma regra de `Inventario/index.tsx`/
        // `FilterSideRomaneios.tsx`).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<RequestPurchaseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // ---- Voltar Etapa (diálogo compartilhado) ---------------------------------
  const [stepBackUuid, setStepBackUuid] = useState<string | null>(null);

  const requestPurchasesList = useCustomGridQuery<
    RequestPurchaseListItem,
    RequestPurchaseFilterForm
  >({
    asyncFunction: listRequestPurchases,
    queryKey: queryKey.requestPurchases.requestPurchasesList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as RequestPurchaseFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ requestPurchaseUuid }: { requestPurchaseUuid: string }) => {
      return await deleteRequestPurchase(requestPurchaseUuid);
    },
    queryKey: queryKey.requestPurchases.requestPurchasesList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/
    // create/apply/export/revoke/restore) — "update" é a mesma convenção de
    // DiagnosisPregnancy/CentroCusto/Headbands para a mesma operação. O texto
    // exibido no toast vem de `personalizedMessage`, então o rótulo genérico
    // associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). Guarda de FK 422
    // (`destroy()` confirmada no contrato §DA-RP-12) tratada aqui como
    // qualquer outro erro de negócio (toast com a message do envelope).
    typesRequest: 'update',
    entityName: languageGB.requestPurchases.requestPurchase.singularLabel,
    personalizedMessage: languageGB.requestPurchases.requestPurchase.list.deletedToast,
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

  const columnHelper = createColumnHelper<RequestPurchaseListItem>();
  const defaultColumns = useMemo(
    () => [
      // Bolinha de status do legado (LM01): cor pelo token, nome acessível pelo status.
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
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.status,
          gridOrder: 'fixed-start',
          gridDataColumn: false,
        },
      }),
      columnHelper.accessor('code', {
        header: languageGB.requestPurchases.requestPurchase.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.code,
        },
      }),
      columnHelper.accessor('type_label', {
        header: languageGB.requestPurchases.requestPurchase.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
            {row.original.type_label}
          </Badge>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.type,
        },
      }),
      // Ordem padrão pedida pelo dono (task-packet): Código · Tipo · Dt.
      // Pedido · Descrição/Chamado · Duração · Solicitante · Responsável
      // Atual · Fazenda. Status/Prioridade NÃO fazem parte dessa ordem, mas
      // permanecem disponíveis (toggle via GridSettings) logo após Fazenda —
      // nada foi removido, só reordenado.
      columnHelper.accessor('request_date', {
        header: languageGB.requestPurchases.requestPurchase.list.table.requestDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.request_date)}
          </Text>
        ),
        meta: {
          ...styleColumTable.date,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.requestDate,
        },
      }),
      columnHelper.accessor('description', {
        header: languageGB.requestPurchases.requestPurchase.list.table.justification,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={FileText} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description ?? '—'}
            </Text>
          </Flex>
        ),
        meta: { gridLabel: languageGB.requestPurchases.requestPurchase.list.table.justification },
      }),
      columnHelper.accessor('duration_label', {
        header: languageGB.requestPurchases.requestPurchase.list.table.duration,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.duration_label ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.duration,
        },
      }),
      columnHelper.accessor((row) => row.user?.name ?? '', {
        id: 'requester',
        header: languageGB.requestPurchases.requestPurchase.list.table.requester,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.user?.name ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.requester,
        },
      }),
      columnHelper.accessor((row) => row.responsible?.name ?? '', {
        id: 'responsible',
        header: languageGB.requestPurchases.requestPurchase.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.responsible?.name ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.responsible,
        },
      }),
      columnHelper.accessor((row) => row.farm?.description ?? '', {
        id: 'farm',
        header: languageGB.requestPurchases.requestPurchase.list.table.farm,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.farm?.description ?? '—'}
          </Text>
        ),
        meta: {
          ...styleColumTable.md,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.farm,
        },
      }),
      columnHelper.accessor('priority_label', {
        header: languageGB.requestPurchases.requestPurchase.list.table.priority,
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.priority,
        },
      }),
      columnHelper.accessor('status_label', {
        header: languageGB.requestPurchases.requestPurchase.list.table.status,
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.status,
        },
      }),
      // ADITIVO (TASK-CQ-FE-02, hub de Cotações — LM-09) — contagem real de
      // cotações vinculadas, `RequestPurchaseResource::quotations_count`
      // (`whenCounted`, sempre presente nesta tela — `listRequestPurchases`
      // mapeia 1:1 para `index()`, que SEMPRE aplica `withCount('quotations')`,
      // `RequestPurchaseRepository::listWithFilters`). Badge neutro (cinza)
      // quando 0/ausente, informativo (azul) quando há cotações — mesma
      // convenção de badge sem cor semântica de status já usada na coluna
      // "Tipo". Só a CONTAGEM é exibida (não "X/Y recebidas" — o roteiro
      // original previa um par recebidas/total, mas o `Resource` real só
      // expõe UM número; exibir um "Y" inventado violaria a regra SEM MOCK,
      // ver relato de entrega desta Tarefa). Não-clicável nesta Tarefa — o
      // ponto de entrada real para a aba "Cotações" (Tab dentro de
      // `CreateOrUpdateSolicitacao.tsx`) é construído por `TASK-CQ-FE-03`,
      // fora do escopo desta Tarefa; a navegação "Editar" já existente nesta
      // grid já leva à MESMA tela onde a aba vai morar.
      columnHelper.accessor('quotations_count', {
        header: languageGB.requestPurchases.requestPurchase.list.table.quotations,
        cell: ({ row }) => {
          const quotationsCount = row.original.quotations_count ?? 0;
          return (
            <Badge
              colorPalette={quotationsCount > 0 ? 'blue' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {quotationsCount}
            </Badge>
          );
        },
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.requestPurchases.requestPurchase.list.table.quotations,
        },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          // Regras de exibição por status e papel (`supplyActionRules`): Editar e
          // Excluir só no status 1 (index.blade.php:119); Voltar Etapa só para o
          // responsável, fora do status 1.
          const canEditRow = canEditRule(row.original, supplyContext);
          const canDeleteRow = canDeleteRule(row.original, supplyContext);
          const canStepBackRow = canStepBack(row.original, supplyContext, {
            excludeFirstStatus: true,
          });

          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() =>
                      navigate(`/administrativo/solicitacao/${row.original.uuid}/visualizar`)
                    }
                  >
                    {text.list.table.actions.view}
                  </Actions.Item>
                )}
                {showSlaReport && (
                  <Actions.Item
                    icon={<Icon as={FiClock} />}
                    onClick={() => openSlaReport(row.original.uuid)}
                  >
                    {text.supply.actions.slaReport}
                  </Actions.Item>
                )}
                {canEditRow && (
                  <Actions.Item
                    icon={<Icon as={FiEdit} />}
                    onClick={() => navigate(`/administrativo/solicitacao/${row.original.uuid}`)}
                  >
                    {text.list.table.actions.edit}
                  </Actions.Item>
                )}
                {canDeleteRow && (
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(row.original)}
                    tone="danger"
                    disabled={isDeleting}
                  >
                    {text.list.table.actions.delete}
                  </Actions.Item>
                )}
                {canStepBackRow && (
                  <Actions.Item
                    icon={<Icon as={FiCornerUpLeft} />}
                    onClick={() => setStepBackUuid(row.original.uuid)}
                  >
                    {text.supply.actions.stepBack}
                  </Actions.Item>
                )}
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
    [navigate, isDeleting, languageGB, canView, supplyContext, showSlaReport, text]
  );

  const gridSettings = useGridSettings<RequestPurchaseListItem>({
    storageKey: requestPurchasesStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([requestPurchasesList]);
  const items = requestPurchasesList.data?.data?.items;
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
              {languageGB.requestPurchases.requestPurchase.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {languageGB.requestPurchases.requestPurchase.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        {/* Legenda de status — TASK-CQ-FE-16, mesmo componente reutilizável
            já usado em `Cotacoes/index.tsx` (`RequestPurchaseStatusLegend`,
            TASK-CQ-FE-15), posição equivalente: acima do grid, abaixo do
            cabeçalho/filtros. TODOS os 11 status do enum (default do
            componente), fiel ao legado. */}
        <Box mt={4}>
          <RequestPurchaseStatusLegend />
        </Box>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            getRowHighlight={emergencyRowHighlight}
            isError={requestPurchasesList.isError}
            error={requestPurchasesList.error}
            isEmpty={isEmpty}
            onRetry={() => requestPurchasesList.refetch()}
            isRetrying={requestPurchasesList.isFetching}
            emptyIcon={FileText as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? languageGB.requestPurchases.requestPurchase.list.emptyState.titleFiltered
                : languageGB.requestPurchases.requestPurchase.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? languageGB.requestPurchases.requestPurchase.list.emptyState.descriptionFiltered
                : languageGB.requestPurchases.requestPurchase.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={languageGB.requestPurchases.requestPurchase.list.emptyState.cta}
            onCreate={() => navigate('/administrativo/solicitacao/novo')}
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

      <StepBackDialog
        isOpen={stepBackUuid !== null}
        onClose={() => setStepBackUuid(null)}
        requestPurchaseUuid={stepBackUuid}
        onSuccess={() => setStepBackUuid(null)}
      />

      {/* Solicitações negadas: abre uma vez e marca as notificações como lidas (legado: Solicitações). */}
      <DeniedRequestsModal />
    </ContainerGrid>
  );
}
