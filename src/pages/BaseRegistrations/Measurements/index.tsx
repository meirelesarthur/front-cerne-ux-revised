// src/pages/BaseRegistrations/Measurements/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL — padrão
// do projeto 10/página, per_page enviado dinamicamente ao back conforme
// pageSize do grid —, COM busca textual e ações Editar/Excluir) de UN. DE
// MEDIDA (Measurement) — Cadastros Base / Estrutura.
// Rota: /cadastros-base/unidade-medida (guardada por `measurements_view`,
// registrada em TASK-FE-056 — este arquivo não mexe em rota/menu).
//
// Base em TASK-FE-054 (paginação REAL, Doc Bruta §4/§13). Acréscimo
// pós-migração (decisão explícita do dev no E2E): campo de busca por
// Sigla/Descrição, que o legado NÃO tinha — mesma casca de FilterSide de
// Vacinas/Racas (drawer com Aplicar/Limpar via `handleFilterChange`/
// `handleResetFilter`, que já reseta `pageIndex` para 1 — ver
// `usePaginatedQueryStorage.tsx`), enxuta para SÓ o campo `search` (sem
// Status/FK, que este catálogo não tem):
//   - grid via useCustomGridQuery inline (paginação REAL — TASK-FE-054, o adaptador
//     `listMeasurements` lê `data.meta.*` de verdade, GAP-BE-043 ✅ CONCLUÍDO);
//   - HeaderTable → botão Add + ButtonFilter (badge "Filtros(N)");
//   - FilterSideMeasurements → SÓ `search` (Sigla OU Descrição, ILIKE);
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     measurements_delete; onError GENÉRICO do useRequest — sem tratamento de
//     FK estruturado no `DestroyMeasurementAction` hoje, ver TASK-FE-054/
//     GAP-FE-009).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTag, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
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
  deleteMeasurement,
  listMeasurements,
} from '@/services/v2/Measurements/measurement-service';

import type { MeasurementFilterForm, MeasurementListItem } from '@/@types/v2/Measurements';

import { FilterSideMeasurements } from './FilterSideMeasurements';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave estável de storage da personalização de grid desta tela.
const MEASUREMENTS_GRID_STORAGE_KEY = 'GBCerneBaseRegistrationsMeasurements';

export default function MeasurementsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.measurement;

  const canCreate = can('measurements_create');
  const canEdit = can('measurements_edit');
  const canDelete = can('measurements_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.measurements,
    }),
    []
  );

  // pageSize 10 = paginação REAL (TASK-FE-054) — per_page dinâmico, enviado ao
  // back conforme o pageSize escolhido no grid (5/10/25/50/100). `filter`
  // (busca) é acréscimo pós-migração — `handleFilterChange` já reseta
  // `pageIndex` para 1 ao aplicar (ver usePaginatedQueryStorage.tsx), mantendo
  // o `pageSize` escolhido.
  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MeasurementFilterForm>(defaultQueryOptions);

  // ---- Estado de busca (drawer) --------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<MeasurementListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const measurementsList = useCustomGridQuery<MeasurementListItem, MeasurementFilterForm>({
    asyncFunction: listMeasurements,
    queryKey: queryKey.baseRegistrations.measurements,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as MeasurementFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ measurementUuid }: { measurementUuid: string }) => {
      return await deleteMeasurement(measurementUuid);
    },
    queryKey: queryKey.baseRegistrations.measurements,
    queryKey2: queryKey.baseRegistrations.measurement,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // IdentificationType/DiagnosticTechnique/Species para a mesma operação. O
    // texto exibido no toast vem de `personalizedMessage`, então o rótulo
    // genérico associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). `DestroyMeasurementAction`
    // não trata FK estruturada hoje (ver TASK-FE-054/GAP-FE-009) — a mensagem
    // pode vir crua/genérica em vez de "em uso".
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (measurement: MeasurementListItem) => {
    setToDelete(measurement);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ measurementUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<MeasurementListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
        meta: { gridLabel: text.list.table.name },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => <Text lineClamp="1">{row.original.description}</Text>,
        meta: { gridLabel: text.list.table.description },
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
                  onClick={() => navigate(`/cadastros-base/unidade-medida/${row.original.uuid}`)}
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

  const gridSettings = useGridSettings<MeasurementListItem>({
    storageKey: MEASUREMENTS_GRID_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([measurementsList]);
  const items = measurementsList.data?.data?.items;
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={measurementsList.isError}
            error={measurementsList.error}
            isEmpty={isEmpty}
            onRetry={() => measurementsList.refetch()}
            isRetrying={measurementsList.isFetching}
            emptyIcon={FiTag as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : canCreate
                  ? text.list.emptyState.titleEmpty
                  : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : canCreate
                  ? text.list.emptyState.descriptionEmpty
                  : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/unidade-medida/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideMeasurements
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
    </ContainerGrid>
  );
}
