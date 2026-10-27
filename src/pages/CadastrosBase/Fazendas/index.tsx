// src/pages/CadastrosBase/Fazendas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) administrativa de FAZENDAS — Cadastros Base
// (execução 024, `TASK-FE-401`). Rota: /cadastros-base/fazendas (guardada por
// `farms_view`, wiring de rota real em `TASK-FE-404` — o menu `cad-est-faz`
// já existe apontando hoje para o `RoutePlaceholder`).
//
// Fidelidade ao `cerne` (`FazendasLista.tsx`, commit `305e10e3`), ADAPTADA:
// SEM a KPI bar — mirror do padrão consolidado do fork
// (`ContainerGrid`/`HeaderGrid`/`Table`), estrutura idêntica a
// `FamiliaBens/index.tsx`/`CentroCusto/index.tsx`.
//
// TASK-FE-416 (F-348/UT-000446, esteira 067) — acrescenta a hierarquia
// expansível fazenda→áreas (`AreasSubList`, SURF-01/02/03 do contrato de
// tela): cada linha de Fazenda expande (`Table.rowSubComponent`, mirror
// `Frota/Manutencoes/index.tsx`) e mostra suas Áreas. Menu da Fazenda ganha
// "Adicionar Área"/"Adicionar Múltiplas Áreas" (destino ainda não construído,
// 419/420/421 — `area-routes.ts` é a fonte única do path).
//
// `FarmDetailResource` é o MESMO Resource usado no `index()` paginado E no
// `show()` — não existe um `FarmListItem` mais enxuto no backend real (ver
// nota em `@/@types/v2/Farms/farm-admin.d.ts`). Coluna "Contratante" só exibe
// o ID numérico do tenant (`tenant.id`) — o Resource nunca expõe
// `tenant.name`/`tenant.uuid` (dívida técnica documentada na classe do
// Resource; Model `Tenant` ainda sem `HasUuids`) — condicionada a
// `Gestor_Plataf` (GAP-FE-122).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo, useState } from 'react';

