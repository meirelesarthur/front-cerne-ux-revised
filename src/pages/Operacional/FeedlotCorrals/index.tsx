// src/pages/Operacional/FeedlotCorrals/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CURRAIS (FeedlotCorral) — Operacional/
// Confinamento. Rota: /operacional/currais (guardada por
// `feedlot-corrals_view`, TASK-043-CUR-T02, `02-Tela-Lista-Currais.md`).
// SUBSTITUI a casca mínima da T01 por inteiro.
//
// Mirror estrutural `FeedlotSectors/index.tsx` (referência PRIMÁRIA, get_pwa_
// grid_query_pattern "Hook 1: sem ID de contexto" + Contrato B de filtro):
//   - grid paginado (TableProvider + Table) via useFeedlotCorralsList
//     (useCustomGridQuery, 10/pág, backend ordena identification DESC);
//   - HeaderTable → botão "Novo" (feedlot-corrals_create);
//   - FilterSideFeedlotCorrals → drawer (name/feedlot_sector_id/status);
//   - Excluir via useRequest genérico + DeleteConfirmDialog
//     (feedlot-corrals_delete; invalida a própria queryKey + `feedlotMap.tree`
//     — contrato-tela §9, o Mapa depende da existência do curral);
//   - Alterar Situação: diálogo compacto embutido nesta tela (reusa
//     `updateCorralStatus`+`feedlotCorralStatus-schema`, T01 — o diálogo
//     completo do Mapa, `FeedlotCorralStatusDialog.tsx`, é acoplado a
//     `CorralCardData`/lotes do card e NÃO é reusável aqui sem inventar dados
//     ausentes no `FeedlotCorralListItem`, Regra 9 — SEM MOCK).
//
// Colunas LM-001..011 (contrato-currais-norm.md `list_manifest`): 10 colunas
// de dado + ações — SEM "Setor"/"Criado em" (não fazem parte da listagem
// legada, só do filtro/detalhe). `animals_count`/`capacity_percent`/
// `capacity_status` (GAP-API-02) já vêm resolvidos por `FeedlotCorralResource`
// quando a relação `batches.animals` está eager-carregada no `index`
// (TASK-BE-043-CUR-01) — a coluna permanece TOLERANTE a `null` (LM-009).
//
// DIVERGÊNCIA DECLARADA (AC-006/"Histórico"): o contrato pede visibilidade
// condicionada a `count_history>0`, mas `FeedlotCorralListItem` não expõe uma
// contagem de histórico (fora do escopo desta Tarefa alterar o Resource) —
// a ação fica sempre visível sob `feedlot-corrals_view`; a tela de destino
// (T09) trata o caso vazio. Estado honesto, não inventado (Regra 9).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState, type ElementType } from 'react';

import {
  Box,
  Dialog,
  Flex,
  Icon,
  Portal,
  SimpleGrid,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { Controller, useForm } from 'react-hook-form';
import { FiBox, FiEdit, FiEye, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Tooltip } from '@/components/TooLtip';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { styleColumTable } from '@/utils/style-colum-table';

import { feedlotCorralStatusColor } from '@/constants/FeedlotCorrals/feedlot-corral-status-color';
import { feedlotCorralStatusOptions } from '@/constants/FeedlotCorrals/options/feedlot-corral-status-options';
import { queryKey } from '@/constants/query-key';

import {
  FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED,
  feedlotCorralStatusSchemaResolver,
  type FeedlotCorralStatusFormValues,
} from '@/validations/schemas/FeedlotCorrals/feedlotCorralStatus-schema';

import {
  deleteFeedlotCorral,
  updateCorralStatus,
} from '@/services/v2/FeedlotCorrals/feedlot-corral-service';

import type { LanguageDate } from '@/@types/language';
import type {
  FeedlotCorralFilterForm,
  FeedlotCorralListItem,
  UpdateFeedlotCorralStatusRequest,
} from '@/@types/v2/FeedlotCorrals';

import { FilterSideFeedlotCorrals } from './FilterSideFeedlotCorrals';
import { HeaderTable } from './HeaderTable';
import { useFeedlotCorralsList } from './useFeedlotCorrals';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `FEEDLOT_SECTORS_STORAGE_KEY`), nunca literal cru repetido.
const FEEDLOT_CORRALS_STORAGE_KEY =
  'OperacionalFeedlotCorrals' + queryKey.feedlotCorrals.feedlotCorrals;

