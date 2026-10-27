// src/pages/Operacional/Budget/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Orçamentos (Budget — Operacional / Vendas,
// F-018, 97-Esteiras/054, TASK-BG-FE-02). Rota `/operacional/orcamentos` —
// guardada por `<RequirePermission permission="budgets_view">`. Item de menu
// (`ope-ven-orc`) e permissão de navegação JÁ EXISTIAM (`navigationTree.ts`/
// `navigationPermissions.ts:622`) — esta Tarefa só conecta a rota real (hoje
// cai no `RoutePlaceholder` do catch-all `/operacional/*`).
//
// Mirror ESTRUTURAL DIRETO de `Administrativo/Requisition/index.tsx` (mesmo
// uso de `useCustomGridQuery`, `Actions`, blob-PDF em nova aba,
// `DeleteConfirmDialog`, `GridSettingsFloatingPanel`).
//
// GAP-BG-FE-07 (achado por leitura direta do backend real, sinalizado ao
// Arquiteto — não fabricado): o contrato de tela (`budgets-frontend-
// contract.md §5.1/§7`) e a fundação (`@/@types/v2/Budgets`, TASK-BG-FE-01)
// previam `client.info` ("nome — nif" composto), `status` como objeto
// `{value,label}` e `user.name` (responsável) vindos do `BudgetListResource`.
// A leitura direta de `app/Http/Resources/V1/BudgetListResource.php` (já
// migrado/testado, BG-03) confirmou um shape DIFERENTE:
//   - `status`: campos FLAT `status`(number)+`status_label`(string) — NUNCA
//     objeto aninhado. Corrigido em `@/@types/v2/Budgets` (era
//     `BudgetStatusRef`) após esta confirmação; gate de editar/excluir usa
//     `status < 3` (numérico, nunca `status_label`).
//
// GAP-BG-07 (revalidação 2026-08-25, `EVIDENCIAS/GAP-BG-07-revalidacao-
// run.md`, ✅ CONCLUÍDO): o backend foi ENRIQUECIDO desde a leitura acima —
// `BudgetListResource`/`BudgetDetailResource` reais AGORA expõem
// `client.nif` (LM-04, `people.name.' - '.people.nif`, exposto como campo
// PRÓPRIO — a SPA compõe "nome - nif" aqui, não o backend) e `responsavel`
// (LM-05, string FLAT `optional(user.people).name`, NÃO mais o objeto
// `user.name` presumido pela fundação). Coluna Cliente compõe
// `client.name + ' - ' + client.nif` (omitindo o nif quando ausente);
// coluna Responsável lê `responsavel` direto, estado honesto `—` só quando
// `null` (LM-05 tolera vazio quando o usuário não tem Pessoa vinculada).
// Status dot SEM texto na própria célula + legenda estática acima da tabela
// (mirror `Operacional/Planejamentos/index.tsx`) — fidelidade a `LM-01` do
// contrato legado ("sem cabeçalho, legenda acima da tabela").
//
// GAP-BG-FE-07 (2ª parte) — "Copiar link público" (`hash`) precisa do
// `BudgetDetailResource` (`GET /budgets/{uuid}`, que EXPÕE `hash`), pois o
// `BudgetListResource` da grid NÃO o inclui. O handler busca o detalhe sob
// demanda (1 request extra, sem fabricar/derivar o hash client-side).
//
// Ação "WhatsApp": o contrato de tela previa um util PURO client-side
// (`budgetWhatsApp.ts`, dependente de `client.cellphone`, nunca exposto). O
// backend real já expõe `GET /budgets/{uuid}/whatsapp` PRONTO (link
// `wa.me` montado no servidor, `BuildBudgetWhatsappLinkAction`) — consumido
// diretamente (`getBudgetWhatsappLink`, extensão aditiva de
// `budget-service.ts`), sem util novo. WhatsApp/E-mail promovem
// `status` 1→2 no servidor (SE-05) — a listagem é re-consultada após as
// duas ações para refletir a mudança.
//
// TASK-BG-FE-05 — os 4 handlers (PDF/WhatsApp/E-mail/Copiar link) foram
// EXTRAÍDOS para `@/hooks/useBudgetActions` (mirror `deleteRequisition`
// quanto ao princípio "handler na camada correta"), para que
// `BudgetDetalhe.tsx` (visualização) os reutilize SEM duplicar (DoD da
// Tarefa). Comportamento idêntico ao antes — só a localização do código
// mudou; `onWhatsappOpened` chama `budgetsList.refetch()` (mesmo racional
// já existente aqui: refletir o status promovido 1→2 no servidor).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { FaWhatsapp } from 'react-icons/fa';
import { FiEdit, FiEye, FiFileText, FiLink, FiMail, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import type { ElementType } from 'react';

import { Actions } from '@/components/Action';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Status } from '@/components/Status';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useBudgetActions } from '@/hooks/useBudgetActions';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { budgetStatusColor } from '@/constants/Budgets/budget-status';
import { budgetStatusOptions } from '@/constants/Budgets/options';
import { queryKey } from '@/constants/query-key';

