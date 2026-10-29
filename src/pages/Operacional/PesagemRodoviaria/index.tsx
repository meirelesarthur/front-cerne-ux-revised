// src/pages/Operacional/PesagemRodoviaria/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PESAGEM RODOVIÁRIA (ModuleWeighing, FE-SCR-01,
// TASK-MWG-FE-02) — Operacional > Agricultura, rota
// `/operacional/pesagem-rodoviaria` (`module-weighing_view`).
//
// PINO CRÍTICO: `ModuleWeighing` ≠ `Weighing` (pesagem ANIMAL, F-071, já em
// produção em `src/pages/Operacional/Pesagem/**`) — namespace/rota/i18n
// deliberadamente disjuntos (`CONTRATO-TELA-PESAGEM-FE §1`). Casca de GRID
// mirror `Operacional/Pesagem/index.tsx` (feature irmã).
//
// Colunas (8 + ações, `LM-001..LM-010`): Status (dot indicator)/Código/
// Responsável/Data/Armazém/Produto/Tipo/Categoria/Ações.
//
// Menu de ações (`AM-005..AM-010`) — 6 itens condicionais, ver
// `ModuleWeighingActionsMenu.tsx`.
//
// Exclusão (`AM-010`, GAP-PES-02, decisão do dono): `DELETE` é BLOQUEADO
// (422) quando `status>=Finalizado` ou vinculada a NFe/transferência — a UI
// não decide a regra, só reage à resposta (mensagem da API tal qual veio).
//
// "Emitir NFe"/"Emitir Romaneio" (`AM-008`/`AM-009`, GAP-PES-07): handoff —
// consulta a elegibilidade (`GET nfe`/`GET transfer`) e navega para a tela
// de destino (features irmãs, fora deste contrato) com o payload via router
// state; nenhuma Action de vínculo é chamada aqui.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { moduleWeighingStatusColor } from '@/constants/ModuleWeighing/module-weighing-status';
import { moduleWeighingCategoryOptions } from '@/constants/ModuleWeighing/options/module-weighing-category-options';
import { moduleWeighingStatusOptions } from '@/constants/ModuleWeighing/options/module-weighing-status-options';
import { moduleWeighingTypeOptions } from '@/constants/ModuleWeighing/options/module-weighing-type-options';
import { queryKey } from '@/constants/query-key';

import {
  deleteModuleWeighing,
  getModuleWeighingNfeEligibility,
  getModuleWeighingTransferEligibility,
} from '@/services/v2/ModuleWeighing/module-weighing-service';

import type {
  ModuleWeighingFilterForm,
  ModuleWeighingListItem,
} from '@/@types/v2/ModuleWeighing/module-weighing';

import { DeleteModuleWeighingDialog } from './DeleteModuleWeighingDialog';
import { FilterSideModuleWeighing } from './FilterSideModuleWeighing';
import { HeaderTable } from './HeaderTable';
import { ModuleWeighingActionsMenu } from './ModuleWeighingActionsMenu';
import { useModuleWeighingsList } from './useModuleWeighings';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTag } from '@/components/ui/StatusTag';

const MODULE_WEIGHING_LIST_ROUTE = '/operacional/pesagem-rodoviaria';

