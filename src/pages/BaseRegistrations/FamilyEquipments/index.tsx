// src/pages/BaseRegistrations/FamilyEquipments/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de FAMÍLIA DE BENS — Cadastros Base (padrão modular,
// espelho de BaseRegistrations/DiagnosisPregnancy/index.tsx).
// Rota: /cadastros-base/familia-de-bens (guardada por `familyequipments_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura idêntica a CadastrosBase/CentroCusto/index.tsx (grid flat REAL de
// servidor, paginação real — NÃO o adaptador single-page de Especies):
//   - grid paginado (TableProvider + Table) via `useCustomGridQuery` inline;
//   - HeaderTable      → botões de ação (Add respeita familyequipments_create);
//   - FilterSideFamilyEquipments → drawer (search/is_enabled/type_depreciation),
//     COM re-hidratação ao reabrir (appliedFilter, checklist item 1);
//   - delete via useRequest + DeleteConfirmDialog — onError lê a `message`
//     estruturada do envelope (422 "está em uso", nunca 500 — Anti-Gap #1 do
//     contrato).
//
// Permissões: recurso SEM flag por item (`FamilyEquipmentResource` não expõe
// `can_edit`/`can_delete` — diferente de CostCenter/DEC-005) — ações de linha
// usam permissão GLOBAL (`familyequipments_edit`/`familyequipments_delete`),
// mesmo padrão de Especies/index.tsx.
//
// Thumbnail: `Image` (Chakra v3) não tem prop `fallback` (removida desde v2)
// — fallback implementado localmente via estado de erro de carregamento
// (`FamilyEquipmentThumbnail`), mostrando um ícone neutro quando `image_url`
// é `null` OU quando o carregamento da URL falha.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Image, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Package } from 'lucide-react';
import { FiEdit, FiImage, FiTrash2 } from 'react-icons/fi';
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
  deleteFamilyEquipment,
  listFamilyEquipments,
} from '@/services/v2/BaseRegistrations/familyEquipment-service';

import type {
  FamilyEquipmentFilterForm,
  FamilyEquipmentListItem,
} from '@/@types/v2/BaseRegistrations/familyEquipment';

import { FilterSideFamilyEquipments } from './FilterSideFamilyEquipments';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Thumbnail com fallback local (Chakra v3 `Image` não tem prop `fallback`).
function FamilyEquipmentThumbnail({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);
  const showPlaceholder = !imageUrl || hasError;

  if (showPlaceholder) {
    return (
      <Flex
        boxSize="9"
        align="center"
        justify="center"
        borderRadius="md"
        bg="bg.muted"
        border="1px solid"
        borderColor="border.subtle"
        flexShrink={0}
      >
        <Icon as={FiImage} boxSize={4} color="fg.muted" />
      </Flex>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      boxSize="9"
      borderRadius="md"
      objectFit="cover"
      flexShrink={0}
      onError={() => setHasError(true)}
    />
  );
}

export default function FamilyEquipmentsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.familyEquipment;

  // Paginação (`userPaginatedQuery`) e personalização de grid (`useGridSettings`)
  // derivam da MESMA expressão de chave para nunca divergirem (DEC-007 §12).
  const familyEquipmentsStorageKey =
    languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.familyEquipments;

  const canCreate = can('familyequipments_create');
  const canEdit = can('familyequipments_edit');
  const canDelete = can('familyequipments_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: familyEquipmentsStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FamilyEquipmentFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

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
  const [toDelete, setToDelete] = useState<FamilyEquipmentListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const familyEquipmentsList = useCustomGridQuery<
    FamilyEquipmentListItem,
    FamilyEquipmentFilterForm
  >({
    asyncFunction: listFamilyEquipments,
    queryKey: queryKey.baseRegistrations.familyEquipments,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as FamilyEquipmentFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ familyEquipmentUuid }: { familyEquipmentUuid: string }) => {
      return await deleteFamilyEquipment(familyEquipmentUuid);
    },
    queryKey: queryKey.baseRegistrations.familyEquipments,
    queryKey2: queryKey.baseRegistrations.familyEquipment,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // CostCenters/Especies para a mesma operação. O texto exibido no toast vem
    // de `personalizedMessage`, então o rótulo genérico associado a "update"
    // nunca aparece ao usuário.
    //
    // onError: NÃO customizado — o tratamento genérico interno do `useRequest`
    // já lê `message` do envelope, e o backend (`DeleteFamilyEquipmentAction`,
    // Anti-Gap #1) SEMPRE devolve 422 estruturado com a mensagem real "está em
    // uso" quando há `equipments` vinculados — nunca 500 (diferente de
    // Species, achado registrado só naquele módulo).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (familyEquipment: FamilyEquipmentListItem) => {
    setToDelete(familyEquipment);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ familyEquipmentUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<FamilyEquipmentListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'image',
        header: text.list.table.image,
        enableHiding: false,
        cell: ({ row }) => (
          <FamilyEquipmentThumbnail
            imageUrl={row.original.image_url}
            alt={row.original.description}
          />
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: text.list.table.image,
          gridOrder: 'fixed-start',
          gridDataColumn: false,
        },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('type_depreciation_label', {
        header: text.list.table.typeDepreciation,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.type_depreciation_label}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.typeDepreciation },
      }),
      columnHelper.accessor('life_bens', {
        header: text.list.table.lifeBens,
        cell: ({ row }) => <Text fontSize="sm">{row.original.life_bens ?? '—'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.lifeBens },
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
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.active },
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
                  onClick={() => navigate(`/cadastros-base/familia-de-bens/${row.original.uuid}`)}
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

  const gridSettings = useGridSettings<FamilyEquipmentListItem>({
    storageKey: familyEquipmentsStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([familyEquipmentsList]);
  const items = familyEquipmentsList.data?.data?.items;
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
            isError={familyEquipmentsList.isError}
            error={familyEquipmentsList.error}
            isEmpty={isEmpty}
            onRetry={() => familyEquipmentsList.refetch()}
            isRetrying={familyEquipmentsList.isFetching}
            emptyIcon={Package}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/familia-de-bens/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFamilyEquipments
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
