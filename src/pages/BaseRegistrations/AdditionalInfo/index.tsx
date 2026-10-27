// src/pages/BaseRegistrations/AdditionalInfo/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, sem FK) de INFORMAÇÕES
// COMPLEMENTARES (AdditionalInfo) — Cadastros Base / Fiscais.
// Rota: /cadastros-base/info-complementares (guardada por
// `additional-info_view`, registrada em src/router/index.tsx — este arquivo
// não mexe em rota/menu).
//
// Referência UX (TASK-AI-03): não existe tela oficial de Informações
// Complementares no design system `cerne` (UX-GAP declarado) — precedente
// INTERNO CadastrosBase/MotivosBaixa (LowReason — estrutura mecânica + delete
// simples) + CadastrosBase/TiposTitulo (drawer mais enxuto). Estrutura:
//   - grid via useCustomGridQuery inline (paginação REAL server-side);
//   - HeaderTable → botões de ação (Add respeita additional-info_create);
//   - FilterSideAdditionalInfo → drawer (search/is_active), COM
//     re-hidratação ao reabrir;
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     additional-info_delete; onError GENÉRICO do useRequest já exibe a
//     `message` real do 422 "em uso" — DeleteAdditionalInfoAction, guarda
//     dupla dependencyUsageCounts()+catch 23503 — um único tipo de
//     dependência, nature_operations, mesmo racional de LowReason).
//
// `AdditionalInfo` é FARM-SCOPED (tenant_id+farm_id, DA-AI-02) — diferente de
// LowReason/TypeTitle (catálogos globais). O header X-Farm-Id é anexado
// automaticamente pelo interceptor axios global e é RESPEITADO pelo backend
// aqui — comportamento do backend, nenhuma ação especial no front.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiFileText, FiTrash2 } from 'react-icons/fi';
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
  deleteAdditionalInfo,
  listAdditionalInfos,
} from '@/services/v2/AdditionalInfo/additional-info-service';

import type { AdditionalInfoFilterForm, AdditionalInfoListItem } from '@/@types/v2/AdditionalInfo';

import { FilterSideAdditionalInfo } from './FilterSideAdditionalInfo';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Chave de storage estável desta tela para a personalização de grid
// (useGridSettings). Mesma raiz de nomenclatura das demais telas migradas.
const ADDITIONAL_INFO_STORAGE_KEY = 'GBCerneBaseRegistrationsAdditionalInfo';

export default function AdditionalInfoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.additionalInfo;

  const canCreate = can('additional-info_create');
  const canEdit = can('additional-info_edit');
  const canDelete = can('additional-info_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.additionalInfos,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AdditionalInfoFilterForm>(defaultQueryOptions);
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

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<AdditionalInfoListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const additionalInfosList = useCustomGridQuery<AdditionalInfoListItem, AdditionalInfoFilterForm>({
    asyncFunction: listAdditionalInfos,
    queryKey: queryKey.baseRegistrations.additionalInfos,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as AdditionalInfoFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ additionalInfoUuid }: { additionalInfoUuid: string }) => {
      return await deleteAdditionalInfo(additionalInfoUuid);
    },
    queryKey: queryKey.baseRegistrations.additionalInfos,
    queryKey2: queryKey.baseRegistrations.additionalInfo,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por LowReason/TypeTitle para a mesma operação. O
    // texto exibido no toast vem de `personalizedMessage`, então o rótulo
    // genérico associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). O backend real emite 422
    // estruturado "Informação Complementar está em uso e não pode ser
    // excluída." (DeleteAdditionalInfoAction, guarda dupla
    // dependencyUsageCounts()+catch 23503) — o toast genérico já mostra a
    // mensagem certa, sem precisar decodificar `errors.in_use` estruturado.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (additionalInfo: AdditionalInfoListItem) => {
    setToDelete(additionalInfo);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ additionalInfoUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<AdditionalInfoListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
        meta: { gridLabel: text.list.table.description },
      }),
      // `info` pode ter até 1000 caracteres — truncado na listagem
      // (lineClamp), texto completo só no formulário (TASK-AI-04).
      columnHelper.accessor('info', {
        header: text.list.table.info,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.info}
          </Text>
        ),
        meta: { gridLabel: text.list.table.info },
      }),
      columnHelper.accessor('is_active', {
        header: text.list.table.isActive,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_active ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_active ? text.list.table.active : text.list.table.inactive}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isActive },
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
                    navigate(`/cadastros-base/info-complementares/${row.original.uuid}`)
                  }
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
    [navigate, isDeleting, text, canEdit, canDelete, languageGB.defaltStrings.actions]
  );

  const gridSettings = useGridSettings<AdditionalInfoListItem>({
    storageKey: ADDITIONAL_INFO_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([additionalInfosList]);
  const items = additionalInfosList.data?.data?.items;
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
            isError={additionalInfosList.isError}
            error={additionalInfosList.error}
            isEmpty={isEmpty}
            onRetry={() => additionalInfosList.refetch()}
            isRetrying={additionalInfosList.isFetching}
            emptyIcon={FiFileText as ElementType}
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
            onCreate={() => navigate('/cadastros-base/info-complementares/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideAdditionalInfo
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
