// src/pages/BaseRegistrations/DocumentTypes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM EM ÁRVORE de Tipo Documento (DocumentType) — Administrativo
// / Gestão Documentos. Rota: /administrativo/tipos-documento (guardada por
// `document-types_view`, registrada em src/router/index.tsx ANTES do
// catch-all `/administrativo/*`).
//
// Mesma classe estrutural de `AccountingGrouper` (nested-set, sem paginação
// real) — mirror ESTRUTURAL de `AccountingGroupers/index.tsx`, com 2
// diferenças REAIS (ver TASK-DT-FE-01, "Diferenças reais"):
//
// 1) SEM parâmetro de busca no backend — `GET /document-types` devolve a
//    árvore INTEIRA em uma única chamada, SEM `search`. O filtro (nome OU
//    código) é 100% CLIENT-SIDE, aplicado aqui sobre o array já carregado
//    por `useDocumentTypesList()`. `hasChildren` é calculado sobre TODOS os
//    itens (`allItems`), não sobre os filtrados — a checagem de "tem filho"
//    não muda com o filtro aplicado.
//
// 2) SEM diálogo dedicado de "em uso" — `DocumentType` (DA-DT-05/GAP-DT-05)
//    só promete uma `BusinessRuleException` com `message` simples (SEM 422
//    estruturado `errors.in_use[]` confirmado, diferente de
//    `AccountingGrouper`). O `onError` da mutação de exclusão usa o
//    fallback genérico (`extractApiFieldErrorMessage` + toast) — NÃO cria
//    um `DocumentTypeInUseDialog`. Se a API vier a devolver um formato
//    estruturado, é achado a reportar como Gap, não a decidir aqui.
//
// SEM paginação — SEM modo "grid achatado", SEM expandir/recolher (lista
// SEMPRE expandida — mesmo comportamento do Blade legado), SEM barra de
// paginação.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Icon, Table, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiGitBranch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { QueryErrorState } from '@/components/QueryErrorState';
import { TableSkeleton } from '@/components/TableSkeleton';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { deleteDocumentType } from '@/services/v2/DocumentTypes/document-type-service';

import type { DocumentTypeFilterForm, DocumentTypeListItem } from '@/@types/v2/DocumentTypes';

import { DocumentTypeTreeRow } from './DocumentTypeTreeRow';
import { FilterSideDocumentTypes } from './FilterSideDocumentTypes';
import { HeaderTable } from './HeaderTable';
import { useDocumentTypesList } from './useDocumentTypes';

import { PageHeader } from '@/components/ui/PageHeader';

