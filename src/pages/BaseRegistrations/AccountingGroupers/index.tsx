// src/pages/BaseRegistrations/AccountingGroupers/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM EM ÁRVORE de Agrupadores Contábeis (AccountingGrouper) —
// Cadastros Base / Financeiros. Rota: /cadastros-base/agrupadores-contabeis
// (guardada por `accounting_groupers_view`, registrada em src/router/index.tsx
// ANTES do catch-all `/cadastros-base/*`).
//
// ⚠️ NÃO é a tela de `Grouper` (agrupador de ESTOQUE,
// `src/pages/CadastrosBase/Agrupadores/`, rota `/cadastros-base/agrupadores`)
// — módulos IRMÃOS, contratos distintos (TASK-ACG-01, "Armadilha de
// identidade").
//
// SEM paginação — `GET /accounting-groupers` devolve a árvore INTEIRA em uma
// única chamada, já ordenada por depth/nested-set. Por isso: SEM modo
// "grid achatado" (diferente de `Grouper`), SEM expandir/recolher (lista
// SEMPRE expandida — mesmo comportamento do Blade legado,
// `accounting-groupers/tree.blade.php`), SEM barra de paginação.
//
// `hasChildren` é calculado no CLIENTE (via `Set` de `parent_uuid`, todos os
// nós já em memória) porque `AccountingGrouperResource` não expõe
// `children_count` — usado para esconder "Excluir" em nós com filhos
// (cosmético, fidelidade de UX ao legado; a guarda REAL é do backend).
//
// Exclusão: `useMutation` DEDICADO (NÃO `useRequest` genérico) — o backend
// devolve 422 estruturado `errors.in_use[]`
// (`CheckAccountingGrouperDependenciesAction`) e o `onError` genérico do
// `useRequest` não lê `resData?.errors`, escondendo a lista de vínculos.
// Itens normalizados via `extractInUseItems` e exibidos pelo `InUseBlockedDialog`
// genérico (canário FRONT-03-InUseBlockedDialog.md, mesmo padrão de
// `Addressing`). O antigo `AccountingGrouperInUseDialog.tsx` (molde original)
// permanece no diretório, sem uso, até o Tester confirmar paridade e
// autorizar sua remoção (DoD).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import {
  Box,
  EmptyState,
  Icon,
  Table,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiGitBranch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { InUseBlockedDialog, type InUseBlockedItem } from '@/components/InUseBlockedDialog';
import { QueryErrorState } from '@/components/QueryErrorState';
import { TableSkeleton } from '@/components/TableSkeleton';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { accountingGrouperInUseTableLabels } from '@/constants/AccountingGroupers/options/accounting-grouper-in-use-table-labels';
import { queryKey } from '@/constants/query-key';

import { deleteAccountingGrouper } from '@/services/v2/AccountingGroupers/accounting-grouper-service';

import type {
  AccountingGrouperFilterForm,
  AccountingGrouperListItem,
} from '@/@types/v2/AccountingGroupers';

import { AccountingGrouperTreeRow } from './AccountingGrouperTreeRow';
import { FilterSideAccountingGroupers } from './FilterSideAccountingGroupers';
import { HeaderTable } from './HeaderTable';
import { useAccountingGroupersList } from './useAccountingGroupers';
import { extractApiFieldErrorMessage, extractInUseItems } from '@/utils/extractApiErrorMessage';

