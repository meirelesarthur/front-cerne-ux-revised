// src/pages/Administrativo/Documentos/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL, COM
// filtro por Tipo de Documento + intervalo de validade, e ações
// Editar/Excluir) de DOCUMENTOS (DocumentManagement) — Administrativo /
// Gestão Documentos. Rota: /administrativo/documentos (guardada por
// `document-managements_view`).
//
// Mirror ESTRUTURAL de `BaseRegistrations/Measurements/index.tsx`:
//   - grid via `useDocumentManagementsList` (useCustomGridQuery — paginação
//     REAL, `page`/`per_page`/`meta`, NÃO a árvore sem paginação de
//     `DocumentType`);
//   - HeaderTable → botão Add + personalização de grid + ButtonFilter
//     (badge "Filtros(N)");
//   - FilterSideDocumentos → `document_type_uuid` (SelectAsyncPaginate,
//     GAP-DOCUMENTOS-FE-02) + `start_date`/`end_date` (DateInput);
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     `document-managements_delete`; onError GENÉRICO do useRequest — sem
//     422 estruturado prometido pelo `DestroyDocumentManagementAction`).
//
// Tarefa 12 (fundação + listagem) — formulário criar/editar + bloco de
// anexos são da Tarefa 13 (`CreateOrUpdateDocumento.tsx`).
// -----------------------------------------------------------------------------

import { useMemo, useState, type ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteDocumentManagement } from '@/services/v2/Documentos/document-management-service';

import type {
  DocumentManagementFilterForm,
  DocumentManagementListItem,
} from '@/@types/v2/Documentos';

import { FilterSideDocumentos } from './FilterSideDocumentos';
import { HeaderTable } from './HeaderTable';
import { useDocumentManagementsList } from './useDocumentManagements';

// Chave estável de storage da personalização de grid desta tela.
const DOCUMENT_MANAGEMENTS_GRID_STORAGE_KEY = 'GBCerneAdministrativoDocumentos';

export default function DocumentosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.documentManagements;

  const canCreate = can('document-managements_create');
  const canView = can('document-managements_view');
  const canEdit = can('document-managements_edit');
  const canDelete = can('document-managements_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: text.pluralLabel + queryKey.baseRegistrations.documentManagements.list,
    }),
    []
  );

  // pageSize 10 = paginação REAL — per_page dinâmico, enviado ao back
  // conforme o pageSize escolhido no grid. `handleFilterChange` já reseta
  // `pageIndex` para 1 ao aplicar (ver usePaginatedQueryStorage.tsx).
  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<DocumentManagementFilterForm>(defaultQueryOptions);

  // ---- Estado do drawer de filtro ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, value]) =>
          key !== 'document_type_label' && value !== undefined && value !== null && value !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<DocumentManagementListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const documentManagementsList = useDocumentManagementsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? ({} as DocumentManagementFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ documentUuid }: { documentUuid: string }) => {
      return await deleteDocumentManagement(documentUuid);
    },
    queryKey: queryKey.baseRegistrations.documentManagements.list,
    queryKey2: queryKey.baseRegistrations.documentManagements.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por Measurements/DocumentType para a mesma
    // operação. O texto exibido vem de `personalizedMessage`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (documentManagement: DocumentManagementListItem) => {
    setToDelete(documentManagement);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ documentUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<DocumentManagementListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text lineClamp="1">{row.original.code}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
        enableHiding: false,
        meta: { gridLabel: text.list.table.description },
      }),
      columnHelper.accessor((row) => row.document_type?.name ?? '', {
        id: 'document_type',
        header: text.list.table.documentType,
        cell: ({ row }) => <Text lineClamp="1">{row.original.document_type?.name ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.documentType },
      }),
      columnHelper.accessor('validity', {
        header: text.list.table.validity,
        cell: ({ row }) => <Text lineClamp="1">{row.original.validity ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.validity },
      }),
      columnHelper.accessor('alert_days', {
        header: text.list.table.alertDays,
        cell: ({ row }) => (
          <Text lineClamp="1">
            {row.original.alert_days !== null && row.original.alert_days !== undefined
              ? row.original.alert_days
              : '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.alertDays },
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
                  onClick={() =>
                    navigate(`/administrativo/documentos/${row.original.uuid}?mode=view`)
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/administrativo/documentos/${row.original.uuid}`)}
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
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canView, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<DocumentManagementListItem>({
    storageKey: DOCUMENT_MANAGEMENTS_GRID_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([documentManagementsList]);
  const items = documentManagementsList.data?.data?.items;
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
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
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

        <Box mt={6}>
          {(() => {
            const emptyTitle =
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : canCreate
                  ? text.list.emptyState.titleEmpty
                  : text.list.emptyState.titleEmptyNoCreate;
            const emptyDescription =
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : canCreate
                  ? text.list.emptyState.descriptionEmpty
                  : text.list.emptyState.descriptionEmptyNoCreate;

            return (
              <Table
                isLoading={isLoading}
                isError={documentManagementsList.isError}
                error={documentManagementsList.error}
                isEmpty={isEmpty}
                onRetry={() => documentManagementsList.refetch()}
                isRetrying={documentManagementsList.isFetching}
                emptyIcon={FiFileText as ElementType}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
                canCreate={filtersApplied === 0 && canCreate}
                createLabel={text.list.emptyState.cta}
                onCreate={() => navigate('/administrativo/documentos/novo')}
              />
            );
          })()}
        </Box>
      </TableProvider>

      <FilterSideDocumentos
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
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