import { Alert, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Warehouse } from 'lucide-react';
import { FiEdit, FiEye, FiLayers, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';
import { NO_FARM_NOTICE_STATE_KEY } from '@/constants/routes/no-farm-allowed-routes';

import { deleteFarm } from '@/services/v2/Farms/farm-admin-service';

import type { FarmDetail, FarmFilterForm } from '@/@types/v2/Farms/farm-admin';

import { FilterSideFazendas } from './FilterSideFazendas';
import { HeaderTable } from './HeaderTable';
import { useFarmsList } from './useFarms';

import { areaCreateMultipleRoute, areaCreateRoute } from '../Areas/area-routes';
import { AreasSubList } from '../Areas/AreasSubList';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Tipo de exploração (1..6) → variante do Badge do kit (DS). Ordem estável, sem semântica de negócio.
const EXPLORATION_VARIANTS: Record<number, BadgeVariant> = {
  1: 'success',
  2: 'info',
  3: 'warning',
  4: 'purple',
  5: 'cyan',
  6: 'neutral',
};

export default function FarmsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { can, hasRole } = usePermissions();
  const text = languageGB.farms.farm;

  // TASK-072-FE-11 — aviso inline (não toast, para não repetir a cada
  // redirect) quando o guard "contratante sem fazenda" trouxe o usuário para
  // cá. O `location.state` é limpo em seguida (replace) para o aviso não
  // voltar num F5/voltar; o estado de UI local mantém o aviso nesta visita.
  const hasNoFarmNoticeState = Boolean(
    (location.state as Record<string, unknown> | null)?.[NO_FARM_NOTICE_STATE_KEY]
  );
  const [showNoFarmNotice, setShowNoFarmNotice] = useState(hasNoFarmNoticeState);
  useEffect(() => {
    if (!hasNoFarmNoticeState) return;
    setShowNoFarmNotice(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [hasNoFarmNoticeState, location.pathname, navigate]);

  const canEdit = can('farms_edit');
  const canView = can('farms_view');
  const canDelete = can('farms_delete');
  // TASK-FE-416 — "Adicionar Área"/"Adicionar Múltiplas Áreas" (menu da
  // Fazenda, SURF-04/05) reusam o slug de Fazenda (RBAC endurecido, DEC-006
  // — a criação de Área é `farm_uuid`-scoped, não depende de `tenant_id`
  // como a criação de Fazenda, então NÃO herda a exceção `Gestor_Plataf` do
  // CTA principal abaixo).
  const canCreateArea = can('farms_create');
  // GAP-FE-122 — coluna/filtro de Contratante só para Gestor_Plataf (papel de
  // plataforma; a responsabilidade de ESCOPAR os dados por tenant é do
  // backend — esta tela só decide EXIBIR ou não).
  const isGestorPlataf = hasRole('Gestor_Plataf');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseFazendas' + queryKey.farms.farmsAdminList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<FarmFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) --------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão ----------------------------------------------------
  const [toDelete, setToDelete] = useState<FarmDetail | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const farmsList = useFarmsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ farmUuid }: { farmUuid: string }) => {
      return await deleteFarm(farmUuid);
    },
    queryKey: queryKey.farms.farmsAdminList,
    queryKey2: queryKey.farms.farmsAdminDetail,
    // Convenção do fork para delete — ver `FamiliaBens/index.tsx`.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  function handleDeleteClick(farm: FarmDetail) {
    setToDelete(farm);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ farmUuid: toDelete.uuid });
    }
  }

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<FarmDetail>();
  const defaultColumns = useMemo(() => {
    const tenantColumn = columnHelper.display({
      id: 'tenant',
      header: text.list.table.tenant,
      cell: ({ row }) => (
        <Text fontSize="sm" color="fg.muted">
          {row.original.tenant ? `#${row.original.tenant.id}` : '—'}
        </Text>
      ),
      meta: styleColumTable.sm,
    });

    return [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'city',
        header: text.list.table.city,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.town
              ? [row.original.town.name, row.original.town.state].filter(Boolean).join(' — ')
              : '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'exploration_type',
        header: text.list.table.explorationType,
        cell: ({ row }) =>
          row.original.exploration_type ? (
            <Badge
              variant={EXPLORATION_VARIANTS[row.original.exploration_type.value] ?? 'neutral'}
              label={row.original.exploration_type.label}
            />
          ) : (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('total_area', {
        header: text.list.table.totalArea,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.total_area?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ha
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // GAP-FE-122 — coluna "Contratante" só para Gestor_Plataf. Resource
      // nunca expõe `tenant.name` (dívida técnica documentada em
      // `FarmDetailResource` — Tenant ainda sem UUID) — exibe só o ID.
      ...(isGestorPlataf ? [tenantColumn] : []),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            variant={row.original.is_enabled ? 'success' : 'neutral'}
            label={row.original.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
          />
        ),
        meta: styleColumTable.sm,
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
                  onClick={() => navigate(`/cadastros-base/fazendas/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {!canEdit && canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/cadastros-base/fazendas/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
                </Actions.Item>
              )}
              {/* TASK-FE-416 (SURF-04/05) — destino ainda não construído
                  (TASK-FE-419/420 single, TASK-FE-421 múltiplas); rota
                  planejada via `area-routes.ts` (cai no `RoutePlaceholder`
                  até TASK-FE-422 registrar a rota real, sem quebrar o build). */}
              {canCreateArea && (
                <Actions.Item
                  icon={<Icon as={FiPlus} />}
                  onClick={() => navigate(areaCreateRoute(row.original.uuid))}
                >
                  {text.list.actions.addArea}
                </Actions.Item>
              )}
              {canCreateArea && (
                <Actions.Item
                  icon={<Icon as={FiLayers} />}
                  onClick={() => navigate(areaCreateMultipleRoute(row.original.uuid))}
                >
                  {text.list.actions.addMultipleAreas}
                </Actions.Item>
              )}
              {/* "Alterar Contratante" — fora do escopo desta fatia (§20.2
                  do contrato); nenhuma ação de linha para `farms_change_tenant`
                  nesta Tarefa, registrada como melhoria futura. */}
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
        meta: styleColumTable.sm,
      }),
    ];
  }, [navigate, isDeleting, text, canEdit, canView, canDelete, canCreateArea, isGestorPlataf]);

  const isLoading = checkLoadingStatus([farmsList]);
  const items = farmsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        // TASK-FE-416 — toda fazenda é expansível. Refinamento (2 pontos do
        // dono, mesma esteira): a sub-lista (`AreasSubList.tsx`) NÃO tem mais
        // query própria — consome `farm.areas` (subconjunto enxuto, `with()`,
        // SEM paginação) já embutido no PRÓPRIO objeto `FarmDetail` desta
        // grid, mirror `MaintenanceItemsSubRow`. `enableMultiRowSelection=
        // false` acima garante no máximo UMA fazenda expandida por vez — a
        // MESMA seleção de linha do TanStack Table já usada para toggle de
        // expansão (mirror `Frota/Manutencoes/index.tsx`), sem estado novo.
        getRowCanExpand={() => true}
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

        {showNoFarmNotice && (
          <Alert.Root status="info" borderRadius="md" mt={4} role="status">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{text.list.noFarmNotice}</Alert.Title>
            </Alert.Content>
          </Alert.Root>
        )}

        <Box>
          <Table
            isLoading={isLoading}
            isError={farmsList.isError}
            error={farmsList.error}
            isEmpty={isEmpty}
            onRetry={() => farmsList.refetch()}
            isRetrying={farmsList.isFetching}
            emptyIcon={Warehouse as ElementType}
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
            // Gestor_Plataf NÃO vê o CTA — mesma razão do HeaderTable.tsx:
            // `FarmRequest` exige `tenant_id` explícito no payload para este
            // papel e a tela de criação não o expõe; o botão levaria a um
            // fluxo que nunca conclui. Pedido do dev, 2026-07-31.
            canCreate={filtersApplied === 0 && can('farms_create') && !hasRole('Gestor_Plataf')}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/fazendas/novo')}
            rowSubComponent={({ row }) => <AreasSubList farm={row.original} />}
          />
        </Box>
      </TableProvider>

      <FilterSideFazendas
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
        isLoading={isDeleting}
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
