// src/pages/CadastrosBase/CentroCusto/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CENTROS DE CUSTO — Cadastros Base.
// Rota: /cadastros-base/centros-custo (guardada por `costcenters_view`,
// registrada em TASK-FE-005 — este arquivo não mexe em rota/menu).
//
// Estrutura idêntica a CadastrosBase/Perfil/index.tsx (único CRUD já migrado
// pelo pipeline formal neste projeto):
//   - grid paginado (TableProvider + Table) via useCostCentersList;
//   - HeaderTable      → botões de ação (filtro/config. de grid — sem botão
//     de criação, ver nota abaixo);
//   - FilterSideCentroCusto → drawer (search/type/is_enabled);
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     costcenters_delete; erro de negócio do backend — ex.: FK RESTRICT por
//     centro referenciado — vira toast com a message do envelope).
//
// Fidelidade à Referência UX (GB.Cerne.UX/.../CentrosCustoLista.tsx, commit
// 73b5fa86) COM adaptação ao contrato real: sem KPI bar (o backend não expõe
// agregados e pagina fixo em 50 — calcular sobre 1 página violaria "sem
// mock"), sem filtro "Classe" (client-side sobre 1 página só enganaria o
// usuário) e sem o modal "Saiba mais" (puramente decorativo, fora de escopo
// desta tarefa). Empty state via `EmptyState` nativo do Chakra v3 (compound
// component já disponível na versão instalada — não um componente novo do
// projeto), SEM CTA de criação de topo — botão removido por decisão do dono
// 2026-09-28 (OD-074-004): criação só por "Cadastrar descendente".
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import type { ElementType } from 'react';
import { FiEdit, FiEye, FiFolder, FiGitBranch, FiTrash2 } from 'react-icons/fi';
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
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteCostCenter } from '@/services/v2/CostCenters/cost-center-service';

import type { CostCenterFilterForm, CostCenterListItem } from '@/@types/v2/CostCenters';

import { FilterSideCentroCusto } from './FilterSideCentroCusto';
import { HeaderTable } from './HeaderTable';
import { useCostCentersList } from './useCostCenters';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem — nada de literal cru repetido (DEC-007 §12).
const CENTRO_CUSTO_STORAGE_KEY = 'CadastrosBaseCentroCusto' + queryKey.costCenters.list;

export default function CentroCustoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.costCenters.costCenter;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: CENTRO_CUSTO_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CostCenterFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<CostCenterListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const costCentersList = useCostCentersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ costCenterUuid }: { costCenterUuid: string }) => {
      return await deleteCostCenter(costCenterUuid);
    },
    queryKey: queryKey.costCenters.list,
    queryKey2: queryKey.costCenters.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a única opção compilável e é
    // o mesmo valor usado por Perfil/index.tsx para a mesma operação. O texto
    // exibido no toast vem de `personalizedMessage`, então o rótulo genérico
    // associado a "update" nunca aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (costCenter: CostCenterListItem) => {
    setToDelete(costCenter);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ costCenterUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<CostCenterListItem>();
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
      columnHelper.accessor('class_label', {
        header: text.list.table.class,
        cell: ({ row }) =>
          row.original.class === 1 ? (
            <Badge bg="classSyntheticBG" color="classSyntheticText" variant="subtle">
              {row.original.class_label}
            </Badge>
          ) : (
            <Badge colorPalette="green" variant="subtle">
              {row.original.class_label}
            </Badge>
          ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.class },
      }),
      columnHelper.accessor('condition_label', {
        header: text.list.table.condition,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.condition_label}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.condition },
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Flex align="center" gap={2} pl={row.original.parent ? 4 : 0}>
            <Icon as={FiFolder} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
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
              {/* TASK-FE-CC-09b — "Visualizar" abre a tela de detalhe
                  (TASK-FE-CC-09a), sempre disponível (mesmo padrão de
                  Safra/index.tsx: a leitura não é uma ação por-item DEC-005,
                  a própria rota de listagem já exige `costcenters_view`). */}
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() =>
                  navigate(`/cadastros-base/centros-custo/${row.original.uuid}/detalhe`)
                }
              >
                {text.list.actions.view}
              </Actions.Item>
              {row.original.can_create_descendant && (
                <Actions.Item
                  icon={<Icon as={FiGitBranch} />}
                  onClick={() =>
                    navigate(`/cadastros-base/centros-custo/novo/${row.original.uuid}`)
                  }
                >
                  {text.list.actions.createDescendant}
                </Actions.Item>
              )}
              {row.original.can_edit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/centros-custo/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {row.original.can_delete && (
                <>
                  {/* TASK-FE-CC-09b — "Visualizar" passou a ser sempre o
                      1º item (ver acima); o separador antes de Excluir deixa
                      de ser condicional a can_create_descendant/can_edit
                      (sempre há ao menos "Visualizar" acima dele agora). */}
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
    [navigate, isDeleting, languageGB.defaltStrings.actions, text]
  );

  const gridSettings = useGridSettings<CostCenterListItem>({
    storageKey: CENTRO_CUSTO_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([costCentersList]);
  const isError = costCentersList.isError;
  const items = costCentersList.data?.data?.items;
  const isEmpty = !isLoading && !isError && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      {/* De-dup de casca (achado desta leva): `ContainerGrid` agora ENTREGA
          a própria casca de card (compondo `PageCard`, ver
          `@/components/ContainerGrid`) — o `<PageCard><Box p={6}>` que esta
          tela envolvia por conta própria virou card-dentro-de-card. Removido;
          `TableProvider` passa a ser filho direto de `ContainerGrid`, mesmo
          padrão de `Perfil/index.tsx` (único CRUD já migrado antes desta
          leva) e das demais ~50 listagens. Overlays (drawer de filtro,
          dialog de exclusão) seguem FORA do card, como irmãos. */}
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
          <Table
            isLoading={isLoading}
            isError={isError}
            error={costCentersList.error}
            isEmpty={isEmpty}
            onRetry={() => costCentersList.refetch()}
            isRetrying={costCentersList.isFetching}
            emptyIcon={FiFolder as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmptyNoCreate
            }
          />
        </Box>
      </TableProvider>

      <FilterSideCentroCusto
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
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
        tone="danger"
      />
    </ContainerGrid>
  );
}
