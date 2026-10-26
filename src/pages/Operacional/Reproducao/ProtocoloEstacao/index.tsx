// src/pages/Operacional/Reproducao/ProtocoloEstacao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PROTOCOLOS/ESTAÇÃO — Operacional / Reprodução
// (F-057, execução 040, TASK-FE-1053). Item de menu novo, `ope-pec-rep-pse`,
// registrado na TASK-FE-1052.
//
// Rota: /operacional/protocolos-estacao (guardada por `protocols-season_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura mirror DIRETO de `LoteReproducao/index.tsx` (mesmo submódulo,
// mesmo padrão de grid/filtro/exclusão): `useCustomGridQuery` SEM ID de
// contexto + `FilterSideProtocolSeason` com re-hidratação + `useRequest` para
// exclusão.
//
// `onError` da exclusão NÃO customizado — usa o tratamento genérico interno
// do `useRequest` (mirror `LoteReproducaoList`, mesmo racional: o `message`
// do backend para o 409 de `ProtocolSeasonInUseException` JÁ é a mensagem de
// negócio específica — "Não é possível excluir: existem acasalamentos
// vinculados a este protocolo." — não um fallback genérico fabricado aqui).
//
// Colunas (contrato §4.1, LST-002..007): code/name/date/responsável
// (`employee?.name ?? user.name`)/estação de monta/ações. Ação Editar visível
// só quando `matings_count < 1` (ACT-007, já vem no `ProtocolSeasonData`, sem
// chamada extra). Sem botão "Saiba mais" (`NAO_APLICAVEL`, contrato §7.3).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiClipboard, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteProtocolSeason,
  listProtocolSeasons,
} from '@/services/v2/Operacional/Reproducao/protocolSeason-service';

import type {
  ProtocolSeasonData,
  ProtocolSeasonFilterForm,
  ProtocolSeasonFilterRequest,
} from '@/@types/v2/Operacional/Reproducao/protocolSeason';

import { FilterSideProtocolSeason } from './FilterSideProtocolSeason';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

const PROTOCOL_SEASON_STORAGE_KEY =
  'OperacionalReproducaoProtocoloEstacao' + queryKey.protocolSeasons.protocolSeasonsList;
const PROTOCOL_SEASON_LIST_ROUTE = '/operacional/protocolos-estacao';

export default function ProtocolSeasonsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.protocolSeasons.protocolSeason;

  const canView = can('protocols-season_view');
  const canEdit = can('protocols-season_edit');
  const canCreate = can('protocols-season_create');
  const canDelete = can('protocols-season_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: PROTOCOL_SEASON_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ProtocolSeasonFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const protocolSeasonsList = useCustomGridQuery<ProtocolSeasonData, ProtocolSeasonFilterRequest>({
    asyncFunction: listProtocolSeasons,
    queryKey: queryKey.protocolSeasons.protocolSeasonsList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    // Converte o form shape do drawer (selects guardam Option) para os params
    // crus do service (mirror `FeedlotSectors/index.tsx`).
    filter: {
      name: paginatedQuery.filter?.name || undefined,
      user_uuid: paginatedQuery.filter?.user_uuid?.value,
      breeding_season_uuid: paginatedQuery.filter?.breeding_season_uuid?.value,
      start_date: paginatedQuery.filter?.start_date || undefined,
      end_date: paginatedQuery.filter?.end_date || undefined,
    },
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<ProtocolSeasonData | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => {
      return await deleteProtocolSeason(uuid);
    },
    queryKey: queryKey.protocolSeasons.protocolSeasonsList,
    queryKey2: queryKey.protocolSeasons.protocolSeason,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: ProtocolSeasonData) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ uuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<ProtocolSeasonData>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.name}
          </Text>
        ),
        meta: styleColumTable.md,
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
      columnHelper.display({
        id: 'responsible',
        header: text.list.table.responsible,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.employee?.name ?? row.original.user?.name ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'breedingSeason',
        header: text.list.table.breedingSeason,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.breeding_season?.description ?? '—'}
          </Text>
        ),
        meta: styleColumTable.lg,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`${PROTOCOL_SEASON_LIST_ROUTE}/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {/* Editar visível só quando `matings_count < 1` (ACT-007,
                  mirror EXATO do legado) — sem chamada extra de rede, o
                  contador já vem no `ProtocolSeasonResource`. */}
              {canEdit && row.original.matings_count < 1 && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`${PROTOCOL_SEASON_LIST_ROUTE}/${row.original.uuid}/editar`)
                  }
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  tone="danger"
                  disabled={isDeleting}
                >
                  {text.list.actions.delete}
                </Actions.Item>
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
    [navigate, isDeleting, text, canView, canEdit, canDelete, languageGB.defaltStrings.actions]
  );

  const isLoading = checkLoadingStatus([protocolSeasonsList]);
  const items = protocolSeasonsList.data?.data?.items;
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
            isError={protocolSeasonsList.isError}
            error={protocolSeasonsList.error}
            isEmpty={isEmpty}
            onRetry={() => protocolSeasonsList.refetch()}
            isRetrying={protocolSeasonsList.isFetching}
            emptyIcon={FiClipboard as ElementType}
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
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${PROTOCOL_SEASON_LIST_ROUTE}/nova`)}
          />
        </Box>
      </TableProvider>

      <FilterSideProtocolSeason
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
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
