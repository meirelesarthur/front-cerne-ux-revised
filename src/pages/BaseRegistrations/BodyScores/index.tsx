// src/pages/BaseRegistrations/BodyScores/index.tsx
// Tela de LISTAGEM de Escore Corporal (Cadastros Base → Pecuários) — mirror
// estrutural de `BaseRegistrations/DiagnosisPregnancy/index.tsx` (tela
// canônica do protocolo v2), com uma coluna extra (Espécie) e
// `useGridSettings`/`GridSettingsFloatingPanel` wired (regra estrutural
// obrigatória do protocolo v2, item 8, mesmo para grid pequena — ver
// "Riscos" da ficha `TASK-BS-FE-02`; mirror
// `CadastrosBase/CentroCusto/index.tsx:283-322` para o wiring exato).
//
// Filtro só `search`+`specie_uuid` — contrato §3 confirma que
// `BodyScoreFilterData` não aceita `is_enabled` (diferente de
// `DiagnosisPregnancy`/`Racas`); NÃO adicionar Select de status.

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Gauge } from 'lucide-react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
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

import { deleteBodyScore, listBodyScores } from '@/services/v2/BaseRegistrations/bodyScore-service';

import type {
  BodyScoreListItem,
  BodyScoresFilterForm,
} from '@/@types/v2/BaseRegistrations/bodyScore';

import { FilterSideBodyScores } from './FilterSideBodyScores';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

export default function BodyScoreList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.bodyScore;

  // DEC-006 — slugs reusados do legado (`bodys_*`), nunca `body_scores_*`/
  // `bodyscore_*` novo.
  const canCreate = can('bodys_create');
  const canEdit = can('bodys_edit');
  const canDelete = can('bodys_delete');

  // Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
  // personalização de grid (`useGridSettings`) derivam da MESMA expressão
  // para nunca divergirem (mirror `CENTRO_CUSTO_STORAGE_KEY`, DEC-007 §12) —
  // aqui a expressão precisa de `languageGB` (mirror `DiagnosisPregnancyList`),
  // então fica dentro do componente em vez de constante de módulo.
  const storageKey =
    languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.bodyScores;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey,
    }),
    [storageKey]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BodyScoresFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<BodyScoreListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const bodyScoresList = useCustomGridQuery<BodyScoreListItem, BodyScoresFilterForm>({
    asyncFunction: listBodyScores,
    queryKey: queryKey.baseRegistrations.bodyScores,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as BodyScoresFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ bodyScoreUuid }: { bodyScoreUuid: string }) => {
      return await deleteBodyScore(bodyScoreUuid);
    },
    queryKey: queryKey.baseRegistrations.bodyScores,
    queryKey2: queryKey.baseRegistrations.bodyScore,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por Espécies/DiagnosisPregnancy para a mesma
    // operação; o texto do toast vem de `personalizedMessage`, então o rótulo
    // genérico associado a "update" nunca aparece ao usuário.
    //
    // Guarda de FK 422 (uso por `mating_protocol_animals`, contrato `## 4`/
    // Doc Bruta `## 7.4`): tratada aqui como qualquer erro de negócio do
    // envelope (toast com a `message`), sem parsing de `errors.in_use[]` —
    // este endpoint não emite esse shape estruturado (mesma nota de
    // `DiagnosisPregnancyList`).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (bodyScore: BodyScoreListItem) => {
    setToDelete(bodyScore);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ bodyScoreUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<BodyScoreListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={Gauge} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor((row) => row.specie?.description ?? '—', {
        id: 'specie',
        header: text.list.table.specie,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.specie?.description ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.specie },
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.isEnabled,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.yes : text.list.table.no}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isEnabled },
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
                  onClick={() => navigate(`/cadastros-base/escore-corporal/${row.original.uuid}`)}
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
    [navigate, isDeleting, languageGB, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<BodyScoreListItem>({
    storageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([bodyScoresList]);
  const items = bodyScoresList.data?.data?.items;
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
            isError={bodyScoresList.isError}
            error={bodyScoresList.error}
            isEmpty={isEmpty}
            onRetry={() => bodyScoresList.refetch()}
            isRetrying={bodyScoresList.isFetching}
            emptyIcon={Gauge as ElementType}
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
            onCreate={() => navigate('/cadastros-base/escore-corporal/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideBodyScores
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
