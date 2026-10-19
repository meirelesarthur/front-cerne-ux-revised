// src/pages/Fiscal/Mdfe/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de MDFe — domínio Fiscal-Transporte, mirror
// estrutural `NfeEmitidas/index.tsx`. TASK-MDFE-FE-02 (`CONTRATO-FRONT-MDFE.md
// §4`, 10 colunas LS001-LS010) + TASK-MDFE-FE-07 (ação "Imprimir" ligada
// nesta mesma tela, `AC006`).
//
// ⚠️ GAP-MDFE-FE-06 (P2) — `integration_status`/`cnpj_contratante`/
// `quantidade_carga`/`valor_carga` ainda NÃO são devolvidos pelo
// `MdfeListResource` real (só existem no `MdfeResource` completo, que o
// index não chama) — renderizam `—` (estado de UI honesto, SEM MOCK) até o
// backend estender o Resource.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiDownload, FiEdit, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { isMdfeDeletable, mdfeEstadoColor } from '@/constants/Fiscal/mdfe-estado-options';
import { queryKey } from '@/constants/query-key';

import { deleteMdfe, downloadMdfeReport } from '@/services/v2/Fiscal/mdfe-service';

import type { MdfeFilterForm, MdfeListItem } from '@/@types/v2/Fiscal/Mdfe';

import { FilterSideMdfe } from './FilterSideMdfe';
import { HeaderTable } from './HeaderTable';
import { useMdfesList } from './useMdfes';

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MdfesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.mdfes.mdfe;

  const canEdit = can('mdfe_edit');
  const canDelete = can('mdfe_delete');
  const canView = can('mdfe_view');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 20, storageKey: 'Mdfes' + queryKey.mdfes.mdfesList }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MdfeFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<MdfeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const mdfesList = useMdfesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ mdfeUuid }: { mdfeUuid: string }) => {
      return await deleteMdfe(mdfeUuid);
    },
    queryKey: queryKey.mdfes.mdfesList,
    queryKey2: queryKey.mdfes.mdfe,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(mdfe: MdfeListItem) {
    setToDelete(mdfe);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ mdfeUuid: toDelete.uuid });
    }
  }

  // TASK-MDFE-FE-07 — download pontual de 1 documento por vez, `isDownloading`
  // local aceitável (mirror `NfeEmissionPanel.tsx::isDownloadingXml`).
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);

  async function handleDownloadReport(mdfeUuid: string) {
    setDownloadingUuid(mdfeUuid);
    try {
      const blob = await downloadMdfeReport(mdfeUuid);
      downloadBlob(blob, `relatorio-mdfe-${mdfeUuid}.pdf`);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.printError });
    } finally {
      setDownloadingUuid(null);
    }
  }

  const columnHelper = createColumnHelper<MdfeListItem>();
  const defaultColumns = useMemo(
    () => [
      // LS001 — indicador de integração (GAP-MDFE-FE-06: ausente no
      // MdfeListResource real hoje, dot vazio até o backend estender).
      columnHelper.accessor('integration_status', {
        header: text.list.table.integrationStatus,
        cell: ({ row }) => {
          const status = row.original.integration_status;
          if (!status) return null;
          return (
            <Box
              boxSize="2.5"
              borderRadius="full"
              bg={status === 'P' ? 'gray.400' : status === 'E' ? 'blue.500' : 'transparent'}
            />
          );
        },
        meta: styleColumTable.sm,
      }),
      // LS002/LS009 — Número MDFe.
      columnHelper.accessor('mdfe_numero', {
        header: text.list.table.numero,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm">
            {row.original.mdfe_numero}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // LS003 — Emissor.
      columnHelper.accessor('issue_razao_social', {
        header: text.list.table.emissor,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.issue_razao_social ?? '—'}
          </Text>
        ),
      }),
      // LS004 — Data início viagem.
      columnHelper.accessor('data_inicio_viagem', {
        header: text.list.table.dataInicioViagem,
        cell: ({ row }) => (
          <Text fontSize="sm">{formatDate(row.original.data_inicio_viagem, 'dd/MM/yyyy')}</Text>
        ),
        meta: styleColumTable.sm,
      }),
      // LS005 — CNPJ Contratante (GAP-MDFE-FE-06).
      columnHelper.accessor('cnpj_contratante', {
        header: text.list.table.cnpjContratante,
        cell: ({ row }) => <Text fontSize="sm">{row.original.cnpj_contratante ?? '—'}</Text>,
      }),
      // LS006 — Estado (Badge, 4 cores exaustivas).
      columnHelper.accessor('estado', {
        header: text.list.table.estado,
        cell: ({ row }) => (
          <Badge colorPalette={mdfeEstadoColor[row.original.estado]} variant="subtle">
            {mdfeEstadoOptionsLabel(row.original.estado, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      // LS007 — Qtd. carga (GAP-MDFE-FE-06).
      columnHelper.accessor('quantidade_carga', {
        header: text.list.table.quantidadeCarga,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.quantidade_carga !== undefined
              ? formatQuantity(row.original.quantidade_carga)
              : '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // LS008 — Valor carga BRL (GAP-MDFE-FE-06).
      columnHelper.accessor('valor_carga', {
        header: text.list.table.valorCarga,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.valor_carga !== undefined
              ? formatCurrencyBRL(row.original.valor_carga)
              : '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // LS010 — Ações.
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => {
          const mdfe = row.original;
          const deletable = isMdfeDeletable(mdfe.estado);
          const editableAction = mdfe.estado !== 'aprovado';
          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() => navigate(`/fiscal/mdfe-lista/${mdfe.uuid}/visualizar`)}
                  >
                    {text.list.actions.view}
                  </Actions.Item>
                )}
                {canEdit && editableAction && (
                  <Actions.Item
                    icon={<Icon as={FiEdit} />}
                    onClick={() => navigate(`/fiscal/mdfe-lista/${mdfe.uuid}`)}
                  >
                    {text.list.actions.edit}
                  </Actions.Item>
                )}
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiDownload} />}
                    onClick={() => handleDownloadReport(mdfe.uuid)}
                    disabled={downloadingUuid === mdfe.uuid}
                  >
                    {text.list.actions.print}
                  </Actions.Item>
                )}
                {canDelete && deletable && (
                  <>
                    <Actions.Separator />
                    <Actions.Item
                      icon={<Icon as={FiTrash2} />}
                      tone="danger"
                      onClick={() => handleDeleteClick(mdfe)}
                    >
                      {text.list.actions.delete}
                    </Actions.Item>
                  </>
                )}
              </Actions>
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, canView, canEdit, canDelete, text, languageGB, downloadingUuid]
  );

  const isLoading = checkLoadingStatus([mdfesList]);
  const items = mdfesList.data?.data?.items;
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
          {isEmpty && !mdfesList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiFileText} boxSize={8} color="fg.muted" />
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
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={mdfesList.isError}
              error={mdfesList.error}
              onRetry={() => mdfesList.refetch()}
              isRetrying={mdfesList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideMdfe
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
        itemName={toDelete ? String(toDelete.mdfe_numero) : undefined}
      />
    </ContainerGrid>
  );
}

// Helper local — evita import circular com `mdfe-estado-options.ts` ao mesmo
// tempo que reusa a fábrica de labels já existente.
function mdfeEstadoOptionsLabel(
  estado: MdfeListItem['estado'],
  languageGB: ReturnType<typeof useLanguage>['languageGB']
): string {
  return languageGB.mdfes.mdfe.estadoOptions[estado] ?? estado;
}
