// src/pages/CadastrosBase/CausaMortePerda/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL, SEM
// filtro, COM ações Editar/Excluir) de CAUSA MORTE/PERDA (DeathLoss) —
// Cadastros Base / Pecuários.
// Rota: /cadastros-base/causa-morte-perda (guardada por `death_loss_view`,
// registrada em TASK-FE-052 — este arquivo não mexe em rota/menu).
//
// Fidelidade ao legado (Doc Bruta §4: `index()` do Blade "sem filtro/busca
// algum"): estrutura é a INTERSEÇÃO de `Estados/index.tsx` (paginação REAL,
// ZERO FilterSide) + `Racas/index.tsx` (coluna Espécie, Badge de status,
// delete com aviso de exclusão definitiva). Coluna extra `cause` (Badge com 2
// cores fixas e neutras — mirror `do_movement` de `MotivosBaixa/index.tsx`).
//
// Sem flags `can_edit`/`can_delete` por item no `DeathLossResource` —
// autorização das ações de linha é 100% por permissão GLOBAL
// (`death_loss_edit`/`death_loss_delete`), mesmo padrão de `Racas`.
//
// Exclusão DEFINITIVA (`DeathLoss` não usa SoftDeletes) — o
// `DeleteConfirmDialog` recebe `warningText` explícito.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ElementType } from 'react';
import { FiAlertTriangle, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteDeathLoss } from '@/services/v2/DeathLosses/death-loss-service';

import type { DeathLossListItem } from '@/@types/v2/DeathLosses';

import { HeaderTable } from './HeaderTable';
import { useDeathLossesList } from './useDeathLosses';

export default function CausaMortePerdaList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.deathLosses.deathLoss;

  const canCreate = can('death_loss_create');
  const canEdit = can('death_loss_edit');
  const canDelete = can('death_loss_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseCausaMortePerda' + queryKey.deathLosses.list,
    }),
    []
  );

  // pageSize 10 = paginação REAL — per_page dinâmico, enviado ao back
  // conforme o pageSize escolhido no grid (5/10/25/50/100). SEM filtro —
  // decisão de fidelidade ao legado, não-negociável (Doc Bruta §4).
  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<DeathLossListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deathLossesList = useDeathLossesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ deathLossUuid }: { deathLossUuid: string }) => {
      return await deleteDeathLoss(deathLossUuid);
    },
    queryKey: queryKey.deathLosses.list,
    queryKey2: queryKey.deathLosses.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por Breed/LowReason/IdentificationType para a
    // mesma operação. O texto exibido vem de `personalizedMessage`.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). O 422 estruturado por
    // BusinessRuleException (FK death_animals.cause_id, contrato §6) já traz
    // `message` clara — mesmo tratamento de Breed/LowReason/IdentificationType.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (deathLoss: DeathLossListItem) => {
    setToDelete(deathLoss);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ deathLossUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<DeathLossListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('cause', {
        header: text.list.table.cause,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.cause === 'M' ? 'gray' : 'orange'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.cause === 'M'
              ? text.form.fields.causeOptions.death
              : text.form.fields.causeOptions.loss}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor((row) => row.specie?.description ?? '', {
        id: 'specie',
        header: text.list.table.specie,
        cell: ({ row }) =>
          row.original.specie ? (
            <Text fontSize="sm" color="fg.muted" lineClamp="1">
              {row.original.specie.description}
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ),
        meta: styleColumTable.md,
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
                  onClick={() => navigate(`/cadastros-base/causa-morte-perda/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([deathLossesList]);
  const isError = deathLossesList.isError;
  const items = deathLossesList.data?.data?.items ?? [];
  const isEmpty = !isLoading && !isError && items.length === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid header={<HeaderTable languageGB={languageGB} />}>
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
            isError={isError}
            error={deathLossesList.error}
            isEmpty={isEmpty}
            onRetry={() => deathLossesList.refetch()}
            isRetrying={deathLossesList.isFetching}
            emptyIcon={FiAlertTriangle as ElementType}
            emptyTitle={
              canCreate ? text.list.emptyState.titleEmpty : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              canCreate
                ? text.list.emptyState.descriptionEmpty
                : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/causa-morte-perda/novo')}
          />
        </Box>
      </TableProvider>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteConfirm.title}
        itemName={toDelete?.description}
        warningText={text.list.deleteConfirm.warning}
      />
    </ContainerGrid>
  );
}
