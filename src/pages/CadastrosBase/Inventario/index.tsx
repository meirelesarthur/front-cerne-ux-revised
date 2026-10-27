// src/pages/CadastrosBase/Inventario/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM paginada de INVENTÁRIO (Equipment) — Cadastros Base /
// Bens-Ativos, execução 026 (TASK-FE-1004). Rota:
// /cadastros-base/inventario (nó de menu `cad-ben-inv` JÁ RESERVADO em
// `navigationTree.ts`/`navigationPermissions.ts`/`languageSidebar.ts`,
// guardado por `equipments_view`, wiring de rota real em `TASK-FE-1011` —
// CHOKEPOINT desta execução, outra Tarefa é dona de `router/index.tsx`).
//
// Mirror de composição: `Produtos/Catalogo/index.tsx` (precedente MAIS
// aderente ao padrão atual, Equipment-Frontend-Contrato.md §2) — grid
// paginada (`ContainerGrid`/`TableProvider`/`Table`) + `HeaderTable` + drawer
// de filtro `<Form formFilter>` (`FilterSideInventario`, NUNCA
// `FilterSideCentroCusto`, que usa `<VStack as="form">` cru — desvio
// deliberado já registrado no contrato §2).
//
// 7 COLUNAS (contrato §5, mirror `_table.blade.php` do legado): Código/
// Descrição/Família/Proprietário/Status/Valor de Aquisição/Ações
// (Ver/Editar/Excluir, gated por `equipments_view`/`equipments_edit`/
// `equipments_delete`). Ordenação FIXA por `code` (RN da Doc Bruta §4b/
// contrato §5) — SEM `SortHeader` clicável, fiel ao legado.
//
// PAGINAÇÃO: `per_page ?? 10` (default), teto real do backend 100
// (`EquipmentIndexRequest`, contrato de API §7) — seletor
// 10/20/30/50/80/100 (NÃO 200), mesmo hardening já registrado em
// `Produtos/Catalogo/index.tsx`.
//
// GUARD DE FAZENDA ATIVA: Inventário está dentro do bloco `farm.context`
// ESTRITO (Equipment-contrato.md §12, "sempre exige Farm ativa", diferente
// do híbrido de Product) — `useEquipmentsList` já resolve isso via
// `enabled: hasFarm` (`useEquipments.tsx`, TASK-FE-1001); esta tela só
// precisa renderizar o `EmptyState` de "selecione uma fazenda" quando
// `!hasFarm`, mesmo padrão de `Produtos/Catalogo/index.tsx`.
//
// ⚠️ Armadilha ERRO-FE-016 (services que enumeram parâmetros manualmente
// descartam parâmetro novo em silêncio): `toRequestFilter()` abaixo repassa
// os 5 filtros EXPLICITAMENTE (mesmos 5 nomes de `EquipmentFilterRequest`,
// `@/@types/v2/Equipments`), e `listEquipments()` (`equipment-service.ts`,
// TASK-FE-1001) já confirmadamente repassa os 5 na querystring — os DOIS
// elos conferidos (achatamento do form E montagem dos query params).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiTool, FiTrash2 } from 'react-icons/fi';
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

import { deleteEquipment } from '@/services/v2/Equipments/equipment-service';
import type { ListEquipmentsParams } from '@/services/v2/Equipments/equipment-service';

import type { EquipmentFilterForm, EquipmentListItem } from '@/@types/v2/Equipments';

import { FilterSideInventario } from './FilterSideInventario';
import { HeaderTable } from './HeaderTable';
import { useEquipmentsList } from './useEquipments';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Seletor de tamanho de página — teto real 100 (`EquipmentIndexRequest`,
// contrato de API §7), mesmo hardening de `Produtos/Catalogo/index.tsx`.
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 80, 100];

