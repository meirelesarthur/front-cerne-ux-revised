// src/pages/Administrativo/Earning/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Apuração Mensal (Earning — Administrativo,
// 97-Esteiras/002, Tarefas 07/09). Rota `/administrativo/apuracao` —
// guardada por `<RequirePermission permission="earnings_view">`.
//
// Mirror ESTRUTURAL de `Requisition/index.tsx`/`Adiantamento/index.tsx`
// (listagem+filtro+dropdown de ações) — composição visual a partir de
// `PlanoContasLista.tsx`/`PlanoContasImportModal.tsx` (`GAP-EARNING-FE-01`).
//
// F-105 (UT-000731, branch irmã já aprovada da API) — `GET /api/v1/earnings`
// reverteu `GAP-EARNING-FE-02`: agora lista o ROSTER de funcionários
// elegíveis por vínculo em Funcionário x Eventos no período do filtro, não
// só os já lançados. Linha "A apurar" (`is_pay === null`, `uuid === null`,
// `isRosterOnlyEarning`, `earningTotals.ts`) É a forma como o funcionário
// com vínculo aparece ANTES de ter apuração — igual ao legado. Apurar =
// EDITAR essa linha (abre o form por `employee.uuid`, que o upsert por
// employee+período já cria). UT-000716 itens 5/6 continuam valendo: NÃO há
// botão de "Lançar Apuração"/`SelecionarFuncionarioModal` isolado nesta
// tela — apurar é sempre via Editar, nunca criação ad-hoc separada.
//
// ⚠️ ARMADILHA DE IDENTIDADE (confirmada por leitura direta de
// `EarningResource.php`/`EarningController.php`): `EarningListItem.uuid` é
// o uuid PRÓPRIO do `Earning` (usado SÓ no bulk "Gerar Financeiro",
// `earning_uuids[]` — por isso linha "A apurar", sem `Earning`, NUNCA é
// selecionável) — as rotas de Ver/Editar/Excluir (`GET|PUT|DELETE
// /earnings/{employee_uuid}`) são chaveadas pelo uuid do FUNCIONÁRIO
// (`item.employee.uuid`), NUNCA `item.uuid`. Navegação/delete desta tela
// usa SEMPRE `item.employee?.uuid`. Ver/Excluir só existem para linha
// APURADA (`item.uuid !== null` — `GET|DELETE` dariam 404 sem earning);
// Editar continua disponível para AMBAS as formas (é o próprio fluxo de
// apurar).
//
// Seleção múltipla (Tarefa 09, "Gerar Financeiro") — SEM `RowSelectionState`
// nativo do TanStack Table (mesmo racional já documentado em
// `Incomes/index.tsx`: o Chokepoint `TableContext.tsx` não tem precedente
// de row selection habilitado). Estado 100% LOCAL, chaveado pelo uuid
// PRÓPRIO do Earning (`item.uuid` — é ELE que o payload de
// `POST /earnings/expenses` espera).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCalendar, FiEdit, FiEye, FiTrash2, FiUpload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
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
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteEarning, generateEarningExpenses } from '@/services/v2/Earnings/earning-service';

import type {
  EarningFilterForm,
  EarningFilterRequest,
  EarningListItem,
} from '@/@types/v2/Earnings';

import { EarningImportModal } from './EarningImportModal';
import {
  buildDefaultEarningFilter,
  computeEarningTotalFromEvents,
  computeEarningVlChequeFromEvents,
  isRosterOnlyEarning,
} from './earningTotals';
import { FilterSideEarning } from './FilterSideEarning';
import { useEarningsList, useEventCatalog } from './useEarnings';

