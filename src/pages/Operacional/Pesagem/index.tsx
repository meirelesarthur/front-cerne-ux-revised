// src/pages/Operacional/Pesagem/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PESAGEM — Operacional > Pecuária > Manejo
// (F-071, TASK-PES-FE-02, `pes-screen-list`/`pes-list-table`/`pes-filter-form`).
//
// Rota: /operacional/pesagem (guardada por `weighing_view`, registrada só na
// Tarefa 41 — este arquivo NÃO toca `src/router/index.tsx`).
//
// Casca de GRID de verdade — `ContainerGrid` + `TableProvider` + `HeaderGrid`
// + `Table`, mirror `Weaning/index.tsx`/`Sanitario/index.tsx` (UX-GAP já
// decidido pelo dono — seguir-pelo-padrão, contrato-tela §10).
//
// Colunas — `GAP-FE-PES-01` FECHADO nesta Tarefa: o default proposto
// (Código/Data/Lote-Categoria/Qtd.Animais/Peso Médio/Ganho Médio/GMD/Ações,
// 8 colunas) foi CONFIRMADO contra o código real de `WeighingListResource`
// (leitura direta do worktree da API,
// `app/Http/Resources/V1/WeighingListResource.php` +
// `WeighingRepository::listWithFilters()`) e DIVERGE — o Resource devolve
// SOMENTE `uuid`/`code`/`date`/`is_stock`/`arroba_value`/`batch`/`category`/
// `animals_count`/`average_weight`/`created_at` (SEM `average_gain`/`gmd`,
// que exigiriam `last_weight`/`last_weight_date` por animal, disponíveis só
// no DETALHE, `EP-PES-02`). Colunas fechadas (6, não 8): Código · Data ·
// Lote/Categoria · Qtd. Animais · Peso Médio · Ações — ver Histórico da
// Tarefa 35 para a divergência completa. `src/@types/v2/Weighing/index.d.ts`
// (`WeighingListItem`) foi corrigido para o shape real nesta mesma Tarefa.
//
// Ordenação fixa `code desc` (API não expõe `sort`, mirror `WeighingRepository`)
// — `enableSorting: false` em toda coluna de dado, sem controle clicável.
//
// Exclusão (`EP-PES-05`) — `DELETE /weighings/{uuid}` responde
// `204 No Content` (`ApiResponse::noContent()`, confirmado por leitura direta
// do Controller), SEM envelope/`message` — o toast de sucesso usa o texto
// ESTÁTICO do dicionário (`text.list.deletedToast`), mirror
// `Sanitario/index.tsx`/`Weaning/index.tsx` (mesma decisão, mesmo achado).
//
// Relatório Individual (`EP-PES-08`, `GET /weighings/{uuid}/report`) — mirror
// `Marcacao/index.tsx`/`VendaAnimais/index.tsx` (`handleDownloadReport`
// async + `downloadingReportUuid` local, NÃO `useMutation` — a redação da
// Tarefa cita "useMutation+downloadBlob" mas o precedente REAL de
// `MarkingActionsMenu.onPrint` que a própria Tarefa manda espelhar usa
// handler local + `useState`, não `useMutation`; seguido o código real, não
// a paráfrase, mesma prioridade de fidelidade já usada em outras Tarefas).
// SEM navegação, SEM tela própria (contrato-tela §1.1/§6.2).
//
// Sem Zustand — fazenda ativa já vem do `AuthContext`; paginação/filtro por
// `userPaginatedQuery`, `storageKey` = `titleModule + queryKey + activeFarmUuid`
// (regra da Tarefa, mirror `Sanitario/index.tsx`).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText } from 'react-icons/fi';
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
import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';
import transformNumberToStringKg from '@/utils/transformNumberToStringKg';

import { queryKey } from '@/constants/query-key';

import { deleteWeighing, downloadWeighingReport } from '@/services/v2/Weighing/weighing-service';

import type { WeighingFilterForm, WeighingListItem } from '@/@types/v2/Weighing';

import { FilterSidePesagem } from './FilterSidePesagem';
import { HeaderTable } from './HeaderTable';
import { useWeighingsList } from './useWeighings';
import { WeighingActionsMenu } from './WeighingActionsMenu';

import { PageHeader } from '@/components/ui/PageHeader';

const PESAGEM_LIST_ROUTE = '/operacional/pesagem';

