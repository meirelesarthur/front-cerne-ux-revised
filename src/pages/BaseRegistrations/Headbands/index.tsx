// src/pages/BaseRegistrations/Headbands/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM de Testeiras (Headband) — módulo de menu Configurações.
// TASK-HB-FE-03. Rota `/configuracoes/testeiras` (migrada do antigo path em
// Cadastros Base em 97-Esteiras/019, instrução literal do dono 2026-08-05)
// — registrada em `TASK-HB-FE-04`; este arquivo não mexe em
// router/menu.
//
// Estrutura mirror `BaseRegistrations/DiagnosisPregnancy/index.tsx` (grid
// flat, paginação REAL de servidor) + canário `CadastrosBase/CentroCusto/
// index.tsx` (uso de `useGridSettings`/`GridSettingsFloatingPanel`, mandato
// explícito do task-packet mesmo `DiagnosisPregnancy` não usando).
//
// Catálogo GLOBAL (SEM `X-Farm-Id`, Headband-contrato.md DA-HB-03) — `type`
// (Central/Logo Parceiros) e `partner_uuid` (filtro administrativo, pela
// PIVOT `partners`, §11) vão como query params, tratados em
// `headband-service.ts`/`useHeadbands.tsx`.
//
// `type_label` já vem TRADUZIDO pela API (`HeadbandResource`) — a coluna da
// grid usa DIRETO o valor do backend, sem re-traduzir com a fábrica local
// (`headbandTypeOptions` existe e é usada só no FILTRO, onde é preciso
// enviar o slug `c`/`p` cru para a querystring). Evita duplicar/divergir a
// tradução entre front e backend para o mesmo dado de leitura.
//
// `partner_uuid` (vínculo ÚNICO, coluna direta) NÃO tem coluna própria nesta
// grid — não faz parte do contrato de colunas da tarefa, e fundi-lo com
// `partners` (N:N) violaria a distinção exigida entre os dois vínculos
// independentes (Headband-contrato.md DA-HB-11, 2ª exceção do gate).
// `partners` (nomes da pivot) é a ÚNICA coluna de vínculo com Afiliado
// exibida na grid.
//
// Exclusão SEM guarda de dependência — `destroy()` é 204 direto
// (Headband-contrato.md §4.4: CASCADE automático na pivot, nenhuma outra
// tabela referencia `headbands.id`) — `DeleteConfirmDialog` padrão, sem
// tratamento/aviso especial (decisão de produto fechada no gate, DA-HB-12).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, Flex, Icon, Image, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiImage, FiTrash2 } from 'react-icons/fi';
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
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteHeadband } from '@/services/v2/BaseRegistrations/headband-service';

import type { HeadbandListItem, HeadbandsFilterForm } from '@/@types/v2/BaseRegistrations/headband';

import { FilterSideHeadband } from './FilterSideHeadband';
import { HeaderTable } from './HeaderTable';
import { useHeadbandsList } from './useHeadbands';

import { PageHeader } from '@/components/ui/PageHeader';

// Thumbnail com fallback local (Chakra v3 `Image` não tem prop `fallback`) —
// mirror `FamilyEquipmentThumbnail` (`BaseRegistrations/FamilyEquipments/
// index.tsx`). O contrato garante `image_url` sempre preenchido, mas o front
// trata erro de carregamento defensivamente, não assume 100% de
// disponibilidade de rede.
function HeadbandThumbnail({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);
  const showPlaceholder = !imageUrl || hasError;

  if (showPlaceholder) {
    return (
      <Flex
        boxSize="8"
        align="center"
        justify="center"
        borderRadius="sm"
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
      boxSize="8"
      borderRadius="sm"
      objectFit="cover"
      flexShrink={0}
      onError={() => setHasError(true)}
    />
  );
}

export default function HeadbandsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can('headbands_create');
  const canEdit = can('headbands_edit');
  const canDelete = can('headbands_delete');

  // Paginação (`userPaginatedQuery`) e personalização de grid
  // (`useGridSettings`) derivam da MESMA expressão de chave para nunca
  // divergirem (DEC-007 §12, mirror DiagnosisPregnancy/FamilyEquipments).
  const headbandsStorageKey =
    languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.headbands;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: headbandsStorageKey,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<HeadbandsFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<HeadbandListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const headbandsList = useHeadbandsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ headbandUuid }: { headbandUuid: string }) => {
      return await deleteHeadband(headbandUuid);
    },
    queryKey: queryKey.baseRegistrations.headbands,
    queryKey2: queryKey.baseRegistrations.headband,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/
    // create/apply/export/revoke/restore) — "update" é a mesma convenção de
    // DiagnosisPregnancy/CentroCusto para a mesma operação. O texto exibido
    // no toast vem de `personalizedMessage`, então o rótulo genérico
    // associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — `destroy()` é 204 direto, sem 422 de
    // dependência a tratar (Headband-contrato.md §4.4); o fallback genérico
    // do `useRequest` já cobre 403/500.
    typesRequest: 'update',
    entityName: languageGB.baseRegistrations.headband.singularLabel,
    personalizedMessage: languageGB.baseRegistrations.headband.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (headband: HeadbandListItem) => {
    setToDelete(headband);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ headbandUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<HeadbandListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('position', {
        header: languageGB.baseRegistrations.headband.list.table.position,
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.baseRegistrations.headband.list.table.position,
        },
      }),
      columnHelper.accessor('description', {
        header: languageGB.baseRegistrations.headband.list.table.description,
        enableHiding: false,
        meta: { gridLabel: languageGB.baseRegistrations.headband.list.table.description },
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <HeadbandThumbnail imageUrl={row.original.image_url} alt={row.original.description} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: languageGB.baseRegistrations.headband.list.table.type,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.type_label}
          </Text>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.baseRegistrations.headband.list.table.type,
        },
      }),
      columnHelper.display({
        id: 'partners',
        header: languageGB.baseRegistrations.headband.list.table.partners,
        meta: { gridLabel: languageGB.baseRegistrations.headband.list.table.partners },
        cell: ({ row }) =>
          row.original.partners.length > 0 ? (
            <Text fontSize="sm" lineClamp="1">
              {row.original.partners.map((partner) => partner.name).join(', ')}
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              {languageGB.baseRegistrations.headband.list.table.partnersNone}
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
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/configuracoes/testeiras/${row.original.uuid}`)}
                >
                  {languageGB.baseRegistrations.headband.list.actions.edit}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  tone="danger"
                  disabled={isDeleting}
                >
                  {languageGB.baseRegistrations.headband.list.actions.delete}
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
    [navigate, isDeleting, languageGB, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<HeadbandListItem>({
    storageKey: headbandsStorageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([headbandsList]);
  const items = headbandsList.data?.data?.items;
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
          <PageHeader title={languageGB.baseRegistrations.headband.list.pageTitle} description={languageGB.baseRegistrations.headband.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={headbandsList.isError}
            error={headbandsList.error}
            isEmpty={isEmpty}
            onRetry={() => headbandsList.refetch()}
            isRetrying={headbandsList.isFetching}
            emptyIcon={FiImage as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? languageGB.baseRegistrations.headband.list.emptyState.titleFiltered
                : languageGB.baseRegistrations.headband.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? languageGB.baseRegistrations.headband.list.emptyState.descriptionFiltered
                : languageGB.baseRegistrations.headband.list.emptyState.descriptionEmpty
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={languageGB.baseRegistrations.headband.list.emptyState.cta}
            onCreate={() => navigate('/configuracoes/testeiras/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideHeadband
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
        tone="danger"
      />
    </ContainerGrid>
  );
}
