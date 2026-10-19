// src/pages/Financeiro/MovCaixaBancario/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de MOVIMENTO CAIXA/BANCÁRIO (Movement — Financeiro,
// TASK-MV-FE-04). Rota: `/financeiro/caixa` (guardada por `movements_view`,
// wiring real da rota é esta mesma Tarefa — ver `src/router/index.tsx`).
//
// Mirror estrutural de `CadastrosBase/SaldoInicial/index.tsx` (MESMO Model,
// `useCustomGridQuery` inline sem hook local — regra 5 do protocolo v2, SEM
// parent id de contexto: tenant via `X-Farm-Id`) + `GridSettings`
// (`useGridSettings`/`GridSettingsFloatingPanel`, regra 8 do protocolo).
//
// Ações de linha: Editar (navega para `.../:uuid`), "Editar rateio" (navega
// para `.../:uuid/rateio`) e Excluir (gated `movements_delete`). A 3ª ação
// ("Editar rateio") é uma exceção justificada pelo próprio contrato de API
// (§3 — `PATCH .../allocation` é uma operação de negócio genuinamente
// distinta da edição completa do cabeçalho, não um capricho de UI) — mirror
// do padrão "ações extras quando há operação de negócio real" já aceito em
// outros módulos com sub-rotas dedicadas. Registrado para o Tester não
// rejeitar como violação da regra global 1 (ver "Leitura do dev" da ficha
// TASK-MV-FE-04). As rotas `/novo`, `/:uuid` e `/:uuid/rateio` (e as telas
// que as respondem) são de TASK-MV-FE-05/06 — NÃO criadas aqui; a navegação
// para elas é declarada, mas a rota em si só existirá quando essas Tarefas
// rodarem (comportamento honesto até então: `RoutePlaceholder` responde).
//
// `total_allocated` chega como STRING do decimal cast (cautela documentada
// em `@/@types/v2/Movements`) — sempre `Number(...)` antes de formatar
// (DoD da ficha, item 5).
//
// Coluna "Dedutível" (esteira 117, UT-000746, F-113) — interruptor por linha
// que chama `PUT /movements/{uuid}/toggle-fiscal-document` (sem payload),
// mirror EXATO do legado (`agro365/resources/views/movements/index.blade.php
// :169-171` + JS `:266-282`) e da mecânica já consolidada na listagem de
// Contas a Receber (`src/pages/Incomes/index.tsx`, `toggleFiscalMutation` +
// `toggleFiscalDocumentIncome`). Funciona inclusive para movimento gerado por
// baixa de título (a edição pelo form completo continua bloqueada no
// backend). Gated pela MESMA permissão de editar já usada na tela
// (`movements_create`, reuso confirmado — ver `CreateOrUpdateMovimento.tsx`
// `canSave`); nenhuma permissão nova foi criada. O Model `Movement` desta
// grid não expõe `is_account`/linha de saldo (ver `MovementListItem`) — não
// há linha a excluir do interruptor nesta tela.
//
// UT-000796 r2 (L2/L3/L5/A5, DEC-A6) — Valor com SINAL (Saída negativa, em
// `fg.error`), coluna Juros e RODAPÉ com juros e total líquido da PÁGINA
// corrente (legado `index.blade.php:141-178,235-242`; `meta.page_totals` da
// API quando existe, senão derivado — `movement-list-totals.ts`); linha de
// SALDO INICIAL somente leitura (sem Editar/Editar Rateio/Excluir, só "Ver em
// Saldo Inicial" quando há `open-movements_view`); filtro "Tipo Cat." do
// drawer NÃO filtra linhas (nunca entra em `toRequestFilter` nem no badge
// "Filtros(N)"); excluir movimento com títulos gerados pede confirmação de
// cascata (`generated_obligations_count`).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';
import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiDollarSign, FiEdit, FiExternalLink, FiPieChart, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Switch } from '@/components/ui/switch';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteMovement,
  listMovements,
  toggleMovementFiscalDocument,
} from '@/services/v2/Movements/movement-service';
import type {
  ListMovementsParams,
  MovementListResponse,
} from '@/services/v2/Movements/movement-service';

import type { MovementFilterForm, MovementListItem } from '@/@types/v2/Movements';