// UT-000756 — bump INTENCIONAL da storage key (v2 → v3): o legado
// (`agro365/app/Http/Controllers/Admin/EarningController.php:35-39`)
// RECALCULA mês/ano/tipo a CADA visita da tela, sem persistir filtro entre
// visitas. A v2 fixava o default só na PRIMEIRA carga e deixava o
// `localStorage` vencer para sempre depois disso (`getInitialState`,
// `usePaginatedQueryStorage.tsx`) — por isso um filtro salvo (inclusive
// "Limpar filtros" salvando vazio, `GAP` já corrigido em `FilterSideEarning`)
// "congelava" a tela num período velho. O sufixo `-apuracao-filtro-v3`
// aposenta qualquer estado v2 gravado; a partir daqui o filtro aplicado é
// recalculado no MOUNT do componente (ver `useEffect` abaixo) a cada visita
// — decisão do dono (esteira 102/DEC-109): o filtro continua morando no
// drawer `FilterSideEarning` (nunca inline), só o PRÉ-PREENCHIMENTO muda. A
// paginação (pageSize/orderBy) continua podendo persistir normalmente pelo
// `usePaginatedQueryStorage` compartilhado (NÃO alterado).
const EARNING_STORAGE_KEY =
  'AdministrativoEarning' + queryKey.earnings.earnings + '-apuracao-filtro-v3';

/** Chave = uuid PRÓPRIO do Earning — usado no bulk "Gerar Financeiro". */
type RowSelectionMap = Record<string, boolean>;

