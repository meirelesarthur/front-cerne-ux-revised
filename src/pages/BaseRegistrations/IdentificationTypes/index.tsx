// src/pages/BaseRegistrations/IdentificationTypes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, COM paginação REAL — padrão
// do projeto 10/página, per_page enviado dinamicamente ao back conforme
// pageSize do grid —, SEM filtro, COM ações Editar/Excluir) de TIPOS DE
// IDENTIFICAÇÃO (IdentificationType) — Cadastros Base / Pecuários.
// Rota: /cadastros-base/tipos-identificacao (guardada por `idanimal_view`,
// registrada em TASK-FE-040 — este arquivo não mexe em rota/menu).
//
// Fidelidade ao legado (TASK-FE-038, âncora Doc Bruta §6 regra 1
// `identification-types/index.blade.php`): grade legada com EXATAMENTE 3
// colunas (Descrição | Ativo | Ação), SEM filtro nenhum. Estrutura aqui é a
// INTERSEÇÃO de 2 telas-irmãs: `Estados/index.tsx` (paginação REAL, ZERO
// FilterSide) fornece o desenho sem drawer; `TecnicasDiagnostico/index.tsx`
// fornece a coluna de Ações (Editar/Excluir) e o delete via
// `DeleteConfirmDialog`:
//   - grid via `useCustomGridQuery` inline (paginação REAL — TASK-FE-037, o
//     adaptador `listIdentificationTypes` lê `data.meta.*` de verdade, mesmo
//     racional de useStatesList);
//   - HeaderTable → SÓ botão Add (SEM ButtonFilter — decisão de fidelidade,
//     não-negociável, diferente de TecnicasDiagnostico/Activity);
//   - SEM FilterSide (não existe nesta tela);
//   - delete via useRequest + DeleteConfirmDialog (respeita idanimal_delete;
//     onError GENÉRICO do useRequest — 422 estruturado por FK, §6 do
//     contrato de API).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTag, FiTrash2 } from 'react-icons/fi';
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
  deleteIdentificationType,
  listIdentificationTypes,
} from '@/services/v2/BaseRegistrations/identificationTypes-service';

import type {
  IdentificationTypeFilterForm,
  IdentificationTypeListItem,
} from '@/@types/v2/BaseRegistrations/identificationTypes';

import { HeaderTable } from './HeaderTable';

import { PageHeader } from '@/components/ui/PageHeader';

// Chave de storage desta tela. Paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão estável
// para nunca divergirem (DEC-007 §12) — nada de literal cru repetido nem de
// prefixo dependente de locale.
const IDENTIFICATION_TYPES_STORAGE_KEY =
  'BaseRegistrationsIdentificationTypes' + queryKey.baseRegistrations.identificationTypes;

export default function IdentificationTypesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.identificationType;

  const canCreate = can('idanimal_create');
  const canEdit = can('idanimal_edit');
  const canDelete = can('idanimal_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: IDENTIFICATION_TYPES_STORAGE_KEY,
    }),
    []
  );

  // pageSize 10 = paginação REAL (TASK-FE-037) — per_page dinâmico, enviado ao
  // back conforme o pageSize escolhido no grid (5/10/25/50/100). SEM filtro —
  // decisão de fidelidade ao legado, não-negociável (ver "Leitura do dev" da
  // Tarefa).
  const { paginatedQuery, handlePaginatedQuery } =
    userPaginatedQuery<IdentificationTypeFilterForm>(defaultQueryOptions);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<IdentificationTypeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const identificationTypesList = useCustomGridQuery<
    IdentificationTypeListItem,
    IdentificationTypeFilterForm
  >({
    asyncFunction: listIdentificationTypes,
    queryKey: queryKey.baseRegistrations.identificationTypes,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as IdentificationTypeFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ identificationTypeUuid }: { identificationTypeUuid: string }) => {
      return await deleteIdentificationType(identificationTypeUuid);
    },
    queryKey: queryKey.baseRegistrations.identificationTypes,
    queryKey2: queryKey.baseRegistrations.identificationType,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // DiagnosticTechnique/Species/LowReason para a mesma operação. O texto
    // exibido no toast vem de `personalizedMessage`, então o rótulo genérico
    // associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). O 422 estruturado por
    // BusinessRuleException (FK animal_id_animal/birth_animal_id_animal, D3
    // §6 do contrato de API) já traz `message` clara — mesmo tratamento de
    // DiagnosticTechnique/Species.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (identificationType: IdentificationTypeListItem) => {
    setToDelete(identificationType);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ identificationTypeUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<IdentificationTypeListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.table.description,
        enableHiding: false,
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
                    navigate(`/cadastros-base/tipos-identificacao/${row.original.uuid}`)
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
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<IdentificationTypeListItem>({
    storageKey: IDENTIFICATION_TYPES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([identificationTypesList]);
  const items = identificationTypesList.data?.data?.items;
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
            isError={identificationTypesList.isError}
            error={identificationTypesList.error}
            isEmpty={isEmpty}
            onRetry={() => identificationTypesList.refetch()}
            isRetrying={identificationTypesList.isFetching}
            emptyIcon={FiTag as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/tipos-identificacao/novo')}
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
