// src/pages/Integracoes/Compartilhamento/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, sem painel de filtro) de
// COMPARTILHAMENTO (Sharing) — Integrações, F-122, 97-Esteiras/070,
// TASK-CP-FE-01. Rota `/integracoes/compartilhamento` (guardada por
// `sharings_view`, registrada em `src/router/index.tsx` — este arquivo não
// mexe em rota/menu).
//
// Molde: `src/pages/BaseRegistrations/TypeTitles/index.tsx` (grid flat V3
// real do projeto — `useCustomGridQuery` inline via `useSharingList`,
// paginação REAL server-side 10/página, `date desc` fixo — o backend não
// expõe ordenação alternativa, sem `OrdeByColumn` clicável). SEM
// `FilterSideCompartilhamento` — o legado não tem painel de filtro nesta
// feature (`FM-01 NONE_OBSERVED`), não inventado aqui.
//
// Coluna "Contratante" exibe SÓ o nome (`extractTenantNameFromLabel`,
// `tenant.label` vem pronto do backend como `"nif - name"`, pensado para o
// `SelectAsyncPaginate` do formulário — mirror `CL-029`/`LM-02`). Exclusão
// via `useRequest`(`typesRequest:'apply'`) + `DeleteConfirmDialog`, `onError`
// GENÉRICO (o backend já devolve a `message` real do 422 do FK-guard,
// `SURF-004` do contrato de API — sem tratamento especial de código).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiAlertTriangle, FiEdit, FiEye, FiShare2, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
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
import { extractTenantNameFromLabel } from '@/utils/extractTenantNameFromLabel';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteSharing } from '@/services/v2/Sharings/sharing-service';

import type { SharingListItem } from '@/@types/v2/Sharings';

import { HeaderTable } from './HeaderTable';
import { useSharingList } from './useSharings';

import { PageHeader } from '@/components/ui/PageHeader';

const SHARINGS_STORAGE_KEY = 'GBCerneIntegracoesCompartilhamento';

export default function CompartilhamentoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.sharings;

  const canEdit = can('sharings_edit');
  const canView = can('sharings_view');
  const canDelete = can('sharings_delete');
  const canCreate = can('sharings_create');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: SHARINGS_STORAGE_KEY + queryKey.sharings.list }),
    []
  );

  // Sem painel de filtro nesta feature (`FM-01 NONE_OBSERVED`) — só
  // `paginatedQuery`/`handlePaginatedQuery` são usados.
  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const sharingsList = useSharingList(paginatedQuery, handlePaginatedQuery);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<SharingListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ sharingUuid }: { sharingUuid: string }) => {
      return await deleteSharing(sharingUuid);
    },
    queryKey: queryKey.sharings.list,
    queryKey2: queryKey.sharings.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" no V3 — "apply" é
    // o substituto canônico de `useDeleted` (mirror
    // `get_pwa_mutation_query_pattern`). Texto exibido vem de
    // `personalizedMessage`. `onError` NÃO customizado — o backend já devolve
    // a `message` real do 422 estruturado (FK-guard, `SURF-004`).
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (sharing: SharingListItem) => {
    setToDelete(sharing);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ sharingUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<SharingListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: text.list.table.date,
        cell: ({ row }) => <Text fontWeight="medium">{formatDate(row.original.date)}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.date },
      }),
      // "Contratante" exibe SÓ o nome — nunca o `label` composto "nif - name"
      // (mirror `CL-029`/`LM-02`, ver `extractTenantNameFromLabel`).
      columnHelper.accessor((row) => extractTenantNameFromLabel(row.tenant.label), {
        id: 'tenant',
        header: text.list.table.tenant,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {extractTenantNameFromLabel(row.original.tenant.label)}
          </Text>
        ),
        meta: { gridLabel: text.list.table.tenant },
      }),
      columnHelper.accessor((row) => row.user.name, {
        id: 'user',
        header: text.list.table.user,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.user.name}
          </Text>
        ),
        meta: { gridLabel: text.list.table.user },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() =>
                    navigate(`/integracoes/compartilhamento/${row.original.uuid}/editar`)
                  }
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/integracoes/compartilhamento/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canEdit, canView, canDelete]
  );

  const isLoading = checkLoadingStatus([sharingsList]);
  const items = sharingsList.data?.data?.items;
  // `isEmpty` só é verdadeiro em SUCESSO com lista vazia — falha de query
  // (403/500/rede) NUNCA cai aqui (contrato de tela exige os 4 estados:
  // loading/empty/error/success, sem mascarar erro real como "vazio").
  const isEmpty = !isLoading && !sharingsList.isError && (items?.length ?? 0) === 0;
  const isErrorState = !isLoading && sharingsList.isError;

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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          {isErrorState ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.error.message}</EmptyState.Title>
                </VStack>
                <Button title={text.list.error.retry} onClick={() => sharingsList.refetch()} />
              </EmptyState.Content>
            </EmptyState.Root>
          ) : isEmpty ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiShare2} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.emptyState.title}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.emptyState.description}
                  </EmptyState.Description>
                </VStack>
                {canCreate && (
                  <Button
                    title={text.list.emptyState.cta}
                    onClick={() => navigate('/integracoes/compartilhamento/novo')}
                  />
                )}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table isLoading={isLoading} />
          )}
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
        title={text.list.deleteDialog.header}
        description={text.list.deleteDialog.body}
        confirmButtonText={text.list.deleteDialog.confirm}
        cancelButtonText={text.list.deleteDialog.cancel}
        hideQuestionMark
      />
    </ContainerGrid>
  );
}