export default function PesagemList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const queryClient = useQueryClient();
  const text = languageGB.weighing.weighing;

  const canView = can('weighing_view');
  const canEdit = can('weighing_edit');
  const canDelete = can('weighing_delete');

  // storageKey = titleModule + queryKey + fazenda ativa — nunca prefixar
  // `storageKeyGB`, o hook já faz (mirror Sanitario/index.tsx).
  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: text.titleModule + queryKey.weighing.weighings + (activeFarmUuid ?? ''),
    }),
    [text.titleModule, activeFarmUuid]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<WeighingFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `_label` é companion DISPLAY-ONLY de re-hidratação do `SelectAsyncPaginate`
  // — nunca conta como filtro aplicado (mesma regra de `Sanitario`/`Weaning`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const weighingsList = useWeighingsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<WeighingListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteWeighing(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.weighing.weighings] });

      // `DELETE EP-PES-05` responde 204 sem envelope (ver nota de cabeçalho)
      // — toast usa o texto ESTÁTICO do dicionário, nunca `response.message`.
      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
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

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: WeighingListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) deleteMutation.mutate(toDelete.uuid);
  }

  // ---- Relatório individual (síncrono, blob — mirror `Marcacao`/`VendaAnimais`) ----
  // AJUSTE DE UX (AF_REJECTED execução 017, item 2/3 — dono suspeitou de
  // bloqueio de pop-up; investigação confirmou que `downloadBlob()` usa
  // `<a download>`+`.click()`, mecanismo que NÃO é bloqueado por
  // bloqueador de pop-up — `window.open` nunca é chamado aqui. O arquivo já
  // era baixado silenciosamente; faltava só a confirmação visual — toast de
  // sucesso adicionado após o `downloadBlob` resolver, mirror
  // `VacasPrenhas/index.tsx` `toaster.success({ title, description })`).
  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);

  async function handleDownloadReport(item: WeighingListItem) {
    setDownloadingReportUuid(item.uuid);
    try {
      const blob = await downloadWeighingReport(item.uuid);
      downloadBlob(blob, `pesagem-${item.code ?? item.uuid}.pdf`);
      toaster.success({
        title: text.singularLabel,
        description: text.list.reportDownloadedToast,
      });
    } catch {
      toaster.error({
        title: text.singularLabel,
        description: languageGB.common.errorLog.unknownError,
      });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  const columnHelper = createColumnHelper<WeighingListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.date)}</Text>,
        enableSorting: false,
        meta: styleColumTable.date,
      }),
      // Coluna "Movimentação ABC Corte" (`is_stock`) — correção AD_REJECTED
      // (UT-000109): campo já existente no Resource/`WeighingListItem`
      // (`is_stock`), só faltava a coluna na grid migrada (ver nota de
      // `languageWeighing.ts`). Sim/Não mirror do render legado
      // (`weighings/index.blade.php`, `$item->is_stock ? 'Sim' : 'Não'`).
      columnHelper.accessor('is_stock', {
        header: text.list.table.isStock,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.is_stock ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no}
          </Text>
        ),
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'batchOrCategory',
        header: text.list.table.batchOrCategory,
        cell: ({ row }) => (
          <Text lineClamp="1">
            {row.original.batch?.name ?? row.original.category?.name ?? '-'}
          </Text>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('animals_count', {
        header: text.list.table.animalsCount,
        cell: ({ row }) => <Text fontSize="sm">{row.original.animals_count}</Text>,
        enableSorting: false,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('average_weight', {
        header: text.list.table.averageWeight,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.average_weight != null
              ? transformNumberToStringKg(row.original.average_weight)
              : '-'}
          </Text>
        ),
        enableSorting: false,
        meta: styleColumTable.md,
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
              <WeighingActionsMenu
                canView={canView}
                canEdit={canEdit}
                canDelete={canDelete}
                isDeleting={isDeleting}
                isDownloadingReport={downloadingReportUuid === item.uuid}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  report: text.list.actions.report,
                  delete: text.list.actions.delete,
                }}
                onView={() => navigate(`${PESAGEM_LIST_ROUTE}/${item.uuid}`)}
                onEdit={() => navigate(`${PESAGEM_LIST_ROUTE}/${item.uuid}/editar`)}
                onPrint={() => handleDownloadReport(item)}
                onDelete={() => handleDeleteClick(item)}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, downloadingReportUuid, text, canView, canEdit, canDelete, languageGB]
  );

  const isLoading = checkLoadingStatus([weighingsList]);
  const items = weighingsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

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
            isError={weighingsList.isError}
            error={weighingsList.error}
            isEmpty={isEmpty}
            onRetry={() => weighingsList.refetch()}
            isRetrying={weighingsList.isFetching}
            retryLabel={text.list.error.retry}
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

      <FilterSidePesagem
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
        title={text.list.deleteDialog.title}
        description={
          toDelete
            ? text.list.deleteDialog.descriptionTemplate.replace('{code}', String(toDelete.code))
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
