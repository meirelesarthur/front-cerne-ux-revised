// src/pages/BaseRegistrations/Parameters/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PARÂMETROS — Configurações, execução 031,
// TASK-FE-031-41. Rota: /configuracoes/parametros (guardada por
// `parameters_view`, wiring real da rota é TASK-FE-031-43).
//
// Estrutura mirror `CadastrosBase/CentroCusto/index.tsx` (ações por linha com
// curto-circuito JSX, `useGridSettings`+`GridSettingsFloatingPanel`) — NÃO o
// padrão mais antigo de `Headbands/index.tsx` (só Editar/Excluir, sem
// Visualizar): Parâmetros PRECISA da ação Visualizar (TASK-FE-031-43).
//
// Proteção de nomes reservados (GAP-BE-511-parameters, decisão do dono
// 2026-08-06: [APROVADO — Opção A], REVISADA pela correção pós-E2E rodada 1,
// C3 — correcoes-e2e-dev-rodada-1.md): as ações "Editar" E "Excluir" ficam
// OCULTAS (curto-circuito JSX, nunca `disabled` cru) para os 5 nomes
// reservados via `isReservedParameterName` — nunca hardcoded aqui (contrato
// §5/§9). Reservados são SOMENTE VISUALIZAÇÃO na UI, só "Visualizar"
// permanece. Um tooltip/badge ao lado do Nome explica a ausência, para não
// parecer bug.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { ElementType } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiEye, FiLock, FiSliders, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Tooltip } from '@/components/TooLtip';

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
import { isReservedParameterName } from '@/constants/reserved-parameter-names';

import { deleteParameter, listParameters } from '@/services/v2/BaseRegistrations/parameter-service';

import type {
  ParameterFilterForm,
  ParameterListItem,
} from '@/@types/v2/BaseRegistrations/Parameters';

import { FilterSideParameters } from './FilterSideParameters';
import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão para
// nunca divergirem (mirror `CENTRO_CUSTO_STORAGE_KEY`).
const PARAMETERS_STORAGE_KEY = 'ConfiguracoesParameters' + queryKey.parameters.list;

export default function ParametersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.parameters.parameter;

  const canCreate = can('parameters_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10, // per_page inicial 10 — contrato de API §9 (harmoniza a divergência do legado).
      storageKey: PARAMETERS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ParameterFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<ParameterListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const parametersList = useCustomGridQuery<ParameterListItem, ParameterFilterForm>({
    asyncFunction: listParameters,
    queryKey: queryKey.parameters.list,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as ParameterFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ parameterUuid }: { parameterUuid: string }) => {
      return await deleteParameter(parameterUuid);
    },
    queryKey: queryKey.parameters.list,
    queryKey2: queryKey.parameters.detail,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (parameter: ParameterListItem) => {
    setToDelete(parameter);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ parameterUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ParameterListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        meta: { ...styleColumTable.md, gridLabel: text.list.table.name },
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
              {row.original.name}
            </Text>
            {isReservedParameterName(row.original.name) && (
              <Tooltip label={text.list.reservedTooltip}>
                <Box display="inline-flex">
                  <Icon as={FiLock} boxSize={3.5} color="fg.muted" />
                </Box>
              </Tooltip>
            )}
          </Flex>
        ),
      }),
      columnHelper.accessor('value', {
        header: text.list.table.value,
        meta: { ...styleColumTable.md, gridLabel: text.list.table.value },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.default">
            {row.original.value}
          </Text>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
        cell: ({ row }) => (
          <Badge colorPalette="gray" variant="subtle">
            {row.original.type_label}
          </Badge>
        ),
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.description || '—'}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/configuracoes/parametros/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {/* CORREÇÃO PÓS-E2E (rodada 1, C3): reservados são SOMENTE
                  VISUALIZAÇÃO — "Editar" fica OCULTO (mesmo curto-circuito
                  JSX de "Excluir" logo abaixo), nunca a lista hardcoded aqui.
                  Revisa a decisão anterior de GAP-BE-511-parameters Opção A
                  (que ainda previa `value`/`type`/`description` editáveis
                  nos reservados) — `CreateOrUpdateParameters.tsx` também
                  redireciona para o Detalhe em defesa de profundidade caso a
                  rota de edição seja alcançada por URL direta. */}
              {!isReservedParameterName(row.original.name) && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/configuracoes/parametros/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {/* GAP-BE-511-parameters ([APROVADO — Opção A], 2026-08-06):
                  "Excluir" fica OCULTO para os 5 nomes reservados —
                  `isReservedParameterName`, nunca a lista hardcoded aqui. Se o
                  backend futuramente expuser `is_reserved` no
                  `ParameterResource`, trocar por `row.original.is_reserved`. */}
              {!isReservedParameterName(row.original.name) && (
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
    [navigate, isDeleting, languageGB.defaltStrings.actions, text]
  );

  const gridSettings = useGridSettings<ParameterListItem>({
    storageKey: PARAMETERS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([parametersList]);
  const items = parametersList.data?.data?.items;
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
            isError={parametersList.isError}
            error={parametersList.error}
            isEmpty={isEmpty}
            onRetry={() => parametersList.refetch()}
            isRetrying={parametersList.isFetching}
            emptyIcon={FiSliders as ElementType}
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
            onCreate={() => navigate('/configuracoes/parametros/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideParameters
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
        itemName={toDelete?.name}
        tone="danger"
      />
    </ContainerGrid>
  );
}