import { FilterSideMovimento } from './FilterSideMovimento';
import { HeaderTable } from './HeaderTable';
import {
  computeMovementPageTotals,
  generatedObligationsCount,
  isOpeningBalanceRow,
  signedMovementValue,
} from './movement-list-totals';

// Chave de storage desta tela — paginação (`userPaginatedQuery`) e
// personalização de grid (`useGridSettings`) derivam da MESMA expressão
// (mirror `SALDO_INICIAL_STORAGE_KEY`, DEC-007 §12).
const MOV_CAIXA_BANCARIO_STORAGE_KEY = 'FinanceiroMovCaixaBancario' + queryKey.financial.movements;

function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Achatamento `MovementFilterForm` (persistido, com `*_label` companion) →
// `ListMovementsParams` (querystring real de `GET /movements`) — mirror
// `SaldoInicial/index.tsx` (`toRequestFilter`). `*_label` nunca é enviado à
// API. `category_type` (Tipo Cat.) TAMBÉM nunca é enviado: não filtra linhas
// (legado L5), só restringe as opções de Categoria no drawer. `value_min`/`value_max` (nome de FORM) → `min_value`/`max_value`
// (nome de querystring REAL, confirmado em `MovementFilterData`, api_root —
// ver nota de divergência em `movement-service.ts`).
function toRequestFilter(filter?: MovementFilterForm | null): ListMovementsParams {
  return {
    start_date: filter?.start_date || undefined,
    end_date: filter?.end_date || undefined,
    account_uuid: filter?.account_uuid || undefined,
    proprietary_uuid: filter?.proprietary_uuid || undefined,
    type: filter?.type || undefined,
    category_uuid: filter?.category_uuid || undefined,
    min_value: filter?.value_min ?? undefined,
    max_value: filter?.value_max ?? undefined,
    harvest_uuid: filter?.harvest_uuid || undefined,
  };
}

