// src/pages/CadastrosBase/NaturezaOperacao/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia, sem FK na listagem) de
// NATUREZA DE OPERAÇÃO (NatureOperation) — Cadastros Base / Fiscais.
// Rota: /cadastros-base/natureza-operacao (guardada por `natop_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
// Destrava o item de menu `cad-fis-nat` (antes um link morto, sem
// `<Route>` correspondente).
//
// Referência UX: não existe tela oficial de "Natureza de Operação"/"Fiscal"
// no design system `cerne` (UX-GAP declarado na Tarefa) — resolvido por
// precedente MATERIALIZADO no próprio frontend_root (decisão do dono):
// molde estrutural = CadastrosBase/InfoComplementares/index.tsx (grid flat +
// delete BLOQUEADO, mesmo grupo "Fiscais", mesmo formato de 422) +
// CadastrosBase/RegrasFiscais/index.tsx (molde principal — estrutura de
// grid/HeaderTable/FilterSide/delete via useRequest, mesmo domínio Fiscal).
//
// Colunas: code | descricao | tipo (Badge, TipoOperacaoEnum::label() do
// backend: 0=Entrada, 1=Saída) | ativo (Badge verde/cinza) | ações.
//
// Exclusão BLOQUEADA: `DeleteNatureOperationAction` (guarda dupla
// dependencyUsageCounts()+catch 23503) retorna 422 "em uso" quando a
// Natureza de Operação está referenciada por CT-e/Devolução/NF-e emitida/
// Transferência de NF-e — a `message` real do envelope já é exibida pelo
// `onError` GENÉRICO do `useRequest` (mesmo racional de
// InfoComplementares/RegrasFiscais — `useRequest` não tem variante
// "delete", "update" é a convenção compilável; o texto do toast de sucesso
// vem de `personalizedMessage`, o rótulo genérico de "update" nunca aparece).
//
// `NatureOperation` é TENANT-ONLY (Scope dedicado `NatureOperationTenantScope`,
// sem `farm_id` físico) — o header X-Farm-Id é anexado automaticamente pelo
// interceptor axios global; nenhuma ação especial neste componente.
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

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteNatureOperation,
  importDefaultNatureOperations,
} from '@/services/v2/NatureOperations/nature-operation-service';

import type {
  NatureOperationFilterForm,
  NatureOperationListItem,
} from '@/@types/v2/NatureOperations';

import { FilterSideNaturezaOperacao } from './FilterSideNaturezaOperacao';
import { HeaderTable } from './HeaderTable';
import { useNatureOperationsList } from './useNatureOperations';

import { PageHeader } from '@/components/ui/PageHeader';

export default function NaturezaOperacaoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.natureOperations.natureOperation;

  const canCreate = can('natop_create');
  const canEdit = can('natop_edit');
  const canDelete = can('natop_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseNaturezaOperacao' + queryKey.natureOperations.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<NatureOperationFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<NatureOperationListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const natureOperationsList = useNatureOperationsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ natureOperationUuid }: { natureOperationUuid: string }) => {
      return await deleteNatureOperation(natureOperationUuid);
    },
    queryKey: queryKey.natureOperations.list,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por InfoComplementares/RegrasFiscais para a
    // mesma operação. O texto exibido no toast vem de `personalizedMessage`,
    // então o rótulo genérico associado a "update" nunca aparece ao usuário.
    //
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). O backend real emite 422
    // estruturado (`errors.in_use[]`) quando em uso por CT-e/Devolução/NF-e
    // emitida/Transferência de NF-e (DeleteNatureOperationAction, guarda
    // dupla dependencyUsageCounts()+catch 23503) — o toast genérico já
    // mostra a mensagem certa, sem precisar decodificar `errors.in_use`
    // estruturado nesta tela.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  // ---- UT-000779: "Usar modelos" (importa naturezas padrão do sistema) -----
  const {
    open: isOpenImportDialog,
    onOpen: onOpenImportDialog,
    onClose: onCloseImportDialog,
  } = useDisclosure();

  const importDefaultsMutation = useRequest({
    asyncFunction: async () => await importDefaultNatureOperations(),
    // Invalida a lista (useRequest.onSuccess) — a query refaz o fetch.
    queryKey: queryKey.natureOperations.list,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    // Toast com contagem real (created) ou aviso de idempotência (created = 0).
    resolveSuccessToast: (result) => {
      const created = result?.created ?? 0;
      return {
        type: 'success',
        description:
          created > 0
            ? text.list.importDefaults.toastCreated.replace('{count}', String(created))
            : text.list.importDefaults.toastAllExisting,
      };
    },
    actionSuccess: () => {
      onCloseImportDialog();
    },
  });

  const isImportingDefaults = importDefaultsMutation.isPending;

  const handleDeleteClick = (natureOperation: NatureOperationListItem) => {
    setToDelete(natureOperation);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ natureOperationUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<NatureOperationListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('descricao', {
        header: text.list.table.descricao,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.descricao}
          </Text>
        ),
      }),
      columnHelper.accessor('tipo', {
        header: text.list.table.tipo,
        // Label via TipoOperacaoEnum::label() espelhado no frontend — MESMOS
        // textos do backend (0=Entrada, 1=Saída), nunca inventar rótulo
        // diferente (app/Enums/NatureOperation/TipoOperacaoEnum.php:16-21).
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.tipo === 1 ? 'orange' : 'blue'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.tipo === 1 ? text.list.tipoOptions.saida : text.list.tipoOptions.entrada}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('ativo', {
        header: text.list.table.ativo,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.ativo ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.ativo ? text.list.table.active : text.list.table.inactive}
          </Badge>
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
                  onClick={() => navigate(`/cadastros-base/natureza-operacao/${row.original.uuid}`)}
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
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([natureOperationsList]);
  const items = natureOperationsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

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
              onImportDefaults={onOpenImportDialog}
              isImportingDefaults={isImportingDefaults}
            />
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={natureOperationsList.isError}
            error={natureOperationsList.error}
            isEmpty={isEmpty}
            onRetry={() => natureOperationsList.refetch()}
            isRetrying={natureOperationsList.isFetching}
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
                  ? text.list.emptyState.descriptionEmptyWithTemplates
                  : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/natureza-operacao/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideNaturezaOperacao
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteConfirmDialog
        isOpen={isOpenImportDialog}
        onClose={onCloseImportDialog}
        onConfirm={() => importDefaultsMutation.mutate(undefined)}
        isLoading={isImportingDefaults}
        title={text.list.importDefaults.dialogTitle}
        description={text.list.importDefaults.dialogDescription}
        confirmButtonText={text.list.importDefaults.dialogConfirm}
        colorPalette="blue"
        tone="info"
        hideQuestionMark
        warningText=""
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.descricao}
      />
    </ContainerGrid>
  );
}
