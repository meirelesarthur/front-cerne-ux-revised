// src/pages/CadastrosBase/Proprietarios/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid paginado) de PROPRIETÁRIOS (Proprietary — Cadastros
// Base, TASK-PY-FE-02).
//
// Rota: /cadastros-base/proprietarios (guardada por `proprietaries_view`,
// registrada em src/router/index.tsx). Item de menu `cad-pes-prp` NOVO,
// posicionado ANTES de `cad-for-lis` (ordem real do legado,
// app/Support/PermissionTree.php:424-459).
//
// Referência UX: UX-GAP declarado pelo Arquiteto (sem tela dedicada
// "Proprietários" no `ux_root`/produção) — estrutura de composição
// (ContainerGrid/HeaderGrid/TableProvider/Table/`<Form formFilter>`) espelha
// `Fornecedores/index.tsx` (grid+filtro+rota+menu), adaptada aos tokens do
// `cerne`. Colunas (contrato `## 4.5`): nif, name+nickname, city (nome+UF),
// percentage (da farm ativa, DA-PY-03 — pode vir `null`), is_enabled (badge
// SOMENTE LEITURA — Proprietary não tem toggle de status, diferente de
// Fornecedores).
//
// Exclusão: HARD-DELETE físico real (`DA-PY-05`, DIVERGE conscientemente do
// soft-delete de Fornecedores) — molde EXATO de `Contador/index.tsx` (NÃO
// `Fornecedores/index.tsx`): NÃO usa `useRequest` (o `onError` genérico dele
// só lê `resData?.message`, nunca `resData?.errors` — esconderia
// `errors.in_use[]`). Usa `useMutation` DEDICADO: sucesso → invalida a
// listagem + toast + fecha `DeleteConfirmDialog`; erro 422 com
// `errors.in_use[]` populado (normalizado por `extractInUseItems`) → fecha
// `DeleteConfirmDialog` e abre o `InUseBlockedDialog` genérico com a lista;
// qualquer outro erro (403/500/422 residual de corrida `23503`) cai no
// toast genérico.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { FiEdit, FiTrash2, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { InUseBlockedDialog, type InUseBlockedItem } from '@/components/InUseBlockedDialog';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { docTypeOfDigits, normalizeDocument } from '@/utils/cpfCnpj';
import { formatDocument } from '@/utils/formatDocument';
import { styleColumTable } from '@/utils/style-colum-table';

import { proprietaryInUseTableLabels } from '@/constants/cadastrosBase/Proprietarios/options/proprietary-in-use-table-labels';
import { queryKey } from '@/constants/query-key';

import { deleteProprietary } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { ProprietaryFilterForm, ProprietaryListItem } from '@/@types/v2/CadastrosBase/proprietary';

import { FilterSideProprietarios } from './FilterSideProprietarios';
import { HeaderTable } from './HeaderTable';
import { useProprietariesList } from './useProprietarios';
import { extractApiFieldErrorMessage, extractInUseItems } from '@/utils/extractApiErrorMessage';

// Máscara de EXIBIÇÃO de CPF/CNPJ (reuso dos utils globais já existentes —
// mesmo helper usado por `Fornecedores/index.tsx` — nenhum novo helper de
// máscara criado aqui).
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

export default function ProprietariosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.proprietaries.proprietary;

  const canCreate = can('proprietaries_create');
  const canEdit = can('proprietaries_edit');
  const canDelete = can('proprietaries_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseProprietarios' + queryKey.cadastrosBase.proprietaries,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ProprietaryFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const proprietariesList = useProprietariesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão (HARD-DELETE, molde Contador) --------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<ProprietaryListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use[]`) — itens
  // normalizados por `extractInUseItems` (InUseBlockedDialog genérico).
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  // ⚠️ NÃO usa `useRequest` aqui — ver nota de topo do arquivo.
  const deleteMutation = useMutation({
    mutationFn: async (proprietaryUuid: string) => await deleteProprietary(proprietaryUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.cadastrosBase.proprietaries] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('Proprietary delete - error:', error);

      const inUseItems = extractInUseItems(error);
      if (inUseItems) {
        onCloseDeleteDialog();
        setBlockedInUse(inUseItems);
        onOpenBlockedDialog();
        return;
      }

      // Fallback: qualquer erro que NÃO seja o 422 estruturado de bloqueio
      // (403, 500, 422 residual de corrida sem `in_use` populado).
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

  const handleDeleteClick = (proprietary: ProprietaryListItem) => {
    setToDelete(proprietary);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  };

  const handleCloseBlockedDialog = () => {
    onCloseBlockedDialog();
    setBlockedInUse(null);
    setToDelete(null);
  };

  const columnHelper = createColumnHelper<ProprietaryListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Box minW={0}>
            <Text fontWeight="medium" lineClamp="1">
              {row.original.name}
            </Text>
            <Text fontSize="xs" color="fg.muted" lineClamp="1">
              {row.original.nickname}
            </Text>
          </Box>
        ),
      }),
      columnHelper.accessor('nif', {
        header: text.list.table.document,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {maskNif(row.original.nif)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('city', {
        header: text.list.table.city,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.city
              ? `${row.original.city.name}${row.original.city.state ? ` — ${row.original.city.state.uf}` : ''}`
              : '—'}
          </Text>
        ),
      }),
      columnHelper.accessor('percentage', {
        header: text.list.table.percentage,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.percentage !== null && row.original.percentage !== undefined
              ? `${row.original.percentage}%`
              : '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // Badge SOMENTE LEITURA — Proprietary não tem toggle de status
      // (diferente de Fornecedores); é um indicador, não uma ação clicável.
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
                  onClick={() => navigate(`/cadastros-base/proprietarios/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([proprietariesList]);
  const items = proprietariesList.data?.data?.items;
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
            isError={proprietariesList.isError}
            error={proprietariesList.error}
            isEmpty={isEmpty}
            onRetry={() => proprietariesList.refetch()}
            isRetrying={proprietariesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiUser as ElementType}
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
            onCreate={() => navigate('/cadastros-base/proprietarios/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideProprietarios
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
        itemName={toDelete?.name}
        title={text.list.deleteDialog.title}
        confirmButtonText={text.list.deleteDialog.confirm}
        colorPalette="red"
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
        getResourceLabel={(table) => proprietaryInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
