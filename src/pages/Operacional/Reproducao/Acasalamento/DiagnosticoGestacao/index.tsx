// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de DIAGNÓSTICO DE GESTAÇÃO — sub-árvore ANINHADA de
// Acasalamento (PregnancyDiagnosis, F-016, 97-Esteiras/001, TASK-BM-FE-07).
//
// Rota `/operacional/acasalamento/:breedingMatingUuid/diagnostico-gestacao`
// (guardada por `pregnancy-diagnosis_view`, wiring de rota é da Tarefa 09 —
// este arquivo só declara o nome do param esperado). SEM item de menu próprio
// e SEM rota de nível superior (decisão do dono `OWN-DEC-001`, regra 1 da
// Tarefa) — só alcançável pelo menu de ações do Acasalamento pai.
//
// `breedingMatingUuid` é resolvido AQUI via `useParams` e passado por PROP a
// todos os filhos (regra 4 da Tarefa, Regra 2 do Modelo C) — nenhum
// sub-componente busca o pai sozinho.
//
// Casca de GRID de verdade — `ContainerGrid` + `TableProvider` + `HeaderGrid`
// + `Table`, mirror `Acasalamento/index.tsx` (regra 2 da Tarefa). 5 colunas
// na ordem exata do legado (regra 3): Código · Data · Responsável ·
// Previsão Parto · Ações. `birth_forecast_display` é formatado
// (`formatDate` → dd/MM/yyyy) mas NUNCA recalculado a partir da data-base —
// vem pronto do servidor (contrato de tela §5.4/regra 3).
//
// `storageKey` inclui `breedingMatingUuid` (regra 5) — senão a paginação
// vazaria entre Acasalamentos diferentes.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deletePregnancyDiagnosis } from '@/services/v2/BreedingMating/pregnancy-diagnosis-service';

import type {
  PregnancyDiagnosisFilterRequest,
  PregnancyDiagnosisListItem,
} from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

import { DiagnosticoGestacaoActionsMenu } from './DiagnosticoGestacaoActionsMenu';
import { FilterSideDiagnosticoGestacao } from './FilterSideDiagnosticoGestacao';
import { HeaderTable } from './HeaderTable';
import { useDiagnosticosGestacaoList } from './useDiagnosticosGestacao';

export default function DiagnosticoGestacaoList() {
  // `breedingMatingUuid` resolvido UMA VEZ aqui — regra 4/Regra 2 do Modelo C.
  const { breedingMatingUuid } = useParams<{ breedingMatingUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.breedingMatings.pregnancyDiagnosis;

  const canView = can('pregnancy-diagnosis_view');
  const canDelete = can('pregnancy-diagnosis_delete');

  const PD_LIST_ROUTE = `/operacional/acasalamento/${breedingMatingUuid}/diagnostico-gestacao`;

  // storageKey (regra 5 da Tarefa) = pluralLabel + queryKey + breedingMatingUuid
  // — nunca prefixar `storageKeyGB`, o hook já faz.
  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 15,
      storageKey:
        text.pluralLabel +
        queryKey.breedingMatings.pregnancyDiagnosesList +
        (breedingMatingUuid ?? ''),
    }),
    [text.pluralLabel, breedingMatingUuid]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<PregnancyDiagnosisFilterRequest>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const diagnosticosGestacaoList = useDiagnosticosGestacaoList({
    breedingMatingUuid,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<PregnancyDiagnosisListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // `useMutation` direto (não `useRequest`) — o toast de sucesso/erro usa a
  // `message` do PRÓPRIO envelope (regra 8 da Tarefa), nunca duplicada no
  // dicionário. Ao excluir, invalida as DUAS queries (regra 9): a do próprio
  // DG e a da listagem de Acasalamento (o Acasalamento de ressincronização
  // vinculado é removido pelo servidor e precisa desaparecer sem reload).
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deletePregnancyDiagnosis(breedingMatingUuid!, uuid),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.breedingMatings.pregnancyDiagnosesList, breedingMatingUuid],
      });
      queryClient.invalidateQueries({ queryKey: [queryKey.breedingMatings.breedingMatingsList] });

      toaster.success({
        title: text.singularLabel,
        description: response?.message ?? text.singularLabel,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      // 422 (não é o último diagnóstico) — exibe a `message` do envelope,
      // nunca duplicada no dicionário (regra 8 da Tarefa).
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: PregnancyDiagnosisListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) deleteMutation.mutate(toDelete.uuid);
  }

  const columnHelper = createColumnHelper<PregnancyDiagnosisListItem>();
  const defaultColumns = useMemo(
    () => [
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
      // `birth_forecast_display` — SEMPRE formatado a partir do valor já
      // calculado no SERVIDOR. Proibido recalcular a data-base aqui
      // (regra 3 da Tarefa).
      columnHelper.accessor('birth_forecast_display', {
        header: text.list.table.birthForecast,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.birth_forecast_display)}
          </Text>
        ),
        meta: styleColumTable.date,
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
              <DiagnosticoGestacaoActionsMenu
                item={item}
                canView={canView}
                canDelete={canDelete}
                isDeleting={isDeleting}
                labels={{
                  view: text.list.actions.view,
                  delete: text.list.actions.delete,
                }}
                onView={() => navigate(`${PD_LIST_ROUTE}/${item.uuid}`)}
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
    [navigate, isDeleting, text, languageGB, canView, canDelete, PD_LIST_ROUTE]
  );

  const isLoading = checkLoadingStatus([diagnosticosGestacaoList]);
  const items = diagnosticosGestacaoList.data?.data?.items;
  const isEmpty = !isLoading && !diagnosticosGestacaoList.isError && (items?.length ?? 0) === 0;

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
              breedingMatingUuid={breedingMatingUuid ?? ''}
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
          </VStack>
        </HeaderGrid>

        <Box mt={4}>
          <Table
            isLoading={isLoading}
            isError={diagnosticosGestacaoList.isError}
            error={diagnosticosGestacaoList.error}
            isEmpty={isEmpty}
            onRetry={() => diagnosticosGestacaoList.refetch()}
            isRetrying={diagnosticosGestacaoList.isFetching}
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

      <FilterSideDiagnosticoGestacao
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      {/* `Excluir` — padrão destrutivo vigente (mirror `Acasalamento/index.tsx`). */}
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
