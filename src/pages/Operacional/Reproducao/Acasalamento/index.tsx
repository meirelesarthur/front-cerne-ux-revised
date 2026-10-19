// src/pages/Operacional/Reproducao/Acasalamento/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de ACASALAMENTO — Operacional / Reprodução
// (BreedingMating, F-016, 97-Esteiras/001, TASK-BM-FE-03).
//
// Rota: /operacional/acasalamento (guardada por `breeding-matings_view`,
// registrada em `src/router/index.tsx` — Tarefa 09, este arquivo NÃO mexe em
// rota/menu, contrato de tela §6.1).
//
// Casca de GRID de verdade — `ContainerGrid` + `TableProvider` + `HeaderGrid`
// + `Table`, mirror `Reproducao/EstacaoDeMonta/index.tsx` /
// `Reproducao/LoteReproducao/index.tsx` / `Weaning/index.tsx` (decisão do
// Arquiteto — sem abas, `GAP-FE-BM-02`).
//
// 7 colunas na ordem exata do legado (contrato de tela §6.1, regra 2 da
// Tarefa): dot de status *(sem rótulo)* · Código · Data Cadastro ·
// Responsável · Ressincronização · Tipo / Última Etapa Realizada · Ações.
// `status_color` (hex bruto do envelope) NUNCA é lido — o dot usa o token de
// `breeding-mating-status.ts` (GAP-FE-BM-01).
//
// As 8 ações da linha (7 nós no menu + Ações da coluna) são governadas por
// flag `can_*` do servidor + permissão (`AcasalamentoActionsMenu.tsx`,
// contrato de tela §6.2) — `Finalizar`/`Excluir` abrem `DeleteConfirmDialog`
// dedicados (nunca mutam no `onClick` da linha, regra 8). A exclusão apaga em
// cascata os Acasalamentos-filho de ressincronização — invalida a listagem
// inteira (regra 9).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import type { ElementType } from 'react';

