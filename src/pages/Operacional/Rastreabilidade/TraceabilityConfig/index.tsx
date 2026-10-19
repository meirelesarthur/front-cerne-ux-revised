// src/pages/Operacional/Rastreabilidade/TraceabilityConfig/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Configuração (Rastreabilidade, F-067) —
// Operacional > Agricultura > Rastreabilidade > Configuração. TASK-TR-FE-09
// (esteira `97-Esteiras/058`), contrato de tela `## 5.1`, mirror
// `Operacional/Rastreabilidade/Traceability/index.tsx` (listagem global sem
// ID de contexto, `useCustomGridQuery`) — REDUZIDO: sem `FilterSide` (legado
// não tinha filtro nesta tela, `## 5.1` do contrato de tela) e sem ações de
// Ver/Galeria/Etiqueta (exclusivas de Produto).
//
// Rota (nasce em `TASK-TR-FE-11`, fora do escopo desta Tarefa):
// `/operacional/rastreabilidade/configuracao`, guardada por `tracconfig_view`.
//
// Colunas (`list_manifest` LM-08..11, ORDEM EXATA do contrato de tela `## 5.1`):
// Nome · CPF/CNPJ · Endereço (já concatenado no servidor) · Cidade · Ações
// (rótulo CORRIGIDO — fecha D05, bug de tradução "Ação" do legado).
//
// Gate ÚNICO `tracconfig_view` cobre TODOS os verbos (`## 6.1` do contrato de
// destino, ratificado) — Adicionar/Editar/Excluir usam a MESMA permissão.
//
// Sem Zustand — fazenda ativa via `AuthContext`/interceptor (`X-Farm-Id`);
// paginação por `userPaginatedQuery` (Storage), `storageKey` módulo+queryKey+
// fazenda ativa (o mesmo racional de `Traceability/index.tsx` — paginação NÃO
// deve vazar entre fazendas diferentes).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useAuth } from '@/hooks/useAuth';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteTraceabilityConfig,
  getAllTraceabilityConfigs,
} from '@/services/v2/Rastreabilidade/traceability-config-service';

import type { TraceabilityConfigListItem } from '@/@types/v2/Rastreabilidade/traceability-config';

import { HeaderTable } from './HeaderTable';
import { TraceabilityConfigActionsMenu } from './TraceabilityConfigActionsMenu';

// Seletor de itens por página — mirror `Traceability/index.tsx`. NUNCA 200: o
// servidor valida `per_page` como `max:100`.
const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

const TRACEABILITY_CONFIG_BASE_ROUTE = '/operacional/rastreabilidade/configuracao';

export default function TraceabilityConfigList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.rastreabilidade.traceabilityConfig;

  // Gate ÚNICO — `## 6.1` do contrato de destino, ratificado: não existem
  // `tracconfig_edit`/`tracconfig_delete` separadas.
  const canManage = can('tracconfig_view');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        languageGB.rastreabilidade.titleModule +
        queryKey.rastreabilidade.traceabilityConfigs +
        (activeFarmUuid ?? ''),
    }),
    [languageGB.rastreabilidade.titleModule, activeFarmUuid]
  );

  const { paginatedQuery, handlePaginatedQuery } = userPaginatedQuery(defaultQueryOptions);

  const traceabilityConfigsList = useCustomGridQuery<
    TraceabilityConfigListItem,
    Record<string, never>
  >({
    asyncFunction: getAllTraceabilityConfigs,
    queryKey: queryKey.rastreabilidade.traceabilityConfigs,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
  });

  // ---- Estado de exclusão (gate `tracconfig_view`, mirror `Traceability/index.tsx`) ----
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<TraceabilityConfigListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteTraceabilityConfig(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.rastreabilidade.traceabilityConfigs] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(item: TraceabilityConfigListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  const columnHelper = createColumnHelper<TraceabilityConfigListItem>();
  const defaultColumns = useMemo(
    () => [
      // LM-08 — Nome
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.name}</Text>,
        meta: styleColumTable.sm,
      }),
      // LM-09 — CPF/CNPJ
      columnHelper.accessor('cpf_cnpj', {
        header: text.list.table.cpfCnpj,
        cell: ({ row }) => <Text fontSize="sm">{row.original.cpf_cnpj}</Text>,
        meta: styleColumTable.sm,
      }),
      // LM-10 — Endereço (já concatenado no servidor, NUNCA remontado no front)
      columnHelper.accessor('address_full', {
        header: text.list.table.address,
        cell: ({ row }) => <Text fontSize="sm">{row.original.address_full}</Text>,
        meta: styleColumTable.sm,
      }),
      // LM-11 — Cidade (`city.title (state.letter)`)
      columnHelper.accessor((row) => row.city?.title ?? '', {
        id: 'city',
        header: text.list.table.city,
        cell: ({ row }) => {
          const city = row.original.city;
          return (
            <Text fontSize="sm">
              {city ? `${city.title}${city.state_letter ? ` (${city.state_letter})` : ''}` : '—'}
            </Text>
          );
        },
        meta: styleColumTable.sm,
      }),
      // Ações — rótulo CORRIGIDO (fecha D05, bug de tradução do legado)
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Flex justify="flex-end">
              <TraceabilityConfigActionsMenu
                canEdit={canManage}
                canDelete={canManage}
                isDeleting={isDeleting}
                onEdit={() => navigate(`${TRACEABILITY_CONFIG_BASE_ROUTE}/${item.uuid}`)}
                onDelete={() => handleDeleteClick(item)}
                labels={{
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                }}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, canManage, text]
  );

  const isLoading = checkLoadingStatus([traceabilityConfigsList]);
  const items = traceabilityConfigsList.data?.data?.items;
  const isEmpty = !isLoading && !traceabilityConfigsList.isError && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
      >
        <HeaderGrid header={<HeaderTable languageGB={languageGB} />}>
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
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={traceabilityConfigsList.isError}
            error={traceabilityConfigsList.error}
            isEmpty={isEmpty}
            onRetry={() => traceabilityConfigsList.refetch()}
            isRetrying={traceabilityConfigsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiUsers as ElementType}
            emptyTitle={text.list.emptyState.titleEmpty}
            emptyDescription={text.list.emptyState.descriptionEmpty}
            canCreate={canManage}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${TRACEABILITY_CONFIG_BASE_ROUTE}/create`)}
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
        title={text.list.deleteDialog.title}
        description={
          toDelete
            ? text.list.deleteDialog.descriptionTemplate.replace('{name}', toDelete.name)
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
