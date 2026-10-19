// src/pages/Financeiro/OfxImport/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Importação OFX (OfxImport — Financeiro, F-114,
// 97-Esteiras/064, TASK-064-OFX-FE-01). Rota: `/financeiro/ofx` (guardada
// por `import_ofx_view`, wiring real da rota é esta mesma Tarefa — ver
// `src/router/index.tsx`).
//
// Mirror estrutural de `Financeiro/MovCaixaBancario/index.tsx` (MESMO
// domínio Financeiro, `useCustomGridQuery` inline sem hook local — SEM
// parent id de contexto: tenant via `X-Farm-Id`) + `GridSettings`
// (`useGridSettings`/`GridSettingsFloatingPanel`).
//
// Ações de linha (SURF-013): "Ver"/"Editar" — UMA única ação (mesmo
// componente/rota `/financeiro/ofx/:uuid`, Decisão F1), rótulo/ícone variam
// por `canEdit` (`import_ofx_edit`) — quem só tem `import_ofx_view` abre a
// mesma tela somente-leitura. "Conciliar" (`import_ofx_edit`, Decisão 1 —
// permissão UNIFICADA, não `import_ofx_create`) navega para
// `/financeiro/ofx/:uuid/conciliacao`, rota AINDA NÃO registrada (cai no
// catch-all `/financeiro/*` até `TASK-064-OFX-FE-02` — mirror EXATO do
// precedente `/financeiro/caixa/:uuid/rateio` em `MovCaixaBancario`, que
// também aponta para uma sub-rota fatiada numa Tarefa posterior). "Excluir"
// gated `import_ofx_delete`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiFileText, FiGitMerge, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteOfxImport,
  listOfxImports,
  ListOfxImportsQuery,
} from '@/services/v2/Financeiro/OfxImports/ofx-import-service';

import type { OfxImportFilterForm, OfxImportListItem } from '@/@types/v2/Financeiro/ofxImport';

import { FilterSideOfxImport } from './FilterSideOfxImport';
import { HeaderTable } from './HeaderTable';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `MOV_CAIXA_BANCARIO_STORAGE_KEY`).
const OFX_IMPORT_STORAGE_KEY = 'FinanceiroOfxImport' + queryKey.financial.ofxImports;

function formatDateBR(value: string): string {
  // `start_date`/`end_date` chegam como "YYYY-MM-DD" (Model::casts, Resource
  // `->toDateString()`) — `new Date('YYYY-MM-DD')` interpreta como UTC
  // meia-noite; formatar com `timeZone: 'UTC'` evita o "dia anterior" que
  // apareceria em fusos negativos (mirror do cuidado já documentado em
  // outras telas de data pura, sem hora).
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

// Achatamento `OfxImportFilterForm` (persistido, com `account_label`
// companion) → `ListOfxImportsQuery` (querystring real de
// `GET /ofx-imports`) — mirror `MovCaixaBancario/index.tsx` (`toRequestFilter`).
// `account_label` nunca é enviado à API.
function toRequestFilter(filter?: OfxImportFilterForm | null): ListOfxImportsQuery {
  return {
    description: filter?.description || undefined,
    account_uuid: filter?.account_uuid || undefined,
    start_date: filter?.start_date || undefined,
    end_date: filter?.end_date || undefined,
  };
}

export default function OfxImportList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.ofxImports.ofxImport;

  const canEdit = can('import_ofx_edit');
  const canDelete = can('import_ofx_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: OFX_IMPORT_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<OfxImportFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação do drawer) — não
        // devem inflar o badge "Filtros(N)" (mirror `MovCaixaBancario`).
        .filter(([key]) => !key.endsWith('_label'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<OfxImportListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const ofxImportsList = useCustomGridQuery<OfxImportListItem, ListOfxImportsQuery>({
    asyncFunction: listOfxImports,
    queryKey: queryKey.financial.ofxImports,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ ofxImportUuid }: { ofxImportUuid: string }) => {
      return await deleteOfxImport(ofxImportUuid);
    },
    queryKey: queryKey.financial.ofxImports,
    queryKey2: queryKey.financial.ofxImport,
    // `useRequest`'s TypesRequest não tem variante "delete" (mirror
    // `MovCaixaBancario/index.tsx`) — "update" é a convenção já usada para a
    // mesma operação; o texto exibido vem de `personalizedMessage`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (ofxImport: OfxImportListItem) => {
    setToDelete(ofxImport);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ ofxImportUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<OfxImportListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.description}
          </Text>
        ),
        meta: { gridLabel: text.list.table.description },
      }),
      columnHelper.accessor((row) => row.account?.description ?? '', {
        id: 'account',
        header: text.list.table.account,
        // TASK-065-OFX-FE-04 — `account.code` exibido como subtítulo mudo,
        // mirror `CadastrosBase/ContasBancarias/index.tsx` (código sempre
        // como 2ª linha, sob a descrição/banco — NUNCA coluna própria).
        cell: ({ row }) => (
          <Box minW={0}>
            <Text fontSize="sm" color="fg.muted" lineClamp="1">
              {row.original.account
                ? `${row.original.account.bank} — ${row.original.account.description}`
                : '—'}
            </Text>
            {row.original.account && (
              <Text fontSize="xs" color="fg.muted" lineClamp="1">
                {row.original.account.code}
              </Text>
            )}
          </Box>
        ),
        meta: { gridLabel: text.list.table.account },
      }),
      columnHelper.accessor('start_date', {
        header: text.list.table.startDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDateBR(row.original.start_date)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.startDate },
      }),
      columnHelper.accessor('end_date', {
        header: text.list.table.endDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDateBR(row.original.end_date)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.endDate },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={canEdit ? FiEdit : FiEye} />}
                onClick={() => navigate(`/financeiro/ofx/${row.original.uuid}`)}
              >
                {canEdit ? text.list.actions.edit : text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiGitMerge} />}
                  onClick={() => navigate(`/financeiro/ofx/${row.original.uuid}/conciliacao`)}
                >
                  {text.list.actions.reconcile}
                </Actions.Item>
              )}
              {canDelete && (
                <>
                  <Actions.Separator />
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(row.original)}
                    tone="danger"
                    disabled={isDeleting}
                  >
                    {text.list.actions.delete}
                  </Actions.Item>
                </>
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
    [navigate, isDeleting, languageGB, canEdit, canDelete, text]
  );

  const gridSettings = useGridSettings<OfxImportListItem>({
    storageKey: OFX_IMPORT_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([ofxImportsList]);
  const items = ofxImportsList.data?.data?.items;
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
          {isEmpty && !ofxImportsList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiFileText} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>
                    {filtersApplied > 0
                      ? text.list.emptyState.titleFiltered
                      : text.list.emptyState.titleEmpty}
                  </EmptyState.Title>
                  <EmptyState.Description>
                    {filtersApplied > 0
                      ? text.list.emptyState.descriptionFiltered
                      : text.list.emptyState.descriptionEmpty}
                  </EmptyState.Description>
                </VStack>
                {filtersApplied === 0 && can('import_ofx_create') && (
                  <Button
                    title={text.list.emptyState.cta}
                    size="sm"
                    onClick={() => navigate('/financeiro/ofx/novo')}
                  />
                )}
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={ofxImportsList.isError}
              error={ofxImportsList.error}
              onRetry={() => ofxImportsList.refetch()}
              isRetrying={ofxImportsList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideOfxImport
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
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