export default function DocumentTypesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.baseRegistrations.documentTypes;

  const canCreate = can('document-types_create');
  const canEdit = can('document-types_edit');
  const canDelete = can('document-types_delete');

  // ---- Estado de filtro (drawer, 100% CLIENT-SIDE) --------------------------
  const [filter, setFilter] = useState<DocumentTypeFilterForm>({});
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () => Object.values(filter).filter((v) => v !== undefined && v !== null && v !== '').length,
    [filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<DocumentTypeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const documentTypesList = useDocumentTypesList();

  // ⚠️ `DocumentType` NÃO tem diálogo dedicado de "em uso" (ver nota de topo
  // do arquivo) — o `onError` usa SEMPRE o fallback genérico.
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteDocumentType(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.baseRegistrations.documentTypes.list],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKey.baseRegistrations.documentTypes.detail],
      });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('DocumentType delete - error:', error);

      // Fallback genérico — SEM diálogo dedicado tipo `AccountingGrouperInUseDialog`
      // nesta rodada (ver nota de topo do arquivo).
      let errorMessage = languageGB.common.errorLog.unknownError;
      if (isAxiosError(error)) {
        const statusCode = error.response?.status ?? null;
        const resData = error.response?.data as any;
        if (resData?.message) {
          const msg =
            extractApiFieldErrorMessage(error) ??
            (typeof resData.message === 'string'
              ? resData.message
              : JSON.stringify(resData.message));
          errorMessage = `${statusCode} — ${msg}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleEdit(node: DocumentTypeListItem) {
    navigate(`/administrativo/tipos-documento/${node.uuid}`);
  }

  function handleCreateChild(node: DocumentTypeListItem) {
    navigate(`/administrativo/tipos-documento/novo?parentUuid=${node.uuid}`);
  }

  function handleDeleteClick(node: DocumentTypeListItem) {
    setToDelete(node);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const allItems = documentTypesList.data ?? [];

  // Filtro 100% CLIENT-SIDE — nome OU código, substring case-insensitive.
  // Aplicado sobre `allItems` (já carregado por useDocumentTypesList()); NÃO
  // dispara nenhuma request de rede (ver nota de topo do arquivo).
  const items = filter.search
    ? allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(filter.search!.toLowerCase()) ||
          item.code.toLowerCase().includes(filter.search!.toLowerCase())
      )
    : allItems;

  // `hasChildren` calculado no CLIENTE sobre `allItems` (NÃO `items`
  // filtrados) — a checagem de "tem filho" não deve mudar com o filtro
  // aplicado (ver nota de topo do arquivo). `DocumentTypeResource` não expõe
  // `children_count`.
  const parentUuidsWithChildren = useMemo(
    () =>
      new Set(allItems.map((item) => item.parent_uuid).filter((uuid): uuid is string => !!uuid)),
    [allItems]
  );

  const isLoading = documentTypesList.isLoading;
  const isError = documentTypesList.isError;
  const isEmpty = !isLoading && !isError && items.length === 0;

  return (
    <ContainerGrid>
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

      <Box mt={6}>
        {isLoading ? (
          <TableSkeleton rows={8} columns={5} hasPagination={false} />
        ) : isError ? (
          <QueryErrorState
            error={documentTypesList.error}
            onRetry={() => documentTypesList.refetch()}
            isRetrying={documentTypesList.isFetching}
            retryLabel={text.list.error.retry}
          />
        ) : isEmpty ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiGitBranch} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>
                  {filtersApplied > 0
                    ? text.list.emptyState.titleFiltered
                    : text.list.emptyState.titleEmpty}
                </EmptyState.Title>
                <EmptyState.Description>
                  {filtersApplied > 0
                    ? text.list.emptyState.descriptionFiltered
                    : text.list.emptyState.descriptionEmpty}
                </EmptyState.Description>
              </VStack>
              {filtersApplied === 0 && canCreate && (
                <Button
                  title={text.list.emptyState.cta}
                  onClick={() => navigate('/administrativo/tipos-documento/novo')}
                />
              )}
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          // ---- ÁRVORE, SEMPRE EXPANDIDA — Table.Root/Header/Body diretos
          // (Chakra), sem TableProvider/useTable. ----
          <Table.ScrollArea
            borderTop="1px"
            marginTop="6"
            borderTopRadius="md"
            borderColor="borderGrid"
          >
            <Table.Root
              variant="line"
              size="md"
              css={{
                border: 'none',
                '& th': {
                  bg: 'gridHeadSecondary',
                  color: 'textGridColor',
                  height: '10',
                  fontWeight: '500',
                  fontSize: '14px',
                  paddingY: '2',
                  paddingLeft: '4',
                  paddingRight: '4',
                },
              }}
            >
              <Table.Header>
                <Table.Row borderBottom="1px solid" borderColor="borderGrid">
                  <Table.ColumnHeader>{text.list.table.code}</Table.ColumnHeader>
                  <Table.ColumnHeader>{text.list.table.name}</Table.ColumnHeader>
                  <Table.ColumnHeader width="100px">{text.list.table.order}</Table.ColumnHeader>
                  <Table.ColumnHeader width="120px">{text.list.table.isEnabled}</Table.ColumnHeader>
                  <Table.ColumnHeader width="112px">{text.list.table.actions}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {items.map((node) => (
                  <DocumentTypeTreeRow
                    key={node.uuid}
                    node={node}
                    hasChildren={parentUuidsWithChildren.has(node.uuid)}
                    canEdit={canEdit}
                    canCreate={canCreate}
                    canDelete={canDelete}
                    isDeleting={isDeleting}
                    onEdit={handleEdit}
                    onCreateChild={handleCreateChild}
                    onDeleteClick={handleDeleteClick}
                  />
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        )}
      </Box>

      <FilterSideDocumentTypes
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={(applied) => setFilter(applied)}
        handleReset={() => setFilter({})}
        languageGB={languageGB}
        filter={filter}
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
      />
    </ContainerGrid>
  );
}
