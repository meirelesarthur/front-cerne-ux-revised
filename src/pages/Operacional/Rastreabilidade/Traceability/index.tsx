// src/pages/Operacional/Rastreabilidade/Traceability/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Produtos (Rastreabilidade, F-067) — Operacional
// > Agricultura > Rastreabilidade > Produtos. TASK-TR-FE-05 (esteira
// `97-Esteiras/058`), contrato de tela `## 4.1`, mirror `Operacional/
// Carregamento/index.tsx` (delete+ações) e `Operacional/Monitoring/index.tsx`
// (listagem global sem ID de contexto, `useCustomGridQuery`).
//
// Rota (nasce em `TASK-TR-FE-11`, fora do escopo desta Tarefa):
// `/operacional/rastreabilidade/produtos`, guardada por `traceab_view`.
//
// Colunas (`list_manifest` LM-01..07, ORDEM EXATA do legado, `## 4.1` do
// contrato de tela): Produto · Nome do produto · Código de rastreio · Data
// de colheita · Área · Produtor · Embalagem · Ações.
//
// Sem Zustand — fazenda ativa via `AuthContext`/interceptor (`X-Farm-Id`);
// paginação/filtro por `userPaginatedQuery` (Storage), `storageKey` conforme
// a ficha da Tarefa (módulo + queryKey + fazenda ativa — o filtro/paginação
// NÃO deve vazar entre fazendas diferentes).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Text, useDisclosure } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiPackage } from 'react-icons/fi';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteTraceability,
  getAllTraceabilities,
  getTraceabilityTag,
} from '@/services/v2/Rastreabilidade/traceability-service';
import type { TraceabilityTagLang } from '@/services/v2/Rastreabilidade/traceability-service';

import type {
  TraceabilityFilterForm,
  TraceabilityListItem,
} from '@/@types/v2/Rastreabilidade/traceability';

import { FilterSideTraceability } from './FilterSideTraceability';
import { HeaderTable } from './HeaderTable';
import { TraceabilityActionsMenu } from './TraceabilityActionsMenu';

import { PageHeader } from '@/components/ui/PageHeader';

// Seletor de itens por página — mirror `Carregamento/index.tsx`. NUNCA 200:
// o servidor valida `per_page` como `max:100`.
const PAGE_SIZE_OPTIONS = [10, 30, 50, 100];

const TRACEABILITY_PRODUCTS_BASE_ROUTE = '/operacional/rastreabilidade/produtos';

// AM-02 (contrato legado) — o legado apontava para uma rota EXTERNA fixa do
// admin (`C048`/`SE-08`, `https://agro365.app/admin/rastreio`). FUP-TR-FE-05-01:
// a divergência anterior (`tracking_code` usado como `code` por o Resource de
// listagem ainda não expor `hash`) foi FECHADA — o backend passou a expor
// `hash` em `TraceabilityListResource` (mesmo checksum do QR da
// etiqueta/`SE-08`). TASK-TR-VER-01 (opção 2, decisão do dono): a página
// pública `/rastreio` agora existe NO PRÓPRIO app — o link usa o domínio
// dinâmico (`window.location.origin`), nunca um hostname fixo, para servir
// dev/staging/prod sem config. `handleView` usa `row.hash`.
const PUBLIC_TRACEABILITY_ROUTE = '/rastreio';

