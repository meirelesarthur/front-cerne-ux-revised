// src/pages/Fiscal/NfeEmitidas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de NFe Emitida — domínio Fiscal (casa própria,
// mirror `Invoices/index.tsx`), TASK-FE-036-403. REWORK DE FIDELIDADE
// pós-homologação (`audit-nfe-emitidas.md`, Grupo A).
//
// Colunas: Código, Cliente, Natureza, Data (com hora), Estado, Total.
//
// **Correção A-01:** Coluna "Cliente" agora mostra o NOME real —
// `NfeListResource` (backend real) passou a expor `client: { uuid, name }`
// (correção pós-auditoria, `people.name` eager-loaded). Fallback ao uuid
// truncado só se `name` vier `null` (SEM MOCK).
//
// **A-07 (P2):** Data da listagem ganhou a hora de volta (`dd/MM/yyyy
// HH:mm`) — legado exibia data+hora (`index.blade.php:130-131`).
//
// **A-10 (P2):** Paginação realinhada a 20 itens/página (legado,
// `NfeController.php:175`) — era 10.
//
// **Correção NFE-R2-001 (REAUDITORIA-036-2a-rodada.md, esteira 036fix2):**
// `NfeListResource` real (branch `feature/036-financeiro-fiscal`) passou a
// expor Emissor/`numero_nfe`/`items_count` — colunas Emissor, Número (NFe) e
// Qtd. Itens agora consumidas aqui (a 1ª leva só tinha fechado o backend).
//
// **GAP-API (A-03/NFE-R2-003, ainda ABERTO) — NÃO implementado aqui:**
// indicador de integração Domínio (ponto colorido + legenda) — depende de
// integração não migrada, `NfeListResource` não expõe `integration_status`
// (SEM MOCK, Group B).
//
// Coluna "Data" usa `created_at` (não `departure_date`) — `NfeListResource`
// não devolve `departure_date` no índice (só no `show`), mirror a própria
// decisão do backend em `NfeFilterData` (mapeia "período de emissão" para
// `created_at`, contrato de API §8, Lacuna já resolvida lá).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';
import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { isNfeEditable, nfeEstadoColor } from '@/constants/Fiscal/nfe-estado-options';
import { queryKey } from '@/constants/query-key';

import { deleteNfe } from '@/services/v2/Fiscal/nfe-service';

import type { NfeFilterForm, NfeListItem } from '@/@types/v2/Nfes';

import { FilterSideNfe } from './FilterSideNfe';
import { NfeActionsMenu } from './NfeActionsMenu';
import { useNfesList } from './useNfes';

