// src/pages/BaseRegistrations/Grazings/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL, SEM
// filtro — o legado não tem busca, `Grazing-Doc-Bruta.md §7` item 1, COM
// ações Editar/Excluir) do Módulo Pastejo (Grazing) — Cadastros Base /
// Pecuários.
// Rota: /cadastros-base/modulo-pastejo (guardada por `grazing_view`,
// registrada nesta Tarefa, TASK-GZ-FE-01, ANTES do catch-all
// /cadastros-base/*).
//
// Molde estrutural PRIMÁRIO: `Fodders/index.tsx` (mesmo domínio Pecuária,
// mesma decisão "sem filtro", painel de personalização de colunas
// (`useGridSettings`/`useGridStorageScope`) LIGADO desde o início,
// `Grazing-FrontEnd-contrato.md §4.2`).
//
// Exclusão (095): `useRequest` (typesRequest 'update', toast `deletedToast`). A API
// devolve 422 genérico (`errors:null`) quando há vínculos e o toast do
// `useRequest` exibe a `message` da API; não há mais diálogo de vínculos.
//
// Colunas incluem os agregados `areas_count`/`areas_sum_total_area`
// (calculados no backend, `GrazingResource`). Sem coluna de responsável: o
// legado não tinha (`grazing/index.blade.php:25-30`) e o funcionário saiu do
// módulo (TASK-PES-PAS-FE).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Map } from 'lucide-react';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { controlProductivityOptions } from '@/constants/Grazing/options/control-productivity-options';
import { queryKey } from '@/constants/query-key';

import { deleteGrazing, listGrazings } from '@/services/v2/BaseRegistrations/grazings-service';

import type { GrazingListItem } from '@/@types/v2/BaseRegistrations/grazings';

import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// estável para nunca divergirem — mirror `Fodders/index.tsx`,
// `Grazing-FrontEnd-contrato.md §4.2`.
const GRAZINGS_STORAGE_KEY = 'BaseRegistrationsGrazings' + queryKey.baseRegistrations.grazings;

export default function GrazingsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.grazing;

  const canCreate = can('grazing_create');
  const canEdit = can('grazing_edit');
  const canDelete = can('grazing_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: GRAZINGS_STORAGE_KEY,
    }),
    []
  );

  // pageSize 10 = paginação REAL, per_page dinâmico, enviado ao back conforme
  // o pageSize escolhido no grid (backend ordena `code desc`). SEM filtro —
  // o legado não tem busca (Doc Bruta §7 item 1). Sem `GrazingFilterForm`: o
  // filtro genérico do TanStack Query exige um tipo de objeto, satisfeito
  // aqui por `Record<string, never>` (nenhuma chave de negócio, nenhum
  // filtro criado).
  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<Record<string, never>>(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<GrazingListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const grazingsList = useCustomGridQuery<GrazingListItem, Record<string, never>>({
    asyncFunction: listGrazings,
    queryKey: queryKey.baseRegistrations.grazings,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as Record<string, never>),
  });

  const deleteMutation = useRequest({
    asyncFunction: async (grazingUuid: string) => {
      await deleteGrazing(grazingUuid);
      return undefined;
    },
    queryKey: queryKey.baseRegistrations.grazings,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  const handleDeleteClick = (grazing: GrazingListItem) => {
    setToDelete(grazing);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      // 422 (vínculos): o toast do `useRequest` exibe a `message` da API; aqui
      // só fecha o diálogo e mantém o item na lista.
      deleteMutation.mutate(toDelete.uuid, {
        onError: () => {
          onCloseDeleteDialog();
          setToDelete(null);
        },
      });
    }
  };

  const columnHelper = createColumnHelper<GrazingListItem>();
  const defaultColumns = useMemo(
    () => [
      // Coluna-âncora — ordenação natural do backend é `code desc`
      // (`Grazing-FrontEnd-contrato.md §4.1`).
      columnHelper.accessor('code', {
        header: text.list.table.code,
        enableHiding: false,
        meta: { gridLabel: text.list.table.code },
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false, // coluna-âncora — nunca ocultável
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      // `fodder` vem eager-carregado do backend, mas pode ser `null` — nunca
      // acessar `.description` sem `?.`.
      columnHelper.accessor((row) => row.fodder?.description, {
        id: 'fodder',
        header: text.list.table.fodder,
        meta: { gridLabel: text.list.table.fodder },
        cell: ({ row }) => <Text fontSize="sm">{row.original.fodder?.description ?? '—'}</Text>,
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        meta: { gridLabel: text.list.table.date },
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
      }),
      // Swatch de cor — `color` É um dado de negócio, não estilo de UI (mesma
      // exceção já aplicada em `StepDemarcacao.tsx` `polygonColor`).
      columnHelper.accessor('color', {
        header: text.list.table.color,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.color },
        cell: ({ row }) => (
          <Box
            boxSize="20px"
            borderRadius="md"
            bg={row.original.color}
            border="1px solid"
            borderColor="border.subtle"
          />
        ),
      }),
      // Badge Sim/Não via fábrica `controlProductivityOptions` — NUNCA
      // `campo || false` (item 19 do checklist), o valor já vem tipado
      // `boolean` do backend.
      columnHelper.accessor('control_productivity', {
        header: text.list.table.controlProductivity,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.controlProductivity },
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.control_productivity ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {controlProductivityOptions.getLabel(row.original.control_productivity, languageGB)}
          </Badge>
        ),
      }),
      // Agregados do backend (`GrazingResource`) — `0` é um valor legítimo
      // (Pastejo recém-criado com 1 Área pequena); NUNCA `campo || '-'`,
      // checagem explícita de `null`/`undefined` (item 19 do checklist).
      columnHelper.accessor('areas_count', {
        header: text.list.table.areasCount,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.areasCount },
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.areas_count === null || row.original.areas_count === undefined
              ? '—'
              : row.original.areas_count}
          </Text>
        ),
      }),
      columnHelper.accessor('areas_sum_total_area', {
        header: text.list.table.areasSum,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.areasSum },
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.areas_sum_total_area === null ||
            row.original.areas_sum_total_area === undefined
              ? '—'
              : `${row.original.areas_sum_total_area} ha`}
          </Text>
        ),
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
                  onClick={() => navigate(`/cadastros-base/modulo-pastejo/${row.original.uuid}`)}
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

  const gridSettings = useGridSettings<GrazingListItem>({
    storageKey: GRAZINGS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([grazingsList]);
  const items = grazingsList.data?.data?.items;
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
        <HeaderGrid header={<HeaderTable languageGB={languageGB} gridSettings={gridSettings} />}>
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={grazingsList.isError}
            error={grazingsList.error}
            isEmpty={isEmpty}
            onRetry={() => grazingsList.refetch()}
            isRetrying={grazingsList.isFetching}
            emptyIcon={Map}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/modulo-pastejo/novo')}
          />
        </Box>
      </TableProvider>

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
