// src/pages/Fiscal/Cte/index.tsx
// -----------------------------------------------------------------------------
// Tela de listagem (grid) de CT-e (Cte — domínio Fiscal, execução 045, Onda
// 1, TASK-CTE-FE-02/06/07). Consome `GET /api/v1/ctes`
// (`CONTRATO-API-CTE-ONDA1.md §2`). Modelo A (`get_pwa_complex_screen_
// compositions_pattern`), mirror estrutural `Fiscal/Dfe/index.tsx` (mesmo
// domínio) simplificado (sem seleção em massa — CT-e não tem manifestação
// própria na Onda 1).
//
// Ações (TASK-CTE-FE-06/07): Editar (`cte_edit`), Excluir (`cte_delete`, só
// `estado` novo/rejeitado — paridade visual com o legado, `AC08`/`CL08`
// preservado — o servidor NÃO revalida estado), Relatório (`cte_view`,
// qualquer estado).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiFileText, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ClassificationBadge } from '@/components/ClassificationBadge';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { getCteEstadoSlot } from '@/constants/Fiscal/cte/cte-estado-classification';
import { cteEstadoOptions } from '@/constants/Fiscal/cte/options/cte-estado-options';
import { CTES_LIST_STORAGE_KEY } from '@/constants/Fiscal/cte/storage';
import { queryKey } from '@/constants/query-key';

import { deleteCte, getAllCtes, getCteReport } from '@/services/v2/Fiscal/cte-service';

import type { CteEstado, CteFilterForm, CteListItem } from '@/@types/v2/Fiscal/cte';

import { FilterSideCte } from './FilterSideCte';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusTag } from '@/components/ui/StatusTag';

// AC08/CL08 — visibilidade de UI (o servidor NÃO revalida `estado` no
// `destroy`, preservado por decisão já documentada no backend).
const DELETABLE_ESTADOS: CteEstado[] = ['novo', 'rejeitado'];

export default function CtesList() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const text = languageGB.ctes.cte;

  const canEdit = can('cte_edit');
  const canDelete = can('cte_delete');
  const canReport = can('cte_view');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: CTES_LIST_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CteFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const ctesList = useCustomGridQuery<CteListItem, CteFilterForm>({
    asyncFunction: getAllCtes,
    queryKey: queryKey.ctes.ctesList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as CteFilterForm),
  });

  const items = ctesList.data?.data?.items;

  // ---- Excluir (TASK-CTE-FE-06) --------------------------------------------
  const { open: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();
  const [toDelete, setToDelete] = useState<CteListItem | null>(null);

  const deleteMutation = useRequest({
    asyncFunction: (uuid: string) => deleteCte(uuid),
    entityName: text.singularLabel,
    queryKey: queryKey.ctes.ctesList,
    typesRequest: 'update',
    personalizedMessage: text.list.toast.deleteSuccess,
    actionSuccess: () => {
      onCloseDelete();
      setToDelete(null);
    },
  });

  function handleOpenDelete(row: CteListItem) {
    setToDelete(row);
    onOpenDelete();
  }

  function handleConfirmDelete() {
    if (toDelete) deleteMutation.mutateAsync(toDelete.uuid);
  }

  // ---- Relatório (TASK-CTE-FE-07) — blob + object URL, NUNCA window.open
  // cru (perderia X-Farm-Id, ver nota no service). ---------------------------
  const [generatingReportUuid, setGeneratingReportUuid] = useState<string | null>(null);

  async function handleOpenReport(row: CteListItem) {
    setGeneratingReportUuid(row.uuid);
    try {
      const blob = await getCteReport(row.uuid);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) || text.list.reportError,
      });
    } finally {
      setGeneratingReportUuid(null);
    }
  }

  // ---- Colunas (LS01-LS09) --------------------------------------------------
  const columnHelper = createColumnHelper<CteListItem>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('integration_status', {
        header: text.list.table.integrationStatus,
        cell: ({ row }) => (
          <StatusTag
            label={
              row.original.integration_status === 'E'
                ? languageGB.defaltStrings.integrationDone
                : languageGB.defaltStrings.integrationPending
            }
            color={row.original.integration_status === 'E' ? 'blue.500' : 'gray.500'}
          />
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.integrationStatus },
      }),
      columnHelper.accessor('remetente', {
        header: text.list.table.remetente,
        cell: ({ row }) => <Text lineClamp="1">{row.original.remetente ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.remetente },
      }),
      columnHelper.accessor('destinatario', {
        header: text.list.table.destinatario,
        cell: ({ row }) => <Text lineClamp="1">{row.original.destinatario ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.destinatario },
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.createdAt,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.created_at, 'dd/MM/yyyy HH:mm')}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.createdAt },
      }),
      columnHelper.accessor('valor_carga', {
        header: text.list.table.valorCarga,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCurrencyBRL(row.original.valor_carga)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.valorCarga },
      }),
      columnHelper.accessor('cte_numero', {
        header: text.list.table.cteNumero,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.cteNumero },
      }),
      columnHelper.accessor('estado', {
        header: text.list.table.estado,
        cell: ({ row }) => (
          <ClassificationBadge slot={getCteEstadoSlot(row.original.estado)}>
            {cteEstadoOptions.getLabel(row.original.estado, languageGB)}
          </ClassificationBadge>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.estado },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const isDeletable = DELETABLE_ESTADOS.includes(item.estado);

          return (
            <Flex justify="flex-end">
              <Actions languageGB={languageGB} tooltipLabel={languageGB.defaltStrings.actions}>
                {canEdit && (
                  <Actions.Item
                    icon={<Icon as={FiEdit} />}
                    onClick={() => navigate(`/fiscal/ctes/${item.uuid}`)}
                  >
                    {text.list.actionsMenu.edit}
                  </Actions.Item>
                )}
                {canReport && (
                  <Actions.Item
                    icon={<Icon as={FiFileText} />}
                    disabled={generatingReportUuid === item.uuid}
                    onClick={() => handleOpenReport(item)}
                  >
                    {text.list.actionsMenu.report}
                  </Actions.Item>
                )}
                {canDelete && isDeletable && (
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    tone="danger"
                    onClick={() => handleOpenDelete(item)}
                  >
                    {text.list.actionsMenu.delete}
                  </Actions.Item>
                )}
              </Actions>
            </Flex>
          );
        },
        meta: {
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [text, languageGB, canEdit, canDelete, canReport, generatingReportUuid]
  );

  const isLoading = checkLoadingStatus([ctesList]);
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={columns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
      >
        <HeaderGrid
          header={<HeaderTable onOpenFilter={onOpenFilter} filtersApplied={filtersApplied} />}
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          {isEmpty && !ctesList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiFileText} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.emptyState.title}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.emptyState.description}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={ctesList.isError}
              error={ctesList.error}
              onRetry={() => ctesList.refetch()}
              isRetrying={ctesList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideCte
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          onCloseDelete();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title={text.list.deleteDialog.title}
        confirmButtonText={text.list.deleteDialog.confirmButton}
      />
    </ContainerGrid>
  );
}