import { PageHeader } from '@/components/ui/PageHeader';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function NfesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.nfes.nfe;

  const canCreate = can('nfe_create');
  const canEdit = can('nfe_edit');
  const canDelete = can('nfe_delete');
  const canView = can('nfe_view');
  // TASK-FE-036-515 — mirror 1:1 dos gates de `NfeEmissionController::
  // middleware()`; a guarda por `estado` (novo/rejeitado × aprovado) é
  // aplicada por linha, junto de `editable`, mais abaixo.
  const canEmit = can('nfe_edit');
  const canCancel = can('nfe_delete');
  const canCorrect = can('nfe_edit');

  const defaultQueryOptions = useMemo(
    () => ({
      // A-10 do audit — mirror legado (`NfeController.php:175`, 20/página).
      pageSize: 20,
      storageKey: 'Nfes' + queryKey.nfes.nfesList,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<NfeFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<NfeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const nfesList = useNfesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ nfeUuid }: { nfeUuid: string }) => {
      return await deleteNfe(nfeUuid);
    },
    queryKey: queryKey.nfes.nfesList,
    queryKey2: queryKey.nfes.nfe,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(nfe: NfeListItem) {
    setToDelete(nfe);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ nfeUuid: toDelete.uuid });
    }
  }

  const columnHelper = createColumnHelper<NfeListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm">
            {row.original.code ?? '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('client', {
        header: text.list.table.client,
        // Correção A-01 — `NfeListResource` real agora expõe `client.name`;
        // fallback ao uuid truncado só se `name` vier `null` (SEM MOCK).
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.client?.name ?? row.original.client?.uuid?.slice(0, 8) ?? '—'}
          </Text>
        ),
      }),
      // Correção NFE-R2-001 — Emissor (`issuer`), mirror `issue_name` do
      // legado (`index.blade.php:105,125`). Fallback ao uuid truncado só se
      // razão social/nome fantasia vierem `null` (SEM MOCK).
      columnHelper.accessor('issuer', {
        header: text.list.table.issuer,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.issuer?.razao_social ??
              row.original.issuer?.nome_fantasia ??
              row.original.issuer?.uuid?.slice(0, 8) ??
              '—'}
          </Text>
        ),
      }),
      columnHelper.accessor('nature', {
        header: text.list.table.nature,
        cell: ({ row }) => <Text lineClamp="1">{row.original.nature?.descricao ?? '—'}</Text>,
      }),
      columnHelper.accessor('created_at', {
        header: text.list.table.date,
        // A-07 do audit — data COM hora (legado, `index.blade.php:130-131`).
        cell: ({ row }) => (
          <Text fontSize="sm">{formatDate(row.original.created_at, 'dd/MM/yyyy HH:mm')}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('estado', {
        header: text.list.table.estado,
        cell: ({ row }) => (
          <Badge colorPalette={nfeEstadoColor[row.original.estado]} variant="subtle">
            {row.original.estado_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('amount', {
        header: text.list.table.amount,
        cell: ({ row }) => <Text fontSize="sm">{formatCurrencyBRL(row.original.amount)}</Text>,
        meta: styleColumTable.sm,
      }),
      // Correção NFE-R2-001 — número fiscal (`numero_nfe`) e contagem de
      // itens (`items_count`), mirror `index.blade.php:109,111,129,132`.
      columnHelper.accessor('numero_nfe', {
        header: text.list.table.numeroNfe,
        cell: ({ row }) => <Text fontSize="sm">{row.original.numero_nfe ?? '—'}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('items_count', {
        header: text.list.table.itemsCount,
        cell: ({ row }) => <Text fontSize="sm">{row.original.items_count ?? 0}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => {
          const editable = isNfeEditable(row.original.estado);
          // TASK-FE-036-515 — mirror `NfeEmissionPanel.tsx` (mesma regra de
          // estado): Emitir só em novo/rejeitado; Cancelar/Corrigir só em
          // aprovado; Consultar (nfe_view) a partir do momento em que a
          // NF-e já foi transmitida ao menos uma vez (estado !== 'novo').
          const isAprovado = row.original.estado === 'aprovado';
          const goToDetail = () => navigate(`/fiscal/nfe-emitidas/${row.original.uuid}/visualizar`);
          return (
            <Flex justify="flex-end">
              <NfeActionsMenu
                canView={canView}
                canEdit={canEdit && editable}
                canDelete={canDelete && editable}
                // NFE-R2-004 — Duplicar não depende do estado/SEFAZ, mirror
                // legado (`index.blade.php:174-179`, disponível sempre que
                // `nfe_create`).
                canDuplicate={canCreate}
                canEmit={canEmit && editable}
                canCancel={canCancel && isAprovado}
                canCorrect={canCorrect && isAprovado}
                canConsult={canView && row.original.estado !== 'novo'}
                // TASK-FE-036-560/562 (Onda 3) — mesma permissão de leitura
                // (`nfe_view`) de Visualizar/Consultar; navega para o
                // Detalhe, onde `NfeEmissionPanel` decide preview vs. final
                // conforme o `estado` real da linha.
                canDownloadXml={canView}
                canDownloadDanfe={canView}
                isDeleting={isDeleting}
                labels={text.list.actions}
                onView={goToDetail}
                onEdit={() => navigate(`/fiscal/nfe-emitidas/${row.original.uuid}`)}
                onDelete={() => handleDeleteClick(row.original)}
                onDuplicate={() =>
                  navigate('/fiscal/nfe-emitidas/novo', {
                    state: { duplicateFromUuid: row.original.uuid },
                  })
                }
                // As 4 ações de emissão SEFAZ navegam para a tela de
                // Detalhe — `NfeEmissionPanel.tsx` hospeda os modais/
                // mutações reais (ver docblock de `NfeActionsMenu.tsx`).
                onEmit={goToDetail}
                onCancel={goToDetail}
                onCorrect={goToDetail}
                onConsult={goToDetail}
                onDownloadXml={goToDetail}
                onDownloadDanfe={goToDetail}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [
      navigate,
      isDeleting,
      text,
      canView,
      canEdit,
      canDelete,
      canCreate,
      canEmit,
      canCancel,
      canCorrect,
    ]
  );

  const isLoading = checkLoadingStatus([nfesList]);
  const items = nfesList.data?.data?.items;
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
            <Flex gap={2} align="center">
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate('/fiscal/nfe-emitidas/novo')}
                  languageGB={languageGB}
                />
              )}
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </Flex>
          }
        >
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={nfesList.isError}
            error={nfesList.error}
            isEmpty={isEmpty}
            onRetry={() => nfesList.refetch()}
            isRetrying={nfesList.isFetching}
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
            onCreate={() => navigate('/fiscal/nfe-emitidas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideNfe
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
        itemName={toDelete?.code ?? undefined}
      />
    </ContainerGrid>
  );
}