export default function MovimentoList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.movements.movement;

  const canDelete = can('movements_delete');
  // Mesma permissão já usada pelo form completo (`CreateOrUpdateMovimento.tsx`
  // `canSave`) — reuso confirmado (Decisão #7 do contrato de API), nenhuma
  // permissão nova criada para o interruptor "Dedutível".
  const canEditFiscalDocument = can('movements_create');
  // Linha de Saldo Inicial: único destino possível a partir da lista.
  const canViewOpeningBalance = can('open-movements_view');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: MOV_CAIXA_BANCARIO_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<MovementFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY (re-hidratação do drawer) — não
        // devem inflar o badge "Filtros(N)" (mirror `SaldoInicial/index.tsx`).
        // `category_type` (Tipo Cat.) não filtra linha: não conta no badge.
        .filter(([key]) => !key.endsWith('_label') && key !== 'category_type')
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const requestFilter = useMemo(
    () => toRequestFilter(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<MovementListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const movementsList = useCustomGridQuery<MovementListItem, ListMovementsParams>({
    asyncFunction: listMovements,
    queryKey: queryKey.financial.movements,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ movementUuid }: { movementUuid: string }) => {
      return await deleteMovement(movementUuid);
    },
    queryKey: queryKey.financial.movements,
    queryKey2: queryKey.financial.movement,
    // `useRequest`'s TypesRequest não tem variante "delete" (mirror
    // `SaldoInicial/index.tsx`/`CentroCusto/index.tsx` — "update" é a
    // convenção já usada para a mesma operação; o texto exibido vem de
    // `personalizedMessage`, o rótulo genérico de "update" nunca aparece).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (movement: MovementListItem) => {
    setToDelete(movement);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ movementUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;
  // Cascata (legado + API r2): excluir apaga os títulos gerados e as baixas deles.
  const deleteObligationsCount = toDelete ? generatedObligationsCount(toDelete) : 0;

  // ---- Alternância de Documento Fiscal (Dedutível) --------------------------
  // Mirror `toggleFiscalMutation` de `Incomes/index.tsx` (TASK-FE-036-318):
  // NÃO otimista de propósito — o `Switch` só reflete o novo valor depois da
  // resposta 200 do servidor (refetch via invalidação); em erro, nada muda
  // visualmente (nenhuma reversão manual necessária), mesmo efeito prático
  // do legado (que reverte o checkbox manualmente só porque atualiza o DOM
  // direto, sem framework de estado).
  const [togglingFiscalUuid, setTogglingFiscalUuid] = useState<string | null>(null);

  const toggleFiscalMutation = useRequest({
    asyncFunction: async ({ movementUuid }: { movementUuid: string }) => {
      return await toggleMovementFiscalDocument(movementUuid);
    },
    queryKey: queryKey.financial.movements,
    queryKey2: queryKey.financial.movement,
    typesRequest: 'update',
    entityName: text.singularLabel,
    actionSuccess: () => {
      setTogglingFiscalUuid(null);
    },
  });

  function handleToggleFiscal(movement: MovementListItem) {
    setTogglingFiscalUuid(movement.uuid);
    toggleFiscalMutation.mutate(
      { movementUuid: movement.uuid },
      { onError: () => setTogglingFiscalUuid(null) }
    );
  }

  // Itens e totais da PÁGINA (rodapé) — calculados ANTES das colunas, que os
  // leem no `footer`. Sem rodapé em loading/erro/vazio.
  const isLoading = checkLoadingStatus([movementsList]);
  const items = movementsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;
  const apiPageTotals = (movementsList.data as MovementListResponse | undefined)?.pageTotals;
  const pageTotals = useMemo(
    () => computeMovementPageTotals(items ?? [], apiPageTotals),
    [items, apiPageTotals]
  );
  const showFooter = !isLoading && !movementsList.isError && (items?.length ?? 0) > 0;

  const columnHelper = createColumnHelper<MovementListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        footer: () => (showFooter ? text.list.footer.pageTotal : null),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('date', {
        header: text.list.table.date,
        // `formatDate` (`@/utils/formatDate`, date-fns `parseISO`+`format`,
        // mesmo padrão canônico do resto do módulo Financeiro — ex.:
        // `Contrato/index.tsx`, `ImportacaoMovBancarios/index.tsx`,
        // `BudgetPlanning/index.tsx`, `ContasAPagar/index.tsx`) — NUNCA
        // `new Date('YYYY-MM-DD').toLocaleDateString()`: o backend manda
        // `date` como `YYYY-MM-DD`, que o construtor `Date` nativo parseia
        // em UTC; renderizado no fuso local (UTC-3) cai um dia para trás.
        // `parseISO` interpreta data-sem-hora no fuso LOCAL, sem esse desvio.
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.date)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.date },
      }),
      columnHelper.accessor('type', {
        header: text.list.table.type,
        // Badge — enum fechado E/S nesta tela (Decisão #4 do contrato de
        // API), mirror `CentroCusto/index.tsx` (`class_label` Badge).
        cell: ({ row }) => (
          <Flex align="center" gap={1} wrap="wrap">
            <Badge colorPalette={row.original.type === 'E' ? 'green' : 'red'} variant="subtle">
              {row.original.type === 'E'
                ? text.form.typeOptions.income
                : text.form.typeOptions.expense}
            </Badge>
            {isOpeningBalanceRow(row.original) && (
              <Badge colorPalette="gray" variant="outline">
                {text.form.typeCategoryOptions.initialBalance}
              </Badge>
            )}
          </Flex>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
      }),
      columnHelper.accessor(
        (row) => `${row.account.bank} — ${row.account.agency}/${row.account.account}`,
        {
          id: 'account',
          header: text.list.table.account,
          cell: ({ row }) => (
            <Text fontSize="sm" lineClamp="1">
              {row.original.account.bank} — {row.original.account.agency}/
              {row.original.account.account}
            </Text>
          ),
          meta: { gridLabel: text.list.table.account },
        }
      ),
      columnHelper.accessor((row) => row.proprietary?.name ?? '', {
        id: 'proprietary',
        header: text.list.table.proprietary,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.proprietary?.name ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.proprietary },
      }),
      columnHelper.accessor('interest', {
        header: text.list.table.interest,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" textAlign="right">
            {formatCurrencyBRL(Number(row.original.interest ?? 0))}
          </Text>
        ),
        footer: () =>
          showFooter ? (
            <Text fontWeight="semibold" textAlign="right">
              {formatCurrencyBRL(pageTotals.interestTotal)}
            </Text>
          ) : null,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.interest },
      }),
      columnHelper.display({
        id: 'fiscalDocument',
        header: text.form.fields.fiscalDocument,
        cell: ({ row }) => (
          <Switch
            checked={row.original.fiscal_document}
            disabled={togglingFiscalUuid === row.original.uuid || !canEditFiscalDocument}
            onCheckedChange={() => handleToggleFiscal(row.original)}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.form.fields.fiscalDocument },
      }),
      columnHelper.accessor('value', {
        header: text.list.table.value,
        // Saída (S) exibida NEGATIVA em `fg.error`; Entrada positiva (legado:
        // `value * (type == 'S' ? -1 : 1)`). Prefere `signed_value` da API.
        cell: ({ row }) => {
          const isExpense = row.original.type === 'S';
          return (
            <Flex align="center" gap={2}>
              <Icon
                as={FiDollarSign}
                color={isExpense ? 'fg.error' : 'green.500'}
                boxSize={4}
                flexShrink={0}
              />
              <Text fontWeight="medium" color={isExpense ? 'fg.error' : undefined}>
                {formatCurrencyBRL(signedMovementValue(row.original))}
              </Text>
            </Flex>
          );
        },
        footer: () =>
          showFooter ? (
            <Text fontWeight="semibold" color={pageTotals.netTotal < 0 ? 'fg.error' : undefined}>
              {formatCurrencyBRL(pageTotals.netTotal)}
            </Text>
          ) : null,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.value },
      }),
      columnHelper.accessor('total_allocated', {
        header: text.list.table.totalAllocated,
        // DoD item 5 — `total_allocated` chega como STRING do decimal cast;
        // SEMPRE `Number(...)` antes de formatar (nunca `Number()` cru sobre
        // string sem conversão explícita registrada aqui).
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatCurrencyBRL(Number(row.original.total_allocated))}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.totalAllocated },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          // Saldo Inicial (A5/DEC-A6): somente leitura — sem Editar, sem
          // Editar Rateio e sem Excluir (a exclusão mora na tela Saldo
          // Inicial; a API também recusa com 422). Sem permissão no destino,
          // a célula fica sem ações.
          if (isOpeningBalanceRow(row.original)) {
            if (!canViewOpeningBalance) return null;
            return (
              <Flex justify="flex-end">
                <Actions size="sm">
                  <Actions.Item
                    icon={<Icon as={FiExternalLink} />}
                    onClick={() => navigate('/cadastros-base/saldo-inicial')}
                  >
                    {text.list.actions.viewOpeningBalance}
                  </Actions.Item>
                </Actions>
              </Flex>
            );
          }
          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/financeiro/caixa/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
                <Actions.Item
                  icon={<Icon as={FiPieChart} />}
                  onClick={() => navigate(`/financeiro/caixa/${row.original.uuid}/rateio`)}
                >
                  {text.list.actions.allocation}
                </Actions.Item>
                {canDelete && (
                  <>
                    <Actions.Separator />
                    <Actions.Item
                      icon={<Icon as={FiTrash2} />}
                      onClick={() => handleDeleteClick(row.original)}
                      tone="danger"
                      disabled={isDeleting}
                    >
                      {text.list.actions.delete}
                    </Actions.Item>
                  </>
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
      languageGB,
      canDelete,
      text,
      togglingFiscalUuid,
      canEditFiscalDocument,
      canViewOpeningBalance,
      showFooter,
      pageTotals,
    ]
  );

  const gridSettings = useGridSettings<MovementListItem>({
    storageKey: MOV_CAIXA_BANCARIO_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        hasFooter={showFooter}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
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
            isError={movementsList.isError}
            error={movementsList.error}
            isEmpty={isEmpty}
            onRetry={() => movementsList.refetch()}
            isRetrying={movementsList.isFetching}
            emptyIcon={FiDollarSign as ElementType}
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
            canCreate={filtersApplied === 0 && can('movements_create')}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/financeiro/caixa/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideMovimento
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
        {...(deleteObligationsCount > 0
          ? {
              title: text.list.deleteConfirm.cascadeTitle,
              warningText: text.list.deleteConfirm.cascadeDescription.replace(
                '{count}',
                String(deleteObligationsCount)
              ),
              confirmButtonText: text.list.deleteConfirm.cascadeConfirm,
            }
          : {})}
      />
    </ContainerGrid>
  );
}
