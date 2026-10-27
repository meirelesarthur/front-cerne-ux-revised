// src/pages/Administrativo/Equipes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de EQUIPES — Administrativo / Gestão Pessoal
// (menu já existente, `adm-gp-equ`).
//
// Rota: /administrativo/equipes (guardada por `teams_view`, registrada em
// src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Referência UX (GAP-EQ-FE-02 — UX-GAP, tela ausente no design system
// `cerne`, derivada por composição canônica + análogo estrutural):
//   GB.Cerne.UX @ 24bd91603a6ee4e19b58fa5efe2221835c83e306
//   Análogo estrutural: src/pages/cadastros/estoques-iniciais/EstoquesIniciaisLista.tsx
//   Molde de código na SPA (sibling-first): src/pages/Administrativo/Funcoes/index.tsx
//
// Estrutura idêntica a Administrativo/Funcoes/index.tsx (grid paginado real
// de servidor):
//   - grid paginado (TableProvider + Table) via useTeamsList;
//   - HeaderTable    → Adicionar (teams_create) + Relatório PDF (teams_view,
//     GAP-EQ-FE-07) + ButtonFilter;
//   - FilterSideEquipes → drawer (search/is_enabled), COM re-hidratação ao
//     reabrir (prop `filter`, Contrato B canônico);
//   - delete via `useMutation` DEDICADO — a exclusão de Equipes NÃO falha
//     mais por vínculo (soft delete, `GAP-EQ-02` no backend), mas mantém o
//     caminho de erro genérico (front-contract-equipes.md §4.5).
//
// Sem Zustand (GAP-EQ-FE-10) — fazenda ativa já vem do AuthContext via
// interceptor; paginação/filtro por `userPaginatedQuery`.
//
// 6 colunas (front-contract-equipes.md §4.2, GAP-EQ-FE-06): Nome · Descrição
// · Encarregado · Status · Dt. Criação · Ações. SEM coluna `sortable` — a
// ordenação é fixa `description asc`, imposta pelo servidor (a API não
// expõe parâmetro de ordenação).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiTrash2, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
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

import { deleteTeam } from '@/services/v2/Teams/team-service';

import type { TeamFilterForm, TeamListItem } from '@/@types/v2/Teams';

import { FilterSideEquipes } from './FilterSideEquipes';
import { HeaderTable } from './HeaderTable';
import { useTeamsList } from './useEquipes';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

export default function EquipesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.workTeams.workTeam;

  const canCreate = can('teams_create');
  const canView = can('teams_view');
  const canEdit = can('teams_edit');
  const canDelete = can('teams_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'AdministrativoEquipes' + queryKey.workTeams.workTeamsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<TeamFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const teamsList = useTeamsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<TeamListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Servidor faz soft delete e não bloqueia mais por vínculo (GAP-EQ-02) —
  // mantém apenas o caminho de erro genérico (front-contract-equipes.md
  // §4.5), sem o diálogo especial de "bloqueado por vínculo" de Funcoes.
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteTeam(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.workTeams.workTeamsList] });

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

  const handleDeleteClick = (item: TeamListItem) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  };

  const columnHelper = createColumnHelper<TeamListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.description || text.list.table.supervisorEmpty}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'supervisor',
        header: text.list.table.supervisor,
        cell: ({ row }) => {
          const supervisor = row.original.supervisor;
          if (!supervisor) {
            return <Text color="fg.muted">{text.list.table.supervisorEmpty}</Text>;
          }
          return (
            <Text lineClamp="1">
              {supervisor.name}
              {supervisor.nif ? ` - ${supervisor.nif}` : ''}
            </Text>
          );
        },
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled
              ? text.list.table.statusActive
              : text.list.table.statusInactive}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.createdAt,
        cell: ({ row }) => <Text lineClamp="1">{formatDate(row.original.created_at)}</Text>,
        meta: styleColumTable.date,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {/* GAP-EQ-FE-11 — decisão de produto do dono: "Visualizar"
                  passa a ser SEMPRE exibida para quem tem `teams_view`,
                  independente de também ter `teams_edit` (abandona a dedup
                  da TASK-EQ-FE-03/armadilha #7). Aponta para a rota própria
                  `/detalhe`, que força somente-leitura mesmo para quem edita
                  — "Editar" continua levando ao formulário editável em
                  `/:teamUuid`, sem duplicar comportamento. */}
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/administrativo/equipes/${row.original.uuid}/detalhe`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/administrativo/equipes/${row.original.uuid}`)}
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
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canView, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([teamsList]);
  const items = teamsList.data?.data?.items;
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
            isError={teamsList.isError}
            error={teamsList.error}
            isEmpty={isEmpty}
            onRetry={() => teamsList.refetch()}
            isRetrying={teamsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiUsers as ElementType}
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
            onCreate={() => navigate('/administrativo/equipes/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideEquipes
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
        title={text.deleteDialog.title}
        description={
          toDelete
            ? text.deleteDialog.descriptionTemplate.replace('{name}', toDelete.name)
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