function formatCurrencyBRL(value: string | number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// UT-000716 item 9 (complemento) — decisão do dono: filtro de Tipo passa a
// filtrar de verdade; a API ganha `?type=` em paralelo
// (`EarningFilterData.php`). O front só precisa ENVIAR o valor — a
// filtragem real acontece no backend.
function toRequestFilter(filter?: EarningFilterForm | null): EarningFilterRequest {
  return {
    employee_uuid: filter?.employee_uuid?.value || undefined,
    function_uuid: filter?.function_uuid?.value || undefined,
    month: filter?.month?.value || undefined,
    year: filter?.year ? Number(filter.year) : undefined,
    type: filter?.type?.value || undefined,
  };
}

export default function EarningList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.earnings.earning;

  const canView = can('earnings_view');
  const canEdit = can('earnings_edit');
  const canDelete = can('earnings_delete');

  // UT-000756 — calculado DENTRO do componente (não no load do módulo) para
  // "mês anterior" recalcular a cada MONTAGEM da tela (visita), mirror
  // legado. `useMemo([])` mantém a MESMA referência durante toda a vida
  // desta instância do componente (re-renders não recalculam o período no
  // meio de uma visita), mas uma nova visita = novo mount = nova instância =
  // recálculo.
  const defaultEarningFilter = useMemo(() => buildDefaultEarningFilter(), []);

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: EARNING_STORAGE_KEY,
      // Usado quando NÃO há filtro persistido em localStorage
      // (`getInitialState`, `usePaginatedQueryStorage.tsx`) — cobre a
      // PRIMEIRA visita de todas (nunca houve state salvo nesta chave).
      filter: defaultEarningFilter,
    }),
    [defaultEarningFilter]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<EarningFilterForm>(defaultQueryOptions);

  // UT-000756 — cobre as visitas SEGUINTES: se já existir filtro salvo em
  // `localStorage` sob `EARNING_STORAGE_KEY` (de uma visita anterior, com
  // "Apurar"/busca por funcionário aplicados), `getInitialState` o restaura
  // e ele venceria o default para sempre (comportamento nativo e
  // DELIBERADO do hook compartilhado — não alterado). Força o filtro
  // aplicado de volta ao default assim que a tela monta, sem tocar
  // `usePaginatedQueryStorage.tsx`. A paginação (pageSize/orderBy) não é
  // tocada por este efeito e continua podendo vir do localStorage.
  useEffect(() => {
    handleFilterChange(defaultEarningFilter);
  }, []);

  // ---- Filtro (drawer) ------------------------------------------------------
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

  const earningsList = useEarningsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: requestFilter,
  });

  // GAP-EARNING-08 [AVALIADO], Opção B — `total`/`vl_cheque` da coluna NÃO
  // vêm mais da coluna persistida crua (pode ficar obsoleta em relação aos
  // eventos atuais, ver `earningTotals.ts`), e sim recalculados a partir de
  // `item.events[]`, mesma fórmula já usada em `CreateOrUpdateEarning.tsx`.
  const eventCatalogQuery = useEventCatalog();

  // ---- Import/Export planilha (Tarefa 09) ------------------------------------
  const { open: isImportOpen, onOpen: onOpenImport, onClose: onCloseImport } = useDisclosure();

  // ---- Exclusão individual — chave é `employee.uuid` (armadilha de
  // identidade, ver cabeçalho) ------------------------------------------------
  const [toDelete, setToDelete] = useState<EarningListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ item }: { item: EarningListItem }) => {
      await deleteEarning(item.employee?.uuid as string, {
        month: item.month,
        year: item.year,
        type: item.type.value,
      });
      return undefined;
    },
    queryKey: queryKey.earnings.earnings,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  function handleDeleteClick(item: EarningListItem) {
    setToDelete(item);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate({ item: toDelete });
    }
  }

  const isDeleting = deleteMutation.isPending;

  // ---- Seleção múltipla + "Gerar Financeiro" (Tarefa 09) ---------------------
  const [rowSelection, setRowSelection] = useState<RowSelectionMap>({});
  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );

  const {
    open: isOpenBulkDialog,
    onOpen: onOpenBulkDialog,
    onClose: onCloseBulkDialog,
  } = useDisclosure();

  const items = earningsList.data?.data?.items ?? [];

  // L-01 (mirror legado) — só linhas NÃO PAGAS são elegíveis para "Gerar
  // Financeiro". F-105 — linha "A apurar" (`isRosterOnlyEarning`, sem
  // `Earning`/`uuid`) NUNCA é selecionável (não há earning_uuid para o
  // payload de `/earnings/expenses`); `!item.is_pay` sozinho ficou
  // ambíguo porque `is_pay === null` também é falsy.
  // Type guard — narrow `uuid: string | null` → `string` para quem passa no
  // filtro, evitando indexar `rowSelection` (Record<string, boolean>) com
  // `null` em `selectableItems`/`toggleSelectAllCurrentPage` abaixo.
  const isRowSelectable = (item: EarningListItem): item is EarningListItem & { uuid: string } =>
    !isRosterOnlyEarning(item) && item.is_pay === false && item.uuid !== null;
  const selectableItems = useMemo(() => items.filter(isRowSelectable), [items]);
  const allCurrentPageSelected =
    selectableItems.length > 0 && selectableItems.every((item) => rowSelection[item.uuid]);

  function toggleRowSelected(uuid: string, checked: boolean) {
    setRowSelection((prev) => {
      const next = { ...prev };
      if (checked) next[uuid] = true;
      else delete next[uuid];
      return next;
    });
  }

  function toggleSelectAllCurrentPage(checked: boolean) {
    setRowSelection((prev) => {
      const next = { ...prev };
      selectableItems.forEach((item) => {
        if (checked) next[item.uuid] = true;
        else delete next[item.uuid];
      });
      return next;
    });
  }

  const generateExpensesMutation = useRequest({
    asyncFunction: async ({ earningUuids }: { earningUuids: string[] }) => {
      return await generateEarningExpenses(earningUuids);
    },
    queryKey: queryKey.earnings.earnings,
    typesRequest: 'update',
    entityName: text.pluralLabel,
    personalizedMessage: text.list.bulk.generateExpensesSuccessToast,
    actionSuccess: () => {
      onCloseBulkDialog();
      setRowSelection({});
    },
  });

  function handleConfirmGenerateExpenses() {
    if (selectedUuids.length > 0) {
      generateExpensesMutation.mutate({ earningUuids: selectedUuids });
    }
  }

  const columnHelper = createColumnHelper<EarningListItem>();
  const defaultColumns = useMemo(
    () => [
      // Coluna de seleção — só existe para quem tem `earnings_edit`
      // ("Gerar Financeiro" é gateado por essa permissão, `GAP-EARNING-02`).
      ...(canEdit
        ? [
            columnHelper.display({
              id: 'selecao',
              header: () => (
                <input
                  type="checkbox"
                  aria-label={text.list.bulk.selectAllLabel}
                  checked={allCurrentPageSelected}
                  onChange={(e) => toggleSelectAllCurrentPage(e.target.checked)}
                />
              ),
              cell: ({ row }) => {
                // F-105 — `isRowSelectable` já garante `uuid !== null` em
                // runtime (linha "A apurar" nunca chega aqui), mas o tipo
                // compartilhado `EarningListItem.uuid` é `string | null` —
                // narrow explícito evita indexar `rowSelection` com `null`.
                const earningUuid = row.original.uuid;
                if (!isRowSelectable(row.original) || !earningUuid) return null;
                return (
                  <input
                    type="checkbox"
                    aria-label={text.list.bulk.selectRowLabel}
                    checked={!!rowSelection[earningUuid]}
                    onChange={(e) => toggleRowSelected(earningUuid, e.target.checked)}
                  />
                );
              },
              meta: { ...styleColumTable.button, gridDataColumn: false },
            }),
          ]
        : []),
      columnHelper.accessor((row) => row.employee?.name ?? '', {
        id: 'employee',
        header: text.list.table.employee,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.employee?.name ?? '—'}
          </Text>
        ),
        meta: { gridLabel: text.list.table.employee },
      }),
      columnHelper.accessor((row) => row.function?.name ?? '', {
        id: 'function',
        header: text.list.table.function,
        cell: ({ row }) => <Text fontSize="sm">{row.original.function?.name ?? '—'}</Text>,
        meta: { ...styleColumTable.md, gridLabel: text.list.table.function },
      }),
      columnHelper.display({
        id: 'period',
        header: text.list.table.period,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {String(row.original.month).padStart(2, '0')}/{row.original.year}
          </Text>
        ),
        meta: { ...styleColumTable.date, gridLabel: text.list.table.period },
      }),
      columnHelper.accessor((row) => row.type?.description ?? '', {
        id: 'type',
        header: text.list.table.type,
        cell: ({ row }) => <Text fontSize="sm">{row.original.type?.description ?? '—'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.type },
      }),
      columnHelper.accessor('total', {
        header: text.list.table.total,
        // F-105 — linha "A apurar" (`events: []`) resultaria em "R$ 0,00"
        // (soma vazia), que é ENGANOSO (parece apuração zerada, não
        // "ainda não apurado"). Mostrar "—" só para essa forma; linha
        // apurada continua recalculando a partir de `events[]`
        // (`GAP-EARNING-08`).
        cell: ({ row }) =>
          isRosterOnlyEarning(row.original) ? (
            <Text fontSize="sm" textAlign="right" color="fg.muted">
              —
            </Text>
          ) : (
            <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
              {formatCurrencyBRL(
                computeEarningTotalFromEvents(row.original.events, eventCatalogQuery.data)
              )}
            </Text>
          ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.total },
      }),
      columnHelper.accessor('vl_cheque', {
        header: text.list.table.vlCheque,
        cell: ({ row }) =>
          isRosterOnlyEarning(row.original) ? (
            <Text fontSize="sm" textAlign="right" color="fg.muted">
              —
            </Text>
          ) : (
            <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
              {formatCurrencyBRL(
                computeEarningVlChequeFromEvents(
                  row.original.events,
                  row.original.vl_account,
                  eventCatalogQuery.data
                )
              )}
            </Text>
          ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.vlCheque },
      }),
      columnHelper.display({
        id: 'isPay',
        header: text.list.table.isPay,
        cell: ({ row }) => {
          // F-105 — roster de elegíveis: `is_pay === null` é a 3ª forma de
          // status ("A apurar"), distinta de Pago/Pendente.
          if (isRosterOnlyEarning(row.original)) {
            return (
              <Badge colorPalette="gray" variant="subtle">
                {text.list.statusLabels.toCalculate}
              </Badge>
            );
          }
          return (
            <Badge colorPalette={row.original.is_pay ? 'green' : 'orange'} variant="subtle">
              {row.original.is_pay ? text.list.statusLabels.paid : text.list.statusLabels.pending}
            </Badge>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.isPay },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const employeeUuid = item.employee?.uuid;
          // F-105 — "Ver"/"Excluir" chamam `GET|DELETE /earnings/{employee_
          // uuid}`, que dão 404 sem um `Earning` lançado — só existem para
          // a forma APURADA (`!isRosterOnlyEarning`). "Editar" continua
          // disponível para AMBAS as formas: é o próprio fluxo de apurar
          // (abre o form por `employee.uuid` + período, salvar faz upsert).
          const isApurado = !isRosterOnlyEarning(item);
          const periodQuery = `?month=${item.month}&year=${item.year}&type=${item.type.value}`;
          return (
            <Flex justify="flex-end">
              <Actions size="sm">
                {canView && isApurado && employeeUuid && (
                  <Actions.Item
                    icon={<Icon as={FiEye} />}
                    onClick={() =>
                      navigate(`/administrativo/apuracao/${employeeUuid}${periodQuery}`)
                    }
                  >
                    {text.list.actions.view}
                  </Actions.Item>
                )}
                {canEdit && employeeUuid && (
                  <Actions.Item
                    icon={<Icon as={FiEdit} />}
                    onClick={() =>
                      navigate(`/administrativo/apuracao/${employeeUuid}/editar${periodQuery}`)
                    }
                  >
                    {text.list.actions.edit}
                  </Actions.Item>
                )}
                {canDelete && isApurado && (
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    onClick={() => handleDeleteClick(item)}
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
      rowSelection,
      allCurrentPageSelected,
      eventCatalogQuery.data,
    ]
  );

  const isLoading = checkLoadingStatus([earningsList, eventCatalogQuery as any]);
  const isEmpty = !isLoading && items.length === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        // F-105 — `item.uuid` (earning próprio) vem `null` na linha "A
        // apurar" (roster); `employee.uuid` é SEMPRE presente nas duas
        // formas e único por página (1 linha por funcionário/período) —
        // chave de linha estável, evita `row.id` colidir/null no React
        // quando múltiplas linhas "A apurar" compartilhariam `uuid:null`.
        getRowId={(row: EarningListItem) => row.employee?.uuid ?? row.uuid ?? ''}
      >
        <HeaderGrid
          header={
            <>
              <Button
                title={text.list.importButton}
                icon={FiUpload as ElementType}
                variant="outline"
                size="sm"
                onClick={onOpenImport}
              />
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </>
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.singularLabel}
            </Text>
          </VStack>
        </HeaderGrid>

        {/* Barra de ação em lote (Tarefa 09, "Gerar Financeiro") */}
        {selectedUuids.length > 0 && (
          <Flex
            mt={4}
            p={3}
            borderRadius="md"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border.subtle"
            align="center"
            justify="space-between"
            gap={3}
          >
            <Text fontSize="sm">
              {selectedUuids.length} {text.list.bulk.selectedCountLabel}
            </Text>
            <Button
              title={text.list.bulk.generateExpensesButton}
              size="sm"
              onClick={onOpenBulkDialog}
            />
          </Flex>
        )}

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={earningsList.isError}
            error={earningsList.error}
            isEmpty={isEmpty}
            onRetry={() => earningsList.refetch()}
            isRetrying={earningsList.isFetching}
            emptyIcon={FiCalendar as ElementType}
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
          />
        </Box>
      </TableProvider>

      <FilterSideEarning
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <EarningImportModal isOpen={isImportOpen} onClose={onCloseImport} />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.employee?.name ?? undefined}
        tone="danger"
      />

      <DeleteConfirmDialog
        isOpen={isOpenBulkDialog}
        onClose={onCloseBulkDialog}
        onConfirm={handleConfirmGenerateExpenses}
        isLoading={generateExpensesMutation.isPending}
        title={text.list.bulk.generateExpensesConfirmTitle}
        description={text.list.bulk.generateExpensesConfirmDescription}
        confirmButtonText={text.list.bulk.generateExpensesConfirmButton}
        colorPalette="green"
        hideQuestionMark
        tone="info"
      />
    </ContainerGrid>
  );
}
