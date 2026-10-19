// src/pages/BaseRegistrations/BirthNotes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL — padrão
// do projeto 10/página, per_page enviado dinamicamente ao back conforme
// pageSize do grid) de OBSERVAÇÃO NASCIMENTO (BirthNote) — Cadastros Base /
// Pecuária.
// Rota: /cadastros-base/observacao-nascimento (guardada por
// `birth_note_view`, registrada em src/router/index.tsx — TASK-FE-103 — este
// arquivo não mexe em rota/menu).
//
// `BirthNote` é a combinação exata que nenhuma tela-irmã tem sozinha:
// estrutura (drawer de filtro + `filtersApplied` + 2 variantes de empty
// state) mirror de `TecnicasDiagnostico/index.tsx`, adaptador de paginação
// REAL de `TiposIdentificacao/index.tsx` (o adaptador `listBirthNotes` já
// entrega paginação real por baixo):
//   - grid via useCustomGridQuery inline (paginação REAL);
//   - HeaderTable → botões de ação (Add respeita birth_note_create);
//   - FilterSideBirthNotes → drawer com SÓ `search` (D2 do Maestro
//     — nenhum Select de is_enabled, aditivo no backend, não pedido);
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     birth_note_delete; onError GENÉRICO do useRequest — D6, nunca 422 por
//     FK nesta tela).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
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

import { deleteBirthNote, listBirthNotes } from '@/services/v2/BaseRegistrations/birthNote-service';

import type {
  BirthNoteFilterForm,
  BirthNoteListItem,
} from '@/@types/v2/BaseRegistrations/birthNote';

import { FilterSideBirthNotes } from './FilterSideBirthNotes';
import { HeaderTable } from './HeaderTable';

// Chave estável de storage da personalização de grid desta tela (mesmo padrão
// de CadastrosBase/CentroCusto/index.tsx).
const BIRTH_NOTES_GRID_STORAGE_KEY = 'GBCerneBaseRegistrationsBirthNotes';

export default function BirthNotesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.birthNote;
  // `UserProfileV2` não declara `uuid`; `user_id` é o identificador estável
  // disponível para compor o escopo da preferência (mesmo racional de
  // CadastrosBase/CentroCusto/index.tsx).

  const canCreate = can('birth_note_create');
  const canEdit = can('birth_note_edit');
  const canDelete = can('birth_note_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.birthNotes,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BirthNoteFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<BirthNoteListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const birthNotesList = useCustomGridQuery<BirthNoteListItem, BirthNoteFilterForm>({
    asyncFunction: listBirthNotes,
    queryKey: queryKey.baseRegistrations.birthNotes,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as BirthNoteFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ birthNoteUuid }: { birthNoteUuid: string }) => {
      return await deleteBirthNote(birthNoteUuid);
    },
    queryKey: queryKey.baseRegistrations.birthNotes,
    queryKey2: queryKey.baseRegistrations.birthNote,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // IdentificationType/DiagnosticTechnique para a mesma operação. O texto
    // exibido no toast vem de `personalizedMessage`, então o rótulo genérico
    // associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest. D6 do contrato de API (§6): DELETE é físico direto, sem
    // guarda de FK — nunca ocorre 422 "em uso" nesta tela (diferente de
    // IdentificationType/Vaccine).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (birthNote: BirthNoteListItem) => {
    setToDelete(birthNote);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ birthNoteUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<BirthNoteListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        meta: { gridLabel: text.list.table.description },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.active : text.list.table.inactive}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.status },
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
                    navigate(`/cadastros-base/observacao-nascimento/${row.original.uuid}`)
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

  const gridSettings = useGridSettings<BirthNoteListItem>({
    storageKey: BIRTH_NOTES_GRID_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([birthNotesList]);
  const items = birthNotesList.data?.data?.items;
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
            isError={birthNotesList.isError}
            error={birthNotesList.error}
            isEmpty={isEmpty}
            onRetry={() => birthNotesList.refetch()}
            isRetrying={birthNotesList.isFetching}
            emptyIcon={FiFileText as ElementType}
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
            onCreate={() => navigate('/cadastros-base/observacao-nascimento/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideBirthNotes
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