import { deleteBudget, listBudgets } from '@/services/v2/Budgets/budget-service';
import type { ListBudgetsParams } from '@/services/v2/Budgets/budget-service';

import type { BudgetFilterForm, BudgetListItem } from '@/@types/v2/Budgets';

import { FilterSideBudget } from './FilterSideBudget';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

// Mirror `App\Enums\BudgetStatus` (backend, backed `int`) — limite ATÉ O
// QUAL editar/excluir é permitido, client-side (D08 preservado — o servidor
// NÃO repete a checagem, `GAP-BG-06` já `[AVALIADO]` como "preservar
// client-side"). Gate SEMPRE por `status` numérico, nunca `status_label`.
const BUDGET_EDITABLE_STATUS_THRESHOLD = 3;

const BUDGET_STORAGE_KEY = 'OperacionalBudget' + queryKey.budgets.budgets;

const DATE_FORMAT = 'yyyy-MM-dd';

// Achatamento `BudgetFilterForm` (Option/Date-based) → `ListBudgetsParams`
// (querystring real de `GET /budgets`) — mirror `RequisitionList::
// toRequestFilter`.
// GAP-BG-07 — LM-04: "nome - nif" composto client-side (o backend expõe os 2
// campos separados, `client.name`/`client.nif`, nunca o composto pronto).
// Omite o nif quando ausente (client sem Pessoa vinculada), nunca mostra
// " - " solto.
function formatClientLabel(client: BudgetListItem['client']): string {
  if (!client) return '—';
  if (!client.name) return '—';
  return client.nif ? `${client.name} - ${client.nif}` : client.name;
}

function toRequestFilter(filter?: BudgetFilterForm | null): ListBudgetsParams {
  return {
    search: filter?.search || undefined,
    product_uuid: filter?.product?.value || undefined,
    client_uuid: filter?.client?.value || undefined,
    start_date: filter?.start_date ? format(filter.start_date, DATE_FORMAT) : undefined,
    end_date: filter?.end_date ? format(filter.end_date, DATE_FORMAT) : undefined,
  };
}