// Moeda BRL — reaproveita o padrão já usado no projeto (mirror
// `Estorno/index.tsx`/`PrevisaoDepreciacao.tsx`), sem implementar um
// formatter novo.
function formatCurrencyBRL(value: number): string {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Achatamento `EquipmentFilterForm` (persistido, com `*_label` companion) →
// `EquipmentFilterRequest`/`ListEquipmentsParams` (querystring real de
// `GET /equipments`) — responsabilidade desta Tarefa. `*_label` nunca é
// enviado à API, só existe para re-hidratar o drawer (ver cabeçalho do
// arquivo).
function toRequestFilter(filter?: EquipmentFilterForm | null): ListEquipmentsParams {
  return {
    search: filter?.search || undefined,
    family_equipment_uuid: filter?.family_equipment_uuid || undefined,
    proprietary_uuid: filter?.proprietary_uuid || undefined,
    start_date: filter?.start_date || undefined,
    end_date: filter?.end_date || undefined,
  };
}

export default function InventarioList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can, hasFarm } = usePermissions();
  const text = languageGB.equipments.equipment;

  const canCreate = can('equipments_create');
  const canEdit = can('equipments_edit');
  const canDelete = can('equipments_delete');
  const canView = can('equipments_view');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseInventario' + queryKey.equipments.equipmentsList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<EquipmentFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação do drawer) — não
        // devem inflar o badge "Filtros(N)" (mesma regra de
        // `Produtos/Catalogo/index.tsx`).
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
  const [toDelete, setToDelete] = useState<EquipmentListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Guard de fazenda ativa (`farm.context` ESTRITO — Equipment-contrato.md
  // §12) — a query só dispara quando `hasFarm` é verdadeiro. Sem fazenda
  // ativa, NENHUMA chamada de rede é feita (evita 403 cru do backend).
  const equipmentsList = useEquipmentsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: requestFilter,
    enabled: hasFarm,
  });

  const items = hasFarm ? (equipmentsList.data?.data?.items ?? []) : [];

  // RN-7 (delete em cascata de `depreciations`, server-side, dentro da
  // mesma transação) — `deleteEquipment` já confirmado no contrato de API
  // §10 (`equipments_delete`). Mirror `useRequest` de
  // `Produtos/Classes/index.tsx`/`CentroCusto/index.tsx` — `typesRequest:
  // 'update'` é a opção compilável do hook compartilhado para delete (o
  // texto exibido vem de `personalizedMessage`, nunca o rótulo genérico
  // associado a "update").
  const deleteMutation = useRequest({
    asyncFunction: async ({ equipmentUuid }: { equipmentUuid: string }) => {
      return await deleteEquipment(equipmentUuid);
    },
    queryKey: queryKey.equipments.equipmentsList,
    queryKey2: queryKey.equipments.equipment,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.toasts.deleteSuccess,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (equipment: EquipmentListItem) => {
    setToDelete(equipment);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ equipmentUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<EquipmentListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" color="fg.muted">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor((row) => row.family?.description ?? '', {
        id: 'family',
        header: text.list.table.family,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.family?.description ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.proprietary?.label ?? '', {
        id: 'proprietary',
        header: text.list.table.proprietary,
        // `proprietary_uuid` é opcional no contrato — sem proprietário
        // atribuído exibe o placeholder, mesmo padrão de
        // `Produtos/Catalogo/index.tsx` (`kindEmpty`).
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.proprietary?.label ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('status', {
        header: text.list.table.status,
        // RN-10: `status_label` já vem tolerante do backend (`status < 4 ?
        // label : null`, `EquipmentResource`) — badge cinza quando `null`
        // (dado legado fora do domínio 1/2), nunca quebra a listagem.
        cell: ({ row }) => (
          <Badge
            colorPalette={
              row.original.status === 1 ? 'green' : row.original.status === 2 ? 'gray' : 'gray'
            }
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.status_label ?? '—'}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('vl_acquisition', {
        header: text.list.table.vlAcquisition,
        cell: ({ row }) => (
          <Box width="full" textAlign="right">
            <Text fontSize="sm" color="fg.muted">
              {row.original.vl_acquisition !== null
                ? formatCurrencyBRL(row.original.vl_acquisition)
                : '—'}
            </Text>
          </Box>
        ),
        meta: styleColumTable.md,
      }),
      // Ações = Ver/Editar/Excluir (contrato §5), gated por
      // `equipments_view`/`equipments_edit`/`equipments_delete`.
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() =>
                    navigate(`/cadastros-base/inventario/${row.original.uuid}/detalhe`)
                  }
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/inventario/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
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
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, text, canView, canEdit, canDelete, isDeleting]
  );

  const isLoading = hasFarm && checkLoadingStatus([equipmentsList]);
  const isEmpty = hasFarm && !isLoading && items.length === 0;

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
          {!hasFarm ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiTool} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.noFarmSelected.title}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.noFarmSelected.description}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              isError={equipmentsList.isError}
              error={equipmentsList.error}
              isEmpty={isEmpty}
              onRetry={() => equipmentsList.refetch()}
              isRetrying={equipmentsList.isFetching}
              emptyIcon={FiTool}
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
              onCreate={() => navigate('/cadastros-base/inventario/novo')}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideInventario
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={(applied) => handleFilterChange(applied)}
        handleReset={() => handleResetFilter()}
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
        isLoading={deleteMutation.isPending}
        title={text.list.deleteConfirm.title}
        description={text.list.deleteConfirm.description}
        confirmButtonText={text.list.deleteConfirm.confirmLabel}
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
