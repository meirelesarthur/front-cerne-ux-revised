// src/pages/Administrativo/Eventos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de EVENTOS — Administrativo / Gestão Pessoal
// (menu já existente, `adm-gp-eve`).
//
// Rota: /administrativo/eventos (guardada por `events_view`, registrada em
// src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura idêntica a Administrativo/Funcoes/index.tsx (grid flat REAL de
// servidor, paginação real):
//   - grid paginado (TableProvider + Table) via useEventosList;
//   - HeaderTable    → botões de ação (Add respeita events_create);
//   - FilterSideEventos → drawer (search/is_enabled/período de cadastro), COM
//     re-hidratação ao reabrir (prop `filter`, Contrato B canônico);
//   - delete via `useMutation` DEDICADO (mesma razão documentada em
//     `Funcoes/index.tsx`/`ParameterWeights/index.tsx` — o `onError` genérico
//     do `useRequest` só lê `message`, nunca `errors`, o que esconderia
//     `errors.in_use`): no sucesso invalida a listagem + toast; no erro, se
//     for 422 com `errors.in_use` populado (mapa `{tabela: count}`, contrato
//     de API §6, agora com 5 chaves — o maior fan-in do projeto), fecha
//     `DeleteConfirmDialog` e abre `InUseBlockedDialog` (genérico) com a lista traduzida;
//     qualquer outro erro cai no toast genérico.
//
// Colunas de enum (`type`/`method`/`condition`): `EventResource` já expõe
// `type_label`/`method_label`/`condition_label` prontos (confirmado por
// leitura direta do api_root) — consumidos DIRETO pela Badge, mirror
// `CostCenterListItem.class_label`, sem depender das fábricas de opções
// locais (que servem só o `Select` do formulário, TASK-FE-EVT-02).
//
// Permissões: ações de linha usam permissão GLOBAL (`events_edit`/
// `events_delete`), mesmo padrão de Funcoes/ParameterWeights (o Resource não
// expõe flag por item).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { FiCalendar, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { InUseBlockedDialog, type InUseBlockedItem } from '@/components/InUseBlockedDialog';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiFieldErrorMessage, extractInUseItems } from '@/utils/extractApiErrorMessage';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import { eventInUseTableLabels } from '@/constants/GestaoPessoal/Event/options/event-in-use-table-labels';

import { deleteEvent } from '@/services/v2/Events/event-service';

import type { EventFilterForm, EventListItem } from '@/@types/v2/Events';

import { FilterSideEventos } from './FilterSideEventos';
import { HeaderTable } from './HeaderTable';
import { useEventosList } from './useEventos';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

export default function EventosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.events.event;

  const canCreate = can('events_create');
  const canEdit = can('events_edit');
  const canDelete = can('events_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 15,
      storageKey: 'AdministrativoEventos' + queryKey.events.eventsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<EventFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const eventosList = useEventosList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<EventListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use`, mapa
  // `{tabela: count}`, 5 chaves possíveis — contrato de API §6). Itens
  // normalizados por `extractInUseItems` (canário FRONT-03-InUseBlockedDialog.md).
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  // ⚠️ NÃO usa `useRequest` aqui — mesma razão documentada em
  // `Funcoes/index.tsx`/`ParameterWeights/index.tsx`: o `onError` genérico só
  // lê `message`, nunca `errors`, o que esconderia `errors.in_use`.
  const deleteMutation = useMutation({
    mutationFn: async (eventUuid: string) => await deleteEvent(eventUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.events.eventsList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('Event delete - error:', error);

      const inUseItems = extractInUseItems(error);
      if (inUseItems) {
        onCloseDeleteDialog();
        setBlockedInUse(inUseItems);
        onOpenBlockedDialog();
        return;
      }

      // Fallback: qualquer erro que NÃO seja o 422 estruturado de bloqueio
      // (403, 500, 422 residual sem `in_use` populado).
      let errorMessage = languageGB.common.errorLog.unknownError;
      if (isAxiosError(error)) {
        const statusCode = error.response?.status ?? null;
        const resData = error.response?.data as any;
        if (resData?.message) {
          const msg =
            extractApiFieldErrorMessage(error) ??
            (typeof resData.message === 'string'
              ? resData.message
              : JSON.stringify(resData.message));
          errorMessage = `${statusCode} — ${msg}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  const handleDeleteClick = (item: EventListItem) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  };

  const handleCloseBlockedDialog = () => {
    onCloseBlockedDialog();
    setBlockedInUse(null);
    setToDelete(null);
  };

  const columnHelper = createColumnHelper<EventListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette="blue" variant="subtle">
            {row.original.type_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('method_label', {
        header: text.list.table.method,
        cell: ({ row }) => (
          <Badge colorPalette="purple" variant="subtle">
            {row.original.method_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('condition_label', {
        header: text.list.table.condition,
        cell: ({ row }) => (
          // Soma (1) soma valor à folha — verde; Diminui (0) subtrai —
          // laranja (cor decisão visual livre, contrato de tela §2,
          // ajustável quando o dono enviar imagem do legado).
          <Badge colorPalette={row.original.condition === 1 ? 'green' : 'orange'} variant="subtle">
            {row.original.condition_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/administrativo/eventos/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {text.list.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([eventosList]);
  const items = eventosList.data?.data?.items;
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

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          <Table
            isLoading={isLoading}
            isError={eventosList.isError}
            error={eventosList.error}
            isEmpty={isEmpty}
            onRetry={() => eventosList.refetch()}
            isRetrying={eventosList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiCalendar as ElementType}
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
            onCreate={() => navigate('/administrativo/eventos/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideEventos
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
        itemName={toDelete?.name}
      />

      <InUseBlockedDialog
        isOpen={isOpenBlockedDialog}
        onClose={handleCloseBlockedDialog}
        title={text.deleteBlocked.title}
        description={text.deleteBlocked.description}
        itemName={toDelete?.name}
        items={blockedInUse}
        closeLabel={languageGB.defaltStrings.close}
        resourceLabelTemplate={text.deleteBlocked.resourceLabel}
        getResourceLabel={(table) => eventInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