export default function ModuleWeighingList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const queryClient = useQueryClient();
  const text = languageGB.moduleWeighing.moduleWeighing;

  const canEdit = can('module-weighing_edit');
  const canDelete = can('module-weighing_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        text.titleModule + queryKey.moduleWeighing.moduleWeighings + (activeFarmUuid ?? ''),
    }),
    [text.titleModule, activeFarmUuid]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ModuleWeighingFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const moduleWeighingsList = useModuleWeighingsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão (GAP-PES-02) -------------------------------------
  const [toDelete, setToDelete] = useState<ModuleWeighingListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteModuleWeighing(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.moduleWeighing.moduleWeighings] });
      toaster.success({
        title: text.singularLabel,
        description: text.common.toast.deleteSuccess,
        duration: 7000,
      });
      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      // GAP-PES-02 — a `message` do envelope de erro vem TAL QUAL da API
      // (bloqueio de status>=Finalizado ou vínculo NFe/transferência), nunca
      // reescrita no front.
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 9000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: ModuleWeighingListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) deleteMutation.mutate(toDelete.uuid);
  }

  // ---- Handoff NFe/Romaneio (GAP-PES-07) -----------------------------------
  async function handleIssueNfe(item: ModuleWeighingListItem) {
    try {
      const response = await getModuleWeighingNfeEligibility(item.uuid);
      navigate('/fiscal/nfe-emitidas/novo', {
        state: { moduleWeighingNfePrefill: response.data, moduleWeighingUuid: item.uuid },
      });
    } catch (error) {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    }
  }

  async function handleIssueTransfer(item: ModuleWeighingListItem) {
    try {
      const response = await getModuleWeighingTransferEligibility(item.uuid);
      navigate('/administrativo/transf-armazens/novo', {
        state: { moduleWeighingTransferPrefill: response.data, moduleWeighingUuid: item.uuid },
      });
    } catch (error) {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    }
  }

  const columnHelper = createColumnHelper<ModuleWeighingListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('status', {
        header: languageGB.defaltStrings.statusColumn,
        cell: ({ row }) => {
          // Correção 050 (BUG-10) — `ModuleWeighingStatus` é backed enum
          // STRING no backend (mesma causa-raiz de BUG-4/5): a API devolve
          // `status` como string ("2") na listagem, embora o tipo de front
          // declare união de números. `moduleWeighingStatusColor[...]`
          // (acesso por chave de objeto) tolera a string por coerção
          // implícita de chave, mas `moduleWeighingStatusOptions.getLabel`
          // usa `Map.get` (chave tipada, sem coerção) e retornava `undefined`
          // — Badge com cor certa e texto vazio. Normalizado aqui, no ponto
          // de consumo, mesma técnica de `mapNextStepHydration`.
          const status = Number(row.original.status) as typeof row.original.status;
          return (
            <StatusTag
              label={moduleWeighingStatusOptions.getLabel(status, languageGB) ?? ''}
              color={`${moduleWeighingStatusColor[status]}.500`}
            />
          );
        },
        enableSorting: false,
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => <Text fontSize="sm">{row.original.responsible?.name ?? '-'}</Text>,
        enableSorting: false,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        enableSorting: false,
        meta: styleColumTable.date,
      }),
      columnHelper.display({
        id: 'warehouse',
        header: text.list.table.warehouse,
        cell: ({ row }) => <Text fontSize="sm">{row.original.warehouse?.description ?? '-'}</Text>,
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'product',
        header: text.list.table.product,
        cell: ({ row }) => <Text fontSize="sm">{row.original.product?.description ?? '-'}</Text>,
        enableSorting: false,
      }),
      columnHelper.accessor('type', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {moduleWeighingTypeOptions.getLabel(row.original.type, languageGB)}
          </Text>
        ),
        enableSorting: false,
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('category', {
        header: text.list.table.category,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {moduleWeighingCategoryOptions.getLabel(row.original.category, languageGB)}
          </Text>
        ),
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: text.common.table.actions,
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Flex justify="flex-end">
              <ModuleWeighingActionsMenu
                status={item.status}
                type={item.type}
                nfeUuid={item.nfe_uuid}
                transferUuid={item.transfer_uuid}
                canEdit={canEdit}
                canDelete={canDelete}
                isDeleting={isDeleting}
                labels={{
                  edit: text.list.actions.edit,
                  nextStep: text.list.actions.nextStep,
                  finalize: text.list.actions.finalize,
                  issueNfe: text.list.actions.issueNfe,
                  issueTransfer: text.list.actions.issueTransfer,
                  delete: text.list.actions.delete,
                }}
                onEdit={() => navigate(`${MODULE_WEIGHING_LIST_ROUTE}/${item.uuid}/editar`)}
                onNextStep={() => navigate(`${MODULE_WEIGHING_LIST_ROUTE}/${item.uuid}/etapa`)}
                onFinalize={() => navigate(`${MODULE_WEIGHING_LIST_ROUTE}/${item.uuid}/finalizar`)}
                onIssueNfe={() => handleIssueNfe(item)}
                onIssueTransfer={() => handleIssueTransfer(item)}
                onDelete={() => handleDeleteClick(item)}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete, languageGB]
  );

  const isLoading = checkLoadingStatus([moduleWeighingsList]);
  const items = moduleWeighingsList.data?.data?.items;
  const isEmpty = !isLoading && !moduleWeighingsList.isError && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={moduleWeighingsList.isError}
            error={moduleWeighingsList.error}
            isEmpty={isEmpty}
            onRetry={() => moduleWeighingsList.refetch()}
            isRetrying={moduleWeighingsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiFileText as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
          />
        </Box>
      </TableProvider>

      <FilterSideModuleWeighing
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteModuleWeighingDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteDialog.title}
        description={
          toDelete
            ? text.list.deleteDialog.descriptionTemplate.replace('{code}', String(toDelete.code))
            : undefined
        }
      />
    </ContainerGrid>
  );
}
