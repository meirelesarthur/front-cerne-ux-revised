// src/pages/CadastrosBase/Clientes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid paginado) de CLIENTES (Client — Cadastros Base,
// TASK-CL-FE-02).
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO — escrito ANTES de
// `Client-contrato.md`/`TASK-CL-0N` de backend existirem. CÓDIGO-INCOMPLETO
// / sujeito a reconciliação quando o contrato `/clients` fechar.
//
// Rota: /cadastros-base/clientes (guardada por `clients_view`, registrada em
// src/router/index.tsx). Item de menu `cad-pes-cli` NOVO, posicionado
// IMEDIATAMENTE APÓS `cad-for-lis` ("Fornecedores", ordem real do legado,
// app/Support/PermissionTree.php:399-469).
//
// Referência UX: UX-GAP declarado pelo Arquiteto (sem tela dedicada
// "Clientes" no `ux_root`/produção) — estrutura de composição
// (ContainerGrid/HeaderGrid/TableProvider/Table/`<Form formFilter>`) espelha
// `Proprietarios/index.tsx` (grid+filtro+rota+menu) + `Contador/index.tsx`
// (exclusão bloqueada), adaptada aos tokens do `cerne`. Colunas: nif,
// name+nickname, city (nome+UF), cellphone, is_enabled (badge SOMENTE
// LEITURA — caminho A do fork).
//
// ⚠️ FORK DEPENDENTE DO CONTRATO DE API — semântica de exclusão. CAMINHO A
// (DEFAULT implementado aqui, alta confiança): HARD-DELETE físico real
// (`app/Client.php` sem `SoftDeletes`; `ClientController::destroy()` chama
// `$item->delete()`) — molde EXATO de `Proprietarios/index.tsx`/
// `Contador/index.tsx`: NÃO usa `useRequest` (o `onError` genérico dele só
// lê `resData?.message`, nunca `resData?.errors` — esconderia
// `errors.in_use[]`). Usa `useMutation` DEDICADO: sucesso → invalida a
// listagem + toast + fecha `DeleteConfirmDialog`; erro 422 com
// `errors.in_use[]` populado → fecha `DeleteConfirmDialog` e abre o
// `InUseBlockedDialog` genérico (canário FRONT-03-InUseBlockedDialog.md);
// qualquer outro erro cai no toast genérico. CAMINHO B
// (se o contrato fechar por SOFT-delete via `is_enabled`, mirror `Provider`)
// NÃO implementado nesta rodada — reconfirmar contra
// `ClientController`/`Client-contrato.md` reais quando existirem e ajustar
// esta tela se necessário (mudança isolada, não propaga para
// `TASK-CL-FE-01`/`03`).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { isAxiosError } from 'axios';
import { FiEdit, FiEye, FiTrash2, FiUsers } from 'react-icons/fi';
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
import { extractApiFieldErrorMessage, extractInUseItems } from '@/utils/extractApiErrorMessage';
import { formatDocument } from '@/utils/formatDocument';
import { styleColumTable } from '@/utils/style-colum-table';

import { clientInUseTableLabels } from '@/constants/cadastrosBase/Client/options/client-in-use-table-labels';
import { queryKey } from '@/constants/query-key';

import { deleteClient } from '@/services/v2/CadastrosBase/Client/client-service';

import type { ClientFilterForm, ClientListItem } from '@/@types/v2/CadastrosBase/client';

import { FilterSideClientes } from './FilterSideClientes';
import { HeaderTable } from './HeaderTable';
import { useClientsList } from './useClientes';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Máscara de EXIBIÇÃO de CPF/CNPJ (reuso dos utils globais já existentes —
// mesmo helper usado por `Proprietarios/index.tsx`/`Fornecedores/index.tsx`
// — nenhum novo helper de máscara criado aqui).
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

export default function ClientesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.clients.client;

  const canCreate = can('clients_create');
  const canEdit = can('clients_edit');
  const canDelete = can('clients_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseClientes' + queryKey.cadastrosBase.clients,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ClientFilterForm>(defaultQueryOptions);
  const listSearch = useListSearch(paginatedQuery.filter, handleFilterChange);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const clientsList = useClientsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão (CAMINHO A — HARD-DELETE, molde Proprietary/Contador) ----
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<ClientListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use[]`) —
  // itens normalizados por `extractInUseItems` (canário
  // FRONT-03-InUseBlockedDialog.md, mesmo desenho de `Addressing/index.tsx`).
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  // ⚠️ NÃO usa `useRequest` aqui — ver nota de topo do arquivo.
  const deleteMutation = useMutation({
    mutationFn: async (clientUuid: string) => await deleteClient(clientUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.cadastrosBase.clients] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error('Client delete - error:', error);

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

  const handleDeleteClick = (client: ClientListItem) => {
    setToDelete(client);
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

  const columnHelper = createColumnHelper<ClientListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.accessor('nickname', {
        header: text.list.table.nickname,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.nickname || '—'}
          </Text>
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
      columnHelper.accessor('cellphone', {
        header: text.list.table.cellphone,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.cellphone || '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // Badge SOMENTE LEITURA (caminho A do fork) — Client não tem toggle de
      // status nesta rodada; se o fork virar caminho B (soft-delete), esta
      // coluna vira clicável (mirror `Fornecedores/index.tsx`).
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
              <Actions.Item
                icon={<Icon as={FiEye} />}
                onClick={() => navigate(`/cadastros-base/clientes/${row.original.uuid}/detalhe`)}
              >
                {text.list.actions.view}
              </Actions.Item>
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/clientes/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([clientsList]);
  const items = clientsList.data?.data?.items;
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          <Table
            isLoading={isLoading}
            isError={clientsList.isError}
            error={clientsList.error}
            isEmpty={isEmpty}
            onRetry={() => clientsList.refetch()}
            isRetrying={clientsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiUsers as ElementType}
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
            onCreate={() => navigate('/cadastros-base/clientes/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideClientes
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
        getResourceLabel={(table) => clientInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
