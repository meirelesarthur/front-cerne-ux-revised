// src/pages/BaseRegistrations/Fodders/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL, SEM
// filtro — DA-FD-11, COM ações Editar/Excluir) de FORRAGEM (Fodder) —
// Cadastros Base / Pecuários.
// Rota: /cadastros-base/forragem (guardada por `fodder_view`, registrada
// nesta Tarefa, TASK-FD-FE-01, ANTES do catch-all /cadastros-base/*).
//
// Molde estrutural PRIMÁRIO: `IdentificationTypes/index.tsx` — mesmo shape de
// 2 campos (`description`+`is_enabled`), mesma decisão "sem filtro", painel
// de personalização de colunas (`useGridSettings`/`useGridStorageScope`)
// LIGADO desde o início (Fodder-FrontEnd-contrato.md §4.2).
//
// Exclusão: `useMutation`/`useQueryClient` do TanStack Query DIRETO (mirror
// `ParameterWeights/index.tsx`, NÃO `useRequest`) — `Fodder` tem
// `errors.in_use.grazings` estruturado (422), e o `onError` genérico do
// `useRequest` só lê `message`, nunca `errors`, o que esconderia
// `errors.in_use`. 422 estruturado abre `InUseBlockedDialog` (genérico) — SEM nenhum CTA
// de navegação (`Grazing`/"Pastejo" não está migrado, não há tela de
// destino).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { Wheat } from 'lucide-react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { InUseBlockedDialog, type InUseBlockedItem } from '@/components/InUseBlockedDialog';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractInUseItems } from '@/utils/extractApiErrorMessage';
import { styleColumTable } from '@/utils/style-colum-table';

import { fodderInUseTableLabels } from '@/constants/Fodder/options/fodder-in-use-table-labels';
import { queryKey } from '@/constants/query-key';

import { deleteFodder, listFodders } from '@/services/v2/BaseRegistrations/fodders-service';

import type { FodderListItem } from '@/@types/v2/BaseRegistrations/fodders';

import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// estável para nunca divergirem — mirror `IdentificationTypes/index.tsx`.
const FODDERS_STORAGE_KEY = 'BaseRegistrationsFodders' + queryKey.baseRegistrations.fodders;

export default function FoddersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.fodder;

  const canCreate = can('fodder_create');
  const canEdit = can('fodder_edit');
  const canDelete = can('fodder_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: FODDERS_STORAGE_KEY,
    }),
    []
  );

  // pageSize 10 = paginação REAL, per_page dinâmico, enviado ao back conforme
  // o pageSize escolhido no grid. SEM filtro — decisão do dono (DA-FD-11),
  // não-negociável. Sem `FodderFilterForm`: o filtro genérico do TanStack
  // Query exige um tipo de objeto, satisfeito aqui por `Record<string,
  // never>` (nenhuma chave de negócio, nenhum filtro criado).
  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<Record<string, never>>(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<FodderListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use`, mapa
  // `{grazings: count}`, shape confirmado no contrato de API —
  // Fodder-contrato.md §4.6/DA-FD-04). Itens normalizados por
  // `extractInUseItems` (canário FRONT-03-InUseBlockedDialog.md).
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  const foddersList = useCustomGridQuery<FodderListItem, Record<string, never>>({
    asyncFunction: listFodders,
    queryKey: queryKey.baseRegistrations.fodders,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as Record<string, never>),
  });

  // ⚠️ NÃO usa `useRequest` aqui — mesma razão documentada em
  // `ParameterWeights/index.tsx`: o `onError` genérico só lê `message`, nunca
  // `errors`, o que esconderia `errors.in_use`.
  const deleteMutation = useMutation({
    mutationFn: async (fodderUuid: string) => await deleteFodder(fodderUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.fodders] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('Fodder delete - error:', error);

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
            typeof resData.message === 'string' ? resData.message : JSON.stringify(resData.message);
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

  const handleDeleteClick = (fodder: FodderListItem) => {
    setToDelete(fodder);
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

  const columnHelper = createColumnHelper<FodderListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false, // coluna-âncora — nunca ocultável
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
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
            {row.original.is_enabled ? text.list.table.active : text.list.table.inactive}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.status },
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
                  onClick={() => navigate(`/cadastros-base/forragem/${row.original.uuid}`)}
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<FodderListItem>({
    storageKey: FODDERS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([foddersList]);
  const items = foddersList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid header={<HeaderTable languageGB={languageGB} gridSettings={gridSettings} />}>
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={foddersList.isError}
            error={foddersList.error}
            isEmpty={isEmpty}
            onRetry={() => foddersList.refetch()}
            isRetrying={foddersList.isFetching}
            emptyIcon={Wheat}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/forragem/novo')}
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
        itemName={toDelete?.description}
      />

      <InUseBlockedDialog
        isOpen={isOpenBlockedDialog}
        onClose={handleCloseBlockedDialog}
        title={text.deleteBlocked.title}
        description={text.deleteBlocked.description}
        itemName={toDelete?.description}
        items={blockedInUse}
        closeLabel={languageGB.defaltStrings.close}
        resourceLabelTemplate={text.deleteBlocked.resourceLabel}
        getResourceLabel={(table) => fodderInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