export default function AccountingGroupersList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.baseRegistrations.accountingGroupers;

  const canCreate = can('accounting_groupers_create');
  const canEdit = can('accounting_groupers_edit');
  const canDelete = can('accounting_groupers_delete');

  // ---- Estado de filtro (drawer) ------------------------------------------
  const [filter, setFilter] = useState<AccountingGrouperFilterForm>({});
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () => Object.values(filter).filter((v) => v !== undefined && v !== null && v !== '').length,
    [filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<AccountingGrouperListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use[]`). Canário
  // FRONT-03-InUseBlockedDialog.md: itens normalizados por `extractInUseItems`.
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  const accountingGroupersList = useAccountingGroupersList(filter);

  // ⚠️ NÃO usa `useRequest` aqui — ver nota de topo do arquivo (o `onError`
  // genérico dele não lê `resData?.errors`, escondendo `in_use[]`).
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteAccountingGrouper(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.baseRegistrations.accountingGroupers.list],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKey.baseRegistrations.accountingGroupers.detail],
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
      console.error('AccountingGrouper delete - error:', error);

      const inUseItems = extractInUseItems(error);
      if (inUseItems) {
        // Mensagem DEDICADA — fecha a confirmação genérica e abre o
        // diálogo com a lista de vínculos, SEM toast genérico.
        onCloseDeleteDialog();
        setBlockedInUse(inUseItems);
        onOpenBlockedDialog();
        return;
      }

      // Fallback: qualquer erro que NÃO seja o 422 estruturado de bloqueio
      // (403, 500, 422 residual sem `in_use` populado) — mesmo formato de
      // mensagem do `onError` genérico do `useRequest`.
      let errorMessage = languageGB.common.errorLog.unknownError;
      if (isAxiosError(error)) {
        const statusCode = error.response?.status ?? null;
        const resData = error.response?.data as any;
        if (resData?.message) {
          const msg =
            extractApiFieldErrorMessage(error) ?? (typeof resData.message === 'string' ? resData.message : JSON.stringify(resData.message));
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

  function handleEdit(node: AccountingGrouperListItem) {
    navigate(`/cadastros-base/agrupadores-contabeis/${node.uuid}`);
  }

  function handleCreateChild(node: AccountingGrouperListItem) {
    navigate(`/cadastros-base/agrupadores-contabeis/novo?parentUuid=${node.uuid}`);
  }

  function handleDeleteClick(node: AccountingGrouperListItem) {
    setToDelete(node);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  function handleCloseBlockedDialog() {
    onCloseBlockedDialog();
    setBlockedInUse(null);
    setToDelete(null);
  }

  const items = accountingGroupersList.data ?? [];

  // `hasChildren` calculado no CLIENTE — todos os nós já estão em memória
  // (ver nota de topo do arquivo). `AccountingGrouperResource` não expõe
  // `children_count` (diferente de `Grouper`).
  const parentUuidsWithChildren = useMemo(
    () => new Set(items.map((item) => item.parent_uuid).filter((uuid): uuid is string => !!uuid)),
    [items]
  );

  const isLoading = accountingGroupersList.isLoading;
  const isError = accountingGroupersList.isError;
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
        {isLoading ? (
          <TableSkeleton rows={8} columns={5} hasPagination={false} />
        ) : isError ? (
          <QueryErrorState
            error={accountingGroupersList.error}
            message={text.list.error.message}
            retryLabel={text.list.error.retry}
            onRetry={() => accountingGroupersList.refetch()}
            isRetrying={accountingGroupersList.isFetching}
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
                  onClick={() => navigate('/cadastros-base/agrupadores-contabeis/novo')}
                />
              )}
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          // ---- ÁRVORE, SEMPRE EXPANDIDA — Table.Root/Header/Body diretos
          // (Chakra), sem TableProvider/useTable (ver nota de topo do arquivo). ----
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
                  <AccountingGrouperTreeRow
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

      <FilterSideAccountingGroupers
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

      <InUseBlockedDialog
        isOpen={isOpenBlockedDialog}
        onClose={handleCloseBlockedDialog}
        title={text.deleteBlocked.title}
        description={text.deleteBlocked.description}
        itemName={toDelete?.name}
        items={blockedInUse}
        closeLabel={languageGB.defaltStrings.close}
        resourceLabelTemplate={text.deleteBlocked.resourceLabel}
        getResourceLabel={(table) => accountingGrouperInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