import { Box, Flex, HStack, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
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

import { BREEDING_MATING_STATUS_META } from '@/constants/breedingMating/breeding-mating-status';
import { queryKey } from '@/constants/query-key';

import {
  deleteBreedingMating,
  finishBreedingMating,
} from '@/services/v2/BreedingMating/breeding-mating-service';

import type { LanguageDate } from '@/@types/language';
import type {
  BreedingMatingFilterRequest,
  BreedingMatingListItem,
} from '@/@types/v2/BreedingMating';

import { AcasalamentoActionsMenu } from './AcasalamentoActionsMenu';
import { FilterSideAcasalamento } from './FilterSideAcasalamento';
import { HeaderTable } from './HeaderTable';
import { useAcasalamentosList } from './useAcasalamentos';

const ACASALAMENTO_LIST_ROUTE = '/operacional/acasalamento';

// Coluna composta "Tipo / Última Etapa Realizada" (contrato de tela §6.1
// regra 3, mirror `index.blade.php:95-98`): `type.value === 1` (Natural) →
// só `type.label`. Senão → `${type.label} / ${last_protocol_identification
// ?? (launch_type.value === 2 ? simplificado : '')}` — `simplificado` vem do
// dicionário (`options.launchType.simplified`), NUNCA string hardcoded.
function renderTypeLastStep(item: BreedingMatingListItem, languageGB: LanguageDate): string {
  if (item.type.value === 1) return item.type.label;

  const simplificado = languageGB.breedingMatings.breedingMating.options.launchType.simplified;
  const lastStep =
    item.last_protocol_identification ?? (item.launch_type.value === 2 ? simplificado : '');

  return `${item.type.label} / ${lastStep}`;
}

export default function AcasalamentoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const queryClient = useQueryClient();
  const text = languageGB.breedingMatings.breedingMating;

  const canView = can('breeding-matings_view');
  const canEdit = can('breeding-matings_edit');
  const canCreate = can('breeding-matings_create');
  const canDelete = can('breeding-matings_delete');
  const canViewPregnancyDiagnosis = can('pregnancy-diagnosis_view');

  // storageKey (regra 6 da Tarefa) = titleModule + queryKey + fazenda ativa —
  // nunca prefixar `storageKeyGB`, o hook já faz.
  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        text.titleModule + queryKey.breedingMatings.breedingMatingsList + (activeFarmUuid ?? ''),
    }),
    [text.titleModule, activeFarmUuid]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BreedingMatingFilterRequest>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const acasalamentosList = useAcasalamentosList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão — 1 useDisclosure + 1 selectedUuid por grupo
  //      (regra 8 da Tarefa; nunca compartilhar entre Finalizar/Excluir). ---
  const [toDelete, setToDelete] = useState<BreedingMatingListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const [toFinish, setToFinish] = useState<BreedingMatingListItem | null>(null);
  const {
    open: isOpenFinishDialog,
    onOpen: onOpenFinishDialog,
    onClose: onCloseFinishDialog,
  } = useDisclosure();

  // `useMutation` direto (não `useRequest`) — o toast de sucesso usa a
  // `message` do PRÓPRIO envelope da resposta (regra 10 da Tarefa), não um
  // texto fixo do dicionário.
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteBreedingMating(uuid),
    onSuccess: (response: any) => {
      // A exclusão apaga em cascata os Acasalamentos-filho de
      // ressincronização (regra 9) — invalida a listagem inteira.
      queryClient.invalidateQueries({ queryKey: [queryKey.breedingMatings.breedingMatingsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.breedingMatings.breedingMating] });

      toaster.success({
        title: text.singularLabel,
        description: response?.message ?? text.singularLabel,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const finishMutation = useMutation({
    mutationFn: async (uuid: string) => finishBreedingMating(uuid),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.breedingMatings.breedingMatingsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.breedingMatings.breedingMating] });

      toaster.success({
        title: text.singularLabel,
        description: response?.message ?? text.singularLabel,
        duration: 7000,
      });

      onCloseFinishDialog();
      setToFinish(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;
  const isFinishing = finishMutation.isPending;

  function handleDeleteClick(item: BreedingMatingListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) deleteMutation.mutate(toDelete.uuid);
  }

  function handleFinishClick(item: BreedingMatingListItem) {
    setToFinish(item);
    onOpenFinishDialog();
  }

  function handleConfirmFinish() {
    if (toFinish) finishMutation.mutate(toFinish.uuid);
  }

  const columnHelper = createColumnHelper<BreedingMatingListItem>();
  const defaultColumns = useMemo(
    () => [
      // Coluna 1 — dot de status, SEM rótulo (contrato de tela §6.1 #1;
      // legado: "# (dot colorido por iatfStatus/status)"). `status_color`
      // do envelope NUNCA é lido — token vem de `BREEDING_MATING_STATUS_META`.
      columnHelper.display({
        id: 'status',
        header: '',
        cell: ({ row }) => (
          <Box
            boxSize="2"
            borderRadius="full"
            backgroundColor={BREEDING_MATING_STATUS_META[row.original.status.value]?.badgeToken}
          />
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('responsible_name', {
        header: text.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.responsible_name || '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('resync', {
        header: text.list.table.resync,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.resync ? text.options.resync.yes : text.options.resync.no}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'typeLastStep',
        header: text.list.table.typeLastStep,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {renderTypeLastStep(row.original, languageGB)}
          </Text>
        ),
        meta: styleColumTable.lg,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Flex justify="flex-end">
              <AcasalamentoActionsMenu
                item={item}
                canView={canView}
                canEdit={canEdit}
                canViewPregnancyDiagnosis={canViewPregnancyDiagnosis}
                canDelete={canDelete}
                isFinishing={isFinishing}
                isDeleting={isDeleting}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  nextStep: text.list.actions.nextStep,
                  nextStepIndividual: text.list.actions.nextStepIndividual,
                  finish: text.list.actions.finish,
                  pregnancyDiagnosis: text.list.actions.pregnancyDiagnosis,
                  delete: text.list.actions.delete,
                }}
                onView={() => navigate(`${ACASALAMENTO_LIST_ROUTE}/${item.uuid}`)}
                onEdit={() => navigate(`${ACASALAMENTO_LIST_ROUTE}/${item.uuid}/editar`)}
                onNextStep={() => navigate(`${ACASALAMENTO_LIST_ROUTE}/${item.uuid}/proxima-etapa`)}
                onNextStepIndividual={() =>
                  navigate(`${ACASALAMENTO_LIST_ROUTE}/${item.uuid}/proxima-etapa?modo=individual`)
                }
                onFinish={() => handleFinishClick(item)}
                onPregnancyDiagnosis={() =>
                  navigate(`${ACASALAMENTO_LIST_ROUTE}/${item.uuid}/diagnostico-gestacao`)
                }
                onDelete={() => handleDeleteClick(item)}
              />
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
      isDeleting,
      isFinishing,
      text,
      languageGB,
      canView,
      canEdit,
      canDelete,
      canViewPregnancyDiagnosis,
    ]
  );

  const isLoading = checkLoadingStatus([acasalamentosList]);
  const items = acasalamentosList.data?.data?.items;
  const isEmpty = !isLoading && !acasalamentosList.isError && (items?.length ?? 0) === 0;

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
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        {/* Legenda de status abaixo do filtro, como no legado — mesmos
            tokens do dot da coluna 1 (contrato de tela §6.1). */}
        <HStack gap={4} mt={4}>
          <HStack gap={2}>
            <Box
              boxSize="2"
              borderRadius="full"
              backgroundColor={BREEDING_MATING_STATUS_META[1].badgeToken}
            />
            <Text fontSize="sm" color="fg.muted">
              {text.list.statusLegend.inProgress}
            </Text>
          </HStack>
          <HStack gap={2}>
            <Box
              boxSize="2"
              borderRadius="full"
              backgroundColor={BREEDING_MATING_STATUS_META[2].badgeToken}
            />
            <Text fontSize="sm" color="fg.muted">
              {text.list.statusLegend.finished}
            </Text>
          </HStack>
        </HStack>

        <Box mt={4}>
          <Table
            isLoading={isLoading}
            isError={acasalamentosList.isError}
            error={acasalamentosList.error}
            isEmpty={isEmpty}
            onRetry={() => acasalamentosList.refetch()}
            isRetrying={acasalamentosList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiHeart as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${ACASALAMENTO_LIST_ROUTE}/novo`)}
          />
        </Box>
      </TableProvider>

      <FilterSideAcasalamento
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* `Finalizar` — `tone="warning"` (regra 8 da Tarefa). `title` já traz
          a pergunta completa; `description` é o texto do dicionário
          (`finishDialog.description`) e `warningText=""` suprime a 2ª linha
          padrão do componente para não duplicar a mesma frase. */}
      <DeleteConfirmDialog
        isOpen={isOpenFinishDialog}
        onClose={() => {
          onCloseFinishDialog();
          setToFinish(null);
        }}
        onConfirm={handleConfirmFinish}
        isLoading={isFinishing}
        title={text.list.finishDialog.title}
        description={text.list.finishDialog.description}
        itemName={toFinish?.code}
        warningText=""
        tone="warning"
      />

      {/* `Excluir` — padrão destrutivo vigente (`EstacaoDeMonta`/`LoteReproducao`). */}
      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteDialog.title}
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