export default function BudgetsList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.budgets.budget;

  const canCreate = can('budgets_create');
  const canView = can('budgets_view');
  const canEdit = can('budgets_edit');
  const canDelete = can('budgets_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: BUDGET_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<BudgetFilterForm>(defaultQueryOptions);
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

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  const budgetsList = useCustomGridQuery<BudgetListItem, ListBudgetsParams>({
    asyncFunction: listBudgets,
    queryKey: queryKey.budgets.budgets,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  // ---- Estado de exclusão ---------------------------------------------------
  const [toDelete, setToDelete] = useState<BudgetListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ budgetUuid }: { budgetUuid: string }) => {
      // `deleteBudget` retorna 204 sem body — `undefined` explícito
      // satisfaz o contrato `Promise<Response<any> | undefined>` de
      // `useRequest` (mirror `deleteRequisition`).
      await deleteBudget(budgetUuid);
      return undefined;
    },
    queryKey: queryKey.budgets.budgets,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  function handleDeleteClick(budget: BudgetListItem) {
    setToDelete(budget);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ budgetUuid: toDelete.uuid });
    }
  }

  const isDeleting = deleteMutation.isPending;

  // ---- Ações compartilhadas (PDF/WhatsApp/E-mail/Copiar link) — TASK-BG-FE-05
  // extraiu os 4 handlers para `useBudgetActions` (mirror `deleteRequisition`
  // quanto à camada correta), reutilizado por `BudgetDetalhe.tsx` sem
  // duplicação (DoD da Tarefa). `onWhatsappOpened` preserva o refetch da
  // listagem já existente (status pode ter sido promovido 1→2 no servidor). ----
  const {
    downloadingReportUuid,
    openingWhatsappUuid,
    copyingLinkUuid,
    isSendingEmail,
    sendEmail,
    handleGenerateReport,
    handleWhatsappClick,
    handleCopyPublicLink,
  } = useBudgetActions({
    languageGB,
    onWhatsappOpened: () => budgetsList.refetch(),
  });

  const columnHelper = createColumnHelper<BudgetListItem>();
  const defaultColumns = useMemo(
    () => [
      // LM-01 — dot de status, SEM texto na célula (legenda acima da
      // tabela carrega o significado das cores, mirror `Planejamentos`).
      columnHelper.accessor('status', {
        header: text.list.columns.status,
        enableHiding: false,
        cell: ({ row }) => (
          <Box
            boxSize="2.5"
            borderRadius="full"
            bg={`${budgetStatusColor[row.original.status]}.500`}
            title={row.original.status_label}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.status },
      }),
      columnHelper.accessor('code', {
        header: text.list.columns.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.code },
      }),
      columnHelper.accessor('date', {
        header: text.list.columns.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.date ? formatDate(row.original.date, 'dd/MM/yyyy') : '—'}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.columns.date },
      }),
      columnHelper.accessor((row) => formatClientLabel(row.client), {
        id: 'client',
        header: text.list.columns.client,
        enableHiding: false, // coluna-âncora — nunca ocultável
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {formatClientLabel(row.original.client)}
          </Text>
        ),
        meta: { gridLabel: text.list.columns.client },
      }),
      // LM-05 — "responsável": GAP-BG-07 (revalidação, ✅ CONCLUÍDO) —
      // `BudgetListResource` real agora expõe `responsavel` (string FLAT).
      // Estado honesto `—` só quando `null` (usuário sem Pessoa vinculada).
      columnHelper.accessor((row) => row.responsavel ?? '', {
        id: 'user',
        header: text.list.columns.user,
        cell: ({ row }) => <Text fontSize="sm">{row.original.responsavel ?? '—'}</Text>,
        meta: { gridLabel: text.list.columns.user },
      }),
      columnHelper.accessor('total', {
        header: text.list.columns.total,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCurrencyBRL(row.original.total)}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.columns.total },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const isEditable = row.original.status < BUDGET_EDITABLE_STATUS_THRESHOLD;
          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() =>
                      navigate(`/operacional/orcamentos/${row.original.uuid}/visualizar`)
                    }
                  >
                    {text.list.actions.view}
                  </Actions.Item>
                )}
                {canEdit && isEditable && (
                  <Actions.Item
                    icon={<Icon as={FiEdit} />}
                    onClick={() => navigate(`/operacional/orcamentos/${row.original.uuid}`)}
                  >
                    {text.list.actions.edit}
                  </Actions.Item>
                )}
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FaWhatsapp} />}
                    onClick={() => handleWhatsappClick(row.original.uuid)}
                    disabled={openingWhatsappUuid === row.original.uuid}
                  >
                    {text.list.actions.whatsapp}
                  </Actions.Item>
                )}
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiMail} />}
                    onClick={() => sendEmail(row.original.uuid)}
                    disabled={isSendingEmail}
                  >
                    {text.list.actions.email}
                  </Actions.Item>
                )}
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiFileText} />}
                    onClick={() => handleGenerateReport(row.original.uuid)}
                    disabled={downloadingReportUuid === row.original.uuid}
                  >
                    {text.list.actions.report}
                  </Actions.Item>
                )}
                {canView && (
                  <Actions.Item
                    icon={<Icon as={FiLink} />}
                    onClick={() => handleCopyPublicLink(row.original.uuid)}
                    disabled={copyingLinkUuid === row.original.uuid}
                  >
                    {text.list.actions.copyLink}
                  </Actions.Item>
                )}
                {canDelete && isEditable && (
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(row.original)}
                    tone="danger"
                    disabled={isDeleting}
                  >
                    {text.list.actions.delete}
                  </Actions.Item>
                )}
              </Actions>
            </Flex>
          );
        },
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [
      navigate,
      isDeleting,
      text,
      canView,
      canEdit,
      canDelete,
      languageGB.defaltStrings.actions,
      downloadingReportUuid,
      openingWhatsappUuid,
      copyingLinkUuid,
      isSendingEmail,
      sendEmail,
      handleWhatsappClick,
      handleGenerateReport,
      handleCopyPublicLink,
    ]
  );

  const gridSettings = useGridSettings<BudgetListItem>({
    storageKey: BUDGET_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([budgetsList]);
  const items = budgetsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  // Legenda estática de cores de status — SEMPRE visível (LM-01: "sem
  // cabeçalho, legenda acima da tabela"), mirror `Planejamentos`/
  // `ServiceOrders`/`Appropriations`.
  const statusLegend = useMemo(() => budgetStatusOptions.options(languageGB), [languageGB]);

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
        <HeaderGrid
          header={
            <>
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate('/operacional/orcamentos/novo')}
                  languageGB={languageGB}
                />
              )}
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
            </>
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.singularLabel}
            </Text>
          </VStack>
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Flex gap={5} mt={4} wrap="wrap">
          {statusLegend.map((option) => (
            <Status
              key={option.value}
              text={option.label}
              backgroundColor={`${budgetStatusColor[option.value]}.500`}
              fontSize="sm"
              color="fg.muted"
            />
          ))}
        </Flex>

        <Box>
          <Table
            isLoading={isLoading}
            isError={budgetsList.isError}
            error={budgetsList.error}
            isEmpty={isEmpty}
            onRetry={() => budgetsList.refetch()}
            isRetrying={budgetsList.isFetching}
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
            onCreate={() => navigate('/operacional/orcamentos/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideBudget
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
        itemName={toDelete?.code}
        tone="danger"
      />
    </ContainerGrid>
  );
}