export default function TraceabilityList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.rastreabilidade.traceability;

  const canEdit = can('traceab_edit');
  const canDelete = can('traceab_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey:
        languageGB.rastreabilidade.titleModule +
        queryKey.rastreabilidade.traceabilities +
        (activeFarmUuid ?? ''),
    }),
    [languageGB.rastreabilidade.titleModule, activeFarmUuid]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<TraceabilityFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // `product_label` é o companion DISPLAY-ONLY de re-hidratação do
  // `SelectAsyncPaginate` — nunca conta como filtro aplicado (mesma regra de
  // `Carregamento/index.tsx`).
  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        .filter(([key]) => !key.endsWith('_label'))
        .filter(([, v]) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const traceabilitiesList = useCustomGridQuery<TraceabilityListItem, TraceabilityFilterForm>({
    asyncFunction: getAllTraceabilities,
    queryKey: queryKey.rastreabilidade.traceabilities,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as TraceabilityFilterForm),
  });

  // ---- Estado de exclusão (AM-04, gate `traceab_delete`, mirror IG-10) ----
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<TraceabilityListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => deleteTraceability(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.rastreabilidade.traceabilities] });

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

  function handleDeleteClick(item: TraceabilityListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  // ---- "Ver" (AM-02) — rastreio público, sem gate ---------------------------
  // FUP-TR-FE-05-01: `code` da URL pública usa `hash` (bate com o QR da
  // etiqueta), não mais `tracking_code`. Fallback defensivo para
  // `tracking_code` se `hash` vier ausente/vazio (payload inconsistente do
  // backend) — nunca deixa o link quebrado. TASK-TR-VER-01: destino é a
  // página pública `/rastreio` NO PRÓPRIO domínio do app (`window.location.
  // origin`), não mais o hostname legado fixo.
  function handleView(item: TraceabilityListItem) {
    const code = item.hash || item.tracking_code;
    window.open(
      `${window.location.origin}${PUBLIC_TRACEABILITY_ROUTE}?code=${encodeURIComponent(code)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  // ---- "Etiqueta" ×3 (AM-06, TASK-TR-FE-08) — PDF blob, single-flight por
  // linha. Guarda `uuid` + `lang` (não só o `uuid`) para o menu poder exibir
  // o `Spinner` no ícone do idioma que está de fato baixando (estado de UI
  // "loading" exigido pelo contrato de tela `## 7`), mantendo os outros 2
  // idiomas desabilitados-sem-spinner enquanto isso.
  const [tagDownloading, setTagDownloading] = useState<{
    uuid: string;
    lang: TraceabilityTagLang;
  } | null>(null);

  async function handleOpenTag(item: TraceabilityListItem, lang: TraceabilityTagLang) {
    setTagDownloading({ uuid: item.uuid, lang });
    try {
      const blob = await getTraceabilityTag(item.uuid, lang);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      // Revoga depois de dar tempo à nova aba de terminar de carregar o PDF —
      // mirror `downloadChargeReportByProduct` (blob de vida curta, cliente).
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    } finally {
      setTagDownloading(null);
    }
  }

  const columnHelper = createColumnHelper<TraceabilityListItem>();
  const defaultColumns = useMemo(
    () => [
      // LM-01 — Produto
      columnHelper.accessor((row) => row.product.description, {
        id: 'product',
        header: text.list.table.product,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.product.description}</Text>,
        meta: styleColumTable.sm,
      }),
      // LM-02 — Nome do produto
      columnHelper.accessor('name_pt', {
        header: text.list.table.namePt,
        cell: ({ row }) => <Text fontSize="sm">{row.original.name_pt}</Text>,
        meta: styleColumTable.sm,
      }),
      // LM-03 — Código de rastreio
      columnHelper.accessor('tracking_code', {
        header: text.list.table.trackingCode,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm">
            {row.original.tracking_code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // LM-04 — Data de colheita (`brDate` do legado, formatação SÓ na exibição)
      columnHelper.accessor('harvested_in', {
        header: text.list.table.harvestedIn,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.harvested_in)}</Text>,
        meta: styleColumTable.date,
      }),
      // LM-05 — Área (vazio quando ausente)
      columnHelper.accessor((row) => row.area?.description ?? '', {
        id: 'area',
        header: text.list.table.area,
        cell: ({ row }) => <Text fontSize="sm">{row.original.area?.description ?? '—'}</Text>,
        meta: styleColumTable.sm,
      }),
      // LM-06 — Produtor (`item.config.name` do legado → `traceability_config.name`)
      columnHelper.accessor((row) => row.traceability_config.name, {
        id: 'producer',
        header: text.list.table.producer,
        cell: ({ row }) => <Text fontSize="sm">{row.original.traceability_config.name}</Text>,
        meta: styleColumTable.sm,
      }),
      // LM-07 — Embalagem
      columnHelper.accessor('packing', {
        header: text.list.table.packing,
        cell: ({ row }) => <Text fontSize="sm">{row.original.packing}</Text>,
        meta: styleColumTable.sm,
      }),
      // Ações — AM-02..06 (Ver/Editar/Excluir/Galeria/Etiqueta×3)
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Flex justify="flex-end">
              <TraceabilityActionsMenu
                canEdit={canEdit}
                canDelete={canDelete}
                isDeleting={isDeleting}
                tagDownloadingLang={tagDownloading?.uuid === item.uuid ? tagDownloading.lang : null}
                onView={() => handleView(item)}
                onEdit={() => navigate(`${TRACEABILITY_PRODUCTS_BASE_ROUTE}/${item.uuid}`)}
                onDelete={() => handleDeleteClick(item)}
                onGallery={() =>
                  navigate(`${TRACEABILITY_PRODUCTS_BASE_ROUTE}/${item.uuid}/galeria`)
                }
                onTagPt={() => handleOpenTag(item, 'pt-br')}
                onTagEn={() => handleOpenTag(item, 'en')}
                onTagEs={() => handleOpenTag(item, 'es')}
                labels={{
                  view: text.list.actions.view,
                  edit: text.list.actions.edit,
                  delete: text.list.actions.delete,
                  gallery: text.list.actions.gallery,
                  tagPt: text.list.actions.tagPt,
                  tagEn: text.list.actions.tagEn,
                  tagEs: text.list.actions.tagEs,
                }}
              />
            </Flex>
          );
        },
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, tagDownloading, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([traceabilitiesList]);
  const items = traceabilitiesList.data?.data?.items;
  const isEmpty = !isLoading && !traceabilitiesList.isError && (items?.length ?? 0) === 0;
  const canCreate = can('traceab_create');

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

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            isError={traceabilitiesList.isError}
            error={traceabilitiesList.error}
            isEmpty={isEmpty}
            onRetry={() => traceabilitiesList.refetch()}
            isRetrying={traceabilitiesList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={FiPackage as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${TRACEABILITY_PRODUCTS_BASE_ROUTE}/create`)}
          />
        </Box>
      </TableProvider>

      <FilterSideTraceability
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
        title={text.list.deleteDialog.title}
        description={
          toDelete
            ? text.list.deleteDialog.descriptionTemplate.replace('{name}', toDelete.name_pt)
            : undefined
        }
        hideQuestionMark
        tone="danger"
      />
    </ContainerGrid>
  );
}