// LM-004 / CV-003 — `total_area` é CLIENTE (`width*length`), formatado
// "moeda" (2 casas, separador pt-BR) + " m²" — o backend não calcula/envia.
const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatAreaTotal(width: number | null, length: number | null): string {
  if (width === null || width === undefined || length === null || length === undefined) {
    return '—';
  }
  return `${areaFormatter.format(width * length)} m²`;
}

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function FeedlotCorralList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.feedlotCorrals.feedlotCorral;

  const canCreate = can('feedlot-corrals_create');
  const canEdit = can('feedlot-corrals_edit');
  const canDelete = can('feedlot-corrals_delete');
  // AC-008 (contrato-currais-norm.md §11): `PUT .../status` já aceita
  // `feedlot-map_manage` OU `feedlot-corrals_edit` no backend
  // (`FeedlotCorralController::middleware()` + `UpdateFeedlotCorralStatusRequest::
  // authorize()`, CUR-04a/PARADA-API-07 Opção A). GAP-API-07 está resolvido —
  // o gate espelha o OR do endpoint (mirror `CreateOrUpdateFeedlotCorral.tsx`).
  const canChangeStatus = can('feedlot-map_manage') || can('feedlot-corrals_edit');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FEEDLOT_CORRALS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FeedlotCorralFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<FeedlotCorralListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // ---- Estado de "Alterar Situação" (diálogo compacto, AC-008) ------------
  const [statusTarget, setStatusTarget] = useState<FeedlotCorralListItem | null>(null);
  const {
    open: isStatusDialogOpen,
    onOpen: onOpenStatusDialog,
    onClose: onCloseStatusDialog,
  } = useDisclosure();

  const feedlotCorralsList = useFeedlotCorralsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: {
      name: paginatedQuery.filter?.name,
      feedlot_sector_id: paginatedQuery.filter?.feedlot_sector_id?.value,
      status: paginatedQuery.filter?.status?.value,
    },
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ feedlotCorralUuid }: { feedlotCorralUuid: string }) =>
      deleteFeedlotCorral(feedlotCorralUuid),
    queryKey: queryKey.feedlotCorrals.feedlotCorrals,
    queryKey2: queryKey.feedlotCorrals.feedlotCorral,
    queryKey3: queryKey.feedlotMap.tree,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção já usada por `FeedlotSector`/`FeedlotYard` para exclusão.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(feedlotCorral: FeedlotCorralListItem) {
    setToDelete(feedlotCorral);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ feedlotCorralUuid: toDelete.uuid });
    }
  }

  function handleChangeStatusClick(feedlotCorral: FeedlotCorralListItem) {
    setStatusTarget(feedlotCorral);
    onOpenStatusDialog();
  }

  function handleCloseStatusDialog() {
    onCloseStatusDialog();
    setStatusTarget(null);
  }

  const columnHelper = createColumnHelper<FeedlotCorralListItem>();
  const defaultColumns = useMemo(
    () => [
      // LM-001
      columnHelper.accessor('identification', {
        header: text.list.table.identification,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.identification}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.identification },
      }),
      // LM-002
      columnHelper.accessor('name', {
        header: text.list.table.name,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
        meta: { gridLabel: text.list.table.name },
      }),
      // LM-003 — enum description ou '-'
      columnHelper.accessor((row) => row.installation_type?.label, {
        id: 'installation_type',
        header: text.list.table.installationType,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.installation_type?.label ?? '—'}</Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.installationType },
      }),
      // LM-004 — CV-003, client-side (width*length), NÃO vem do backend.
      columnHelper.accessor((row) => (row.width ?? 0) * (row.length ?? 0), {
        id: 'area_total',
        header: text.list.table.areaTotal,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatAreaTotal(row.original.width, row.original.length)}</Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.areaTotal },
      }),
      // LM-005
      columnHelper.accessor((row) => row.floor?.label, {
        id: 'floor',
        header: text.list.table.floor,
        cell: ({ row }) => <Text fontSize="sm">{row.original.floor?.label ?? '—'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.floor },
      }),
      // LM-006
      columnHelper.accessor((row) => row.shading?.label, {
        id: 'shading',
        header: text.list.table.shading,
        cell: ({ row }) => <Text fontSize="sm">{row.original.shading?.label ?? '—'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.shading },
      }),
      // LM-007
      columnHelper.accessor((row) => row.trough?.description, {
        id: 'trough',
        header: text.list.table.trough,
        cell: ({ row }) => <Text fontSize="sm">{row.original.trough?.description ?? '—'}</Text>,
        meta: { ...styleColumTable.md, gridLabel: text.list.table.trough },
      }),
      // LM-008
      columnHelper.accessor((row) => row.drinking_fountain?.description, {
        id: 'drinking_fountain',
        header: text.list.table.drinkingFountain,
        cell: ({ row }) => (
          <Text fontSize="sm">{row.original.drinking_fountain?.description ?? '—'}</Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.drinkingFountain },
      }),
      // LM-009 / GAP-API-02 — `animals_count`/`capacity_percent`/
      // `capacity_status` já resolvidos pelo backend (`FeedlotCorralResource`,
      // TASK-BE-043-CUR-01) — coluna TOLERANTE a `null` (relação não
      // eager-carregada fora do `index`).
      columnHelper.display({
        id: 'animals_capacity',
        header: text.list.table.capacity,
        cell: ({ row }) => {
          const item = row.original;
          const label = `${item.animals_count ?? '—'}/${item.capacity ?? '—'}`;
          const percentLabel =
            item.capacity_percent !== null && item.capacity_percent !== undefined
              ? `${percentFormatter.format(item.capacity_percent)}%`
              : undefined;
          return (
            <Flex align="center" gap={2}>
              {item.capacity_status && (
                <Tooltip content={percentLabel}>
                  <Box boxSize="2.5" borderRadius="full" bg={item.capacity_status} flexShrink={0} />
                </Tooltip>
              )}
              <Text fontSize="sm">{label}</Text>
            </Flex>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.capacity },
      }),
      // LM-010 — dot color (client, backend não envia cor) + enum description.
      columnHelper.accessor((row) => row.status?.label, {
        id: 'status',
        header: text.list.table.status,
        enableHiding: false,
        cell: ({ row }) => {
          const status = row.original.status;
          const colorToken = status?.value ? feedlotCorralStatusColor[status.value] : undefined;
          return (
            <Flex align="center" gap={2}>
              <Box
                boxSize="2.5"
                borderRadius="full"
                bg={`${colorToken ?? 'gray'}.500`}
                flexShrink={0}
              />
              <Text fontSize="sm">{status?.label ?? '—'}</Text>
            </Flex>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.status },
      }),
      // LM-011 — AC-005/006/007/008/009.
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/operacional/currais/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {/* AC-006 — visibilidade real seria `count_history>0`; sem essa
                  contagem no Resource (fora do escopo desta Tarefa), a ação
                  fica sempre visível (estado honesto, Regra 9). */}
              <Actions.Item
                icon={<Icon as={FiBox} />}
                onClick={() => navigate(`/operacional/currais/${row.original.uuid}/historico`)}
              >
                {text.list.actions.history}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/operacional/currais/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canChangeStatus && (
                <Actions.Item
                  icon={<Icon as={FiRefreshCw} />}
                  onClick={() => handleChangeStatusClick(row.original)}
                >
                  {text.list.actions.changeStatus}
                </Actions.Item>
              )}
              {canDelete && (
                <>
                  <Actions.Separator />
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(row.original)}
                    tone="danger"
                    disabled={isDeleting}
                  >
                    {text.list.actions.delete}
                  </Actions.Item>
                </>
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
    [
      navigate,
      isDeleting,
      canEdit,
      canDelete,
      canChangeStatus,
      languageGB.defaltStrings.actions,
      text,
    ]
  );

  const gridSettings = useGridSettings<FeedlotCorralListItem>({
    storageKey: FEEDLOT_CORRALS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([feedlotCorralsList]);
  const items = feedlotCorralsList.data?.data?.items;
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
            isError={feedlotCorralsList.isError}
            error={feedlotCorralsList.error}
            isEmpty={isEmpty}
            onRetry={() => feedlotCorralsList.refetch()}
            isRetrying={feedlotCorralsList.isFetching}
            emptyIcon={FiBox as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : canCreate
                  ? text.list.emptyState.titleEmpty
                  : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : canCreate
                  ? text.list.emptyState.descriptionEmpty
                  : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/operacional/currais/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFeedlotCorrals
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.name}
        tone="danger"
      />

      <FeedlotCorralQuickStatusDialog
        isOpen={isStatusDialogOpen}
        target={statusTarget}
        languageGB={languageGB}
        onClose={handleCloseStatusDialog}
      />
    </ContainerGrid>
  );
}

// -----------------------------------------------------------------------------
// Diálogo compacto de "Alterar Situação" (AC-008/F05, escopo da listagem,
// TASK-043-CUR-T08 — `08-Modal-Alterar-Situacao.md`).
// REUSA `updateCorralStatus`/`feedlotCorralStatusSchemaResolver`/
// `FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED` (T01) — NÃO reusa o componente
// `FeedlotCorralStatusDialog` do Mapa (acoplado a `CorralCardData`/lotes do
// card, dados que `FeedlotCorralListItem` não tem; inventar esses dados
// violaria a Regra 9 — SEM MOCK). Options de status vêm do factory client-side
// `feedlotCorralStatusOptions` (T01) — evita round-trip extra a
// `/feedlot-corrals/options` só para os 7 valores estáveis do enum.
// Reusa i18n `feedlotMap.feedlotMap.status.{title,fields,validation}` (T01
// já documenta esse reuso para a tela standalone).
//
// Gate AC-008 (resolvido): `PUT .../status` aceita `feedlot-map_manage` OU
// `feedlot-corrals_edit` no backend (CUR-04a/PARADA-API-07 Opção A) — a ação
// já fica OCULTA na lista quando o usuário não tem nenhuma das duas
// (`canChangeStatus`, componente pai), mas o submit deste diálogo faz a
// MESMA checagem OR em profundidade (defesa, mirror exato do gate do wizard
// `CreateOrUpdateFeedlotCorral.tsx` T06, `onSubmit`/passo 2 "Situação",
// linha 437) — nunca chama a API às cegas.
//
// Aviso de remoção de lotes (IG-013, mirror `UpdateFeedlotCorralStatusAction`):
// quando o status ATUAL do curral é `OC` (ocupado) e o DESTINO é diferente, o
// backend desvincula os lotes e limpa datas/dieta. `FeedlotCorralListItem`
// não expõe contagem de lotes (só `animals_count`, GAP-API-02) — o aviso usa
// esse sinal real disponível em vez de inventar uma contagem de lotes que a
// API não devolve aqui (Regra 9 — SEM MOCK), texto próprio
// `feedlotCorrals.feedlotCorral.list.changeStatusDetachConfirm`.
// -----------------------------------------------------------------------------

interface FeedlotCorralQuickStatusDialogProps {
  isOpen: boolean;
  target: FeedlotCorralListItem | null;
  languageGB: LanguageDate;
  onClose: () => void;
}

const STATUS_DIALOG_EMPTY_VALUES: FeedlotCorralStatusFormValues = {
  status: null,
  available_at: null,
  note: '',
};

function FeedlotCorralQuickStatusDialog({
  isOpen,
  target,
  languageGB,
  onClose,
}: FeedlotCorralQuickStatusDialogProps) {
  const text = languageGB.feedlotMap.feedlotMap.status;
  const listText = languageGB.feedlotCorrals.feedlotCorral.list;
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const statusOptions = feedlotCorralStatusOptions.options(languageGB);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedlotCorralStatusFormValues>({
    mode: 'onChange',
    resolver: feedlotCorralStatusSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: STATUS_DIALOG_EMPTY_VALUES,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      status: target ? feedlotCorralStatusOptions.getOption(target.status.value, languageGB) : null,
      available_at: target?.available_at ?? null,
      note: target?.last_status_note ?? '',
    });
  }, [isOpen, target]);

  const watchedStatus = watch('status');
  const requiresDetail =
    !!watchedStatus &&
    (FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED as readonly string[]).includes(watchedStatus.value);

  // IG-013/mirror `UpdateFeedlotCorralStatusAction` — detach real ocorre
  // quando o status ATUAL é `OC` e o DESTINO muda para qualquer outro
  // (não só o conjunto {VS,LI,MA,FE}). `animals_count` é o único sinal real
  // de "há lotes vinculados" disponível no item da lista (Regra 9).
  const willDetachBatches =
    target?.status.value === 'OC' &&
    !!watchedStatus &&
    watchedStatus.value !== 'OC' &&
    (target?.animals_count ?? 0) > 0;

  const [pendingPayload, setPendingPayload] = useState<UpdateFeedlotCorralStatusRequest | null>(
    null
  );

  const mutation = useMutation({
    mutationFn: async (payload: UpdateFeedlotCorralStatusRequest) => {
      if (!target) throw new Error('target inválido');
      return updateCorralStatus(target.uuid, payload);
    },
    onSuccess: () => {
      toaster.success({ title: text.title, description: languageGB.defaltStrings.actionSuccess });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotCorrals.feedlotCorrals] });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
      setPendingPayload(null);
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  const isSubmitting = mutation.isPending;

  function onSubmit(data: FeedlotCorralStatusFormValues) {
    // AC-008 (resolvido) — gate OR em profundidade, mirror EXATO do wizard
    // (T06, `CreateOrUpdateFeedlotCorral.tsx:437`): a ação já é ocultada na
    // lista sem nenhuma das duas permissões, mas o submit NUNCA chama a API
    // às cegas.
    if (!can('feedlot-map_manage') && !can('feedlot-corrals_edit')) {
      toaster.error({
        title: text.title,
        description:
          languageGB.feedlotCorrals.feedlotCorral.wizard.submit.situationPermissionDenied,
      });
      return;
    }

    const payload: UpdateFeedlotCorralStatusRequest = {
      status: data.status!.value,
      available_at: data.available_at,
      note: data.note || null,
    };

    if (willDetachBatches) {
      setPendingPayload(payload);
      return;
    }

    mutation.mutate(payload);
  }

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={(details: { open: boolean }) => {
          if (!details.open && !isSubmitting) onClose();
        }}
        size="sm"
        lazyMount
        unmountOnExit
      >
        <Portal>
          <Dialog.Backdrop />
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Positioner>
            {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
            <Dialog.Content>
              <Dialog.Header>
                {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
                <Dialog.Title>{text.title}</Dialog.Title>
              </Dialog.Header>

              <form id="feedlot-corral-list-status-dialog-form" onSubmit={handleSubmit(onSubmit)}>
                <Dialog.Body>
                  <SimpleGrid columns={1} gap={4}>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.status}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={statusOptions}
                          error={error?.message}
                          isRequired
                        />
                      )}
                    />

                    {requiresDetail && (
                      <>
                        <Controller
                          name="available_at"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field
                              label={text.fields.availableAt}
                              isRequired
                              errorText={fieldState.error?.message}
                            >
                              <DateInput value={field.value} onChange={field.onChange} />
                            </Field>
                          )}
                        />

                        <Textarea
                          label={text.fields.note}
                          {...register('note')}
                          error={errors.note?.message}
                          isRequired
                          minH="100px"
                        />
                      </>
                    )}
                  </SimpleGrid>
                </Dialog.Body>
              </form>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="outline"
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                />
                <Button
                  title={languageGB.defaltStrings.save}
                  type="submit"
                  form="feedlot-corral-list-status-dialog-form"
                  loading={isSubmitting}
                />
              </Dialog.Footer>
              {/* @ts-ignore ChakraUI v3 headless dialog */}
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <DeleteConfirmDialog
        isOpen={pendingPayload !== null}
        onClose={() => setPendingPayload(null)}
        onConfirm={() => pendingPayload && mutation.mutate(pendingPayload)}
        isLoading={isSubmitting}
        title={listText.changeStatusDetachConfirm.title}
        description={listText.changeStatusDetachConfirm.description.replace(
          '{count}',
          String(target?.animals_count ?? 0)
        )}
        hideQuestionMark
        tone="warning"
      />
    </>
  );
}
