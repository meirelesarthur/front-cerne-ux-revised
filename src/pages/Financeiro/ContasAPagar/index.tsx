// src/pages/Financeiro/ContasAPagar/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de Expense ("Contas a Pagar") — esteira 036,
// TASK-FE-036-102. Mirror estrutural de `Invoices/index.tsx` (casca
// ContainerGrid/TableProvider/HeaderGrid/Table/ButtonAdd/ButtonFilter/
// DeleteConfirmDialog/EmptyState).
//
// Colunas: Número/Código, Fornecedor, Parcela, Dt. Emissão, Vencimento,
// Valor, Saldo, Forma de Pagamento, Status (badge computado no client,
// GAP-FE-036-108), Ações. Datas localizadas via `formatDate` (esteira
// 036fix, audit "Vencimento/Emissão ... Renderiza ISO cru") — a API já
// devolve `dt_emission`/`due_date` em ISO (`YYYY-MM-DD`), o client formata.
//
// `type` (Tipo de Título, NÃO Tipo de Nota — `Expense::type()` é
// `belongsTo(TypeTitle::class)`, achado real do audit E-02, o comentário
// anterior deste arquivo estava invertido) já vem eager-loaded no `index`
// (`ExpenseRepository::listWithFilters`), mas a coluna "Tipo de Título"
// segue FORA do escopo desta correção de fidelidade (não pedida na Tarefa
// 036fix) — só `installment` foi adicionado, coluna cujo dado a API já
// entrega e que estava simplesmente ausente.
//
// Seleção múltipla + exclusão em lote (esteira 036, TASK-FE-036 bulk delete
// CaP) — paridade de UI e comportamento com `Incomes/index.tsx` (coluna de
// checkbox + "selecionar todos", gateada por `expenses_delete`, chaveada por
// `uuid` — NUNCA índice de linha; botão "Excluir selecionados" que aparece
// quando há linhas selecionadas, abre `DeleteConfirmDialog` e chama
// `multipleDestroyExpenses`). Estado 100% LOCAL, mesma técnica/racional do
// Chokepoint documentado em `Incomes/index.tsx` (sem `RowSelectionState`
// nativo do TanStack Table).
//
// Elegibilidade por linha — mirror EXATO do legado (`expenses/index.blade.
// php:245`, `@if ($item->balance > 0 && !in_array($item->payment_type, [4,
// 5]))`): só títulos com saldo em aberto e que NÃO são Adiantamento
// (payment_type 4) nem Fatura (payment_type 5) podem ser selecionados para a
// exclusão em lote. "Selecionar todos" opera só sobre as linhas elegíveis da
// página (mirror `Incomes/index.tsx`).
//
// Baixa manual (AM08/AM10, esteira 036, TASK-FE-036-118, ONDA 3 sub-onda 3a)
// — ação "Baixas" abre um Drawer dedicado (mirror `FilterSide.tsx`) que
// consome o módulo COMPARTILHADO de baixa manual (`WriteOffCreateModal`/
// `WriteOffActiveList`, Tarefas 330/331/332, `segment='expenses'`) — NENHUM
// desses arquivos compartilhados é tocado aqui, só consumido. Mirror
// estrutural de `Incomes/IncomeDetalhe.tsx` (único outro consumidor real do
// módulo hoje): `WriteOffActiveList` é sempre renderizado (visão das baixas
// ativas REAIS do título, busca própria por `uuid`+`segment`, nunca o
// resumo cacheado `write_offs` da coluna LM12/grid), e "Nova baixa" só
// aparece quando `isExpenseEligibleForNewWriteOff` (AM08) vale.
//
// Baixa EM LOTE (AM14, esteira 036, TASK-FE-036-119, ONDA 3 sub-onda 3b) —
// botão "Baixar selecionados" na MESMA barra de ação em lote da exclusão
// (`selectedUuids`/`rowSelection` já existentes, nenhuma 2ª coluna de
// checkbox), consumindo o módulo COMPARTILHADO `WriteOffBatchModal`
// (`segment='expenses'`, Tarefas 334/335) — não editado aqui. Elegibilidade
// de QUEM entra no lote é `isExpenseEligibleForNewWriteOff` (AM08, mesma
// condição do `WriteOffCreateModal` individual, agora extraída para
// `utils/expense-guards.ts` para os 2 consumidores compartilharem a mesma
// fórmula) — DIFERENTE de `isRowSelectable` (exclusão em lote): a seleção
// corrente pode misturar elegíveis/inelegíveis para baixa, então o botão
// filtra e avisa quantos itens serão ignorados ANTES de abrir o modal
// (mirror `hasSelectedAdvanceOrInvoice`/`warningText`, nunca envia uuid
// inelegível ao endpoint atômico `POST /writeoffs/batch`, que NÃO é
// idempotente).
//
// GAP-FE-036-119 (registrado, não bloqueia) — `WriteOffActiveList` não
// expõe prop para ocultar/desabilitar o "Cancelar" por item (AM10 é uma
// condição de TÍTULO — `payment_type∉{4,5}` — não de item da API); como o
// componente compartilhado NÃO pode ser editado por esta Tarefa, o gate de
// AM10 aqui é informativo (Alert) + reforço do backend
// (`CancelWriteOffRequest::authorize`), não um bloqueio client-side
// garantido. Ver Gap para o Roteiro Cirúrgico sugerido (prop nova no
// componente compartilhado).
//
// Documentos Anexos (AM05/LM01, esteira 036, TASK-FE-036-120, ONDA 3
// sub-onda 3c) — ação "Documentos" abre um 2º Drawer dedicado (MESMO idioma
// visual do Drawer de "Baixas" acima, mirror estrutural — 2 ações
// operacionais do mesmo menu, mesma apresentação) que consome o
// `DocumentPanel` COMPARTILHADO (`segment='expenses'`, Tarefa 338) — NENHUM
// arquivo de `components/Document/`, `services/v2/Document/`,
// `@types/v2/Document/` é tocado aqui, só consumido. Indicador de clipe na
// grid (`documents_count`, LM01, já entregue pelo GB-04 no `index`) — célula
// vazia quando `0`, ícone quando `>0`. 3 permissões DEDICADAS
// (`expensedocument_view/create/delete`) — NUNCA `expenses_edit`/
// `expenses_view` (domínio de permissão INDEPENDENTE do título).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import {
  Badge,
  Box,
  CloseButton,
  Drawer,
  Flex,
  Icon,
  Popover,
  Portal,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiDollarSign, FiFileText, FiPaperclip } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { ContainerGrid } from '@/components/ContainerGrid';
import { CrossFarmViewToggle } from '@/components/CrossFarmViewToggle';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { DocumentPanel } from '@/components/Document';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { ImportExportActions } from '@/components/ImportExport/ImportExportActions';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
import { WriteOffActiveList } from '@/components/WriteOff/WriteOffActiveList';
import { WriteOffBatchModal } from '@/components/WriteOff/WriteOffBatchModal';
import { WriteOffCreateModal } from '@/components/WriteOff/WriteOffCreateModal';

import { TableProvider } from '@/contexts/TableContext';

import { useCurrentFarm } from '@/hooks/useCurrentFarm';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import {
  hasExpenseMoved,
  isExpenseAdvanceOrInvoice,
  isExpenseEligibleForNewWriteOff,
} from '@/utils/expense-guards';
import { computeExpenseStatus, getExpenseStatusColor } from '@/utils/expense-status';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { expensePaymentTypeOptions } from '@/constants/financeiro/expense/options/payment-type-options';
import { queryKey } from '@/constants/query-key';

import {
  deleteExpense,
  duplicateExpense,
  getExpenseReceipt,
  multipleDestroyExpenses,
} from '@/services/v2/Financeiro/Expenses/expense-service';

import type { ExpenseFilterForm, ExpenseListItem } from '@/@types/v2/Financeiro/expense';

import { EXPENSES_BASE_PATH } from './constants';
import { ExpenseActionsMenu } from './ExpenseActionsMenu';
import { FilterSideExpense } from './FilterSideExpense';
import { useExpensesList } from './useExpenses';

/** Chave = `uuid` da linha — NUNCA índice (sobrevive a reordenação/paginação),
 *  mirror `Incomes/index.tsx`. */
type RowSelectionMap = Record<string, boolean>;

// AM08 (FID-G3F, TASK-FE-036-118) — `isExpenseEligibleForNewWriteOff` e o
// helper `isExpenseAdvanceOrInvoice` foram extraídos para
// `utils/expense-guards.ts` (TASK-FE-036-119) para a integração de baixa EM
// LOTE reaproveitar a MESMA fórmula sem duplicá-la — ver import acima.

// AM10 (FID-G3F, TASK-FE-036-118) — mirror EXATO do `action_manifest` legado:
// "Cancelar baixa" exige `balance!==amount` (há baixa ativa) E `payment_type`
// fora de {4,5}. `hasExpenseMoved` (`utils/expense-guards.ts`) já é a fonte
// única de verdade para `balance!==amount` em centavos inteiros — reaproveitada
// aqui, nunca reimplementada (GAP-FE-036-119 — o gate por item dentro do
// `WriteOffActiveList` compartilhado é só informativo, ver cabeçalho do
// arquivo).
function isExpenseEligibleForWriteOffCancel(item: ExpenseListItem): boolean {
  return hasExpenseMoved(item) && !isExpenseAdvanceOrInvoice(item);
}

// B2/B3 (esteira 036, correções pós-E2E) — MESMA expressão de storageKey para
// paginação (`userPaginatedQuery`) e personalização de grid (`useGridSettings`),
// nunca literal cru repetido (mirror `CadastrosBase/CentroCusto/index.tsx`).
const EXPENSES_STORAGE_KEY = 'Expenses' + queryKey.expenses.list;

export default function ExpensesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.financial.expense;

  const canCreate = can('expenses_create');
  const canEdit = can('expenses_edit');
  const canDelete = can('expenses_delete');
  const canView = can('expenses_view');

  // AM05 (TASK-FE-036-120) — 3 permissões DEDICADAS de Documentos, domínio
  // INDEPENDENTE das permissões de título acima (mirror `Incomes/index.tsx`,
  // AM06/TASK-FE-036-339). NUNCA `expenses_edit`/`expenses_view`.
  const canViewDocuments = can('expensedocument_view');
  const canUploadDocuments = can('expensedocument_create');
  const canDeleteDocuments = can('expensedocument_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      // B3 (esteira 036, correções pós-E2E, achado img08/img09) — a
      // paginação [20,30,50,80,100]/default 20 divergia do padrão REAL do
      // sistema (Centros de Custo: [5,10,25,50,100]/default 10, teto de
      // `SelectPagination.tsx`). A TASK-FE-036-116 anterior fixou 20 como
      // "fiel ao legado", mas o dev decidiu no E2E que a fidelidade correta
      // é ao padrão consolidado da SPA, não ao seletor do legado.
      pageSize: 10,
      storageKey: EXPENSES_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange } =
    userPaginatedQuery<ExpenseFilterForm>(defaultQueryOptions);

  // DEC-115 (TASK-FE-036-125, §1/§6) — MESMO flag lido pelo backend
  // (`StoreExpenseAction`, `context.tenant()?.list_all_farms`); `?? false`
  // (ausência nunca é bloqueio, mirror `useCurrentFarm.ts`).
  const currentFarmQuery = useCurrentFarm();
  const listAllFarmsEnabled = currentFarmQuery.data?.tenant?.list_all_farms === true;

  // DEC-115 (§5, o núcleo técnico da Tarefa) — `handleFilterChange`/
  // `handleResetFilter` do hook cru (`usePaginatedQueryStorage`) SUBSTITUEM o
  // filtro inteiro. O toggle usa `handleFilterChange` CRU direto (espalhando
  // o filtro atual, só troca `all_farms`); o drawer (`FilterSideExpense`)
  // recebe versões EMBRULHADAS que preservam `all_farms` vigente sem que o
  // drawer precise conhecer o campo.
  function handleToggleAllFarms(checked: boolean) {
    handleFilterChange({
      ...paginatedQuery.filter,
      all_farms: checked || undefined,
    } as ExpenseFilterForm);
  }

  function handleDrawerFilterChange(data: ExpenseFilterForm) {
    handleFilterChange({ ...data, all_farms: paginatedQuery.filter?.all_farms });
  }

  function handleDrawerResetFilter() {
    handlePaginatedQuery((prev) => ({
      ...prev,
      pageIndex: 1,
      pageSize: defaultQueryOptions.pageSize,
      orderBy: undefined,
      filter: { all_farms: prev.filter?.all_farms } as ExpenseFilterForm,
    }));
  }

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const [toDelete, setToDelete] = useState<ExpenseListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const expensesList = useExpensesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // 422 quando a Expense está vinculada a Invoice com baixa — `useRequest.
  // onError` já lê a mensagem REAL do backend.
  const deleteMutation = useRequest({
    asyncFunction: async ({ expenseUuid }: { expenseUuid: string }) => {
      return await deleteExpense(expenseUuid);
    },
    queryKey: queryKey.expenses.list,
    queryKey2: queryKey.expenses.detail,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleDeleteClick(expense: ExpenseListItem) {
    setToDelete(expense);
    onOpenDeleteDialog();
  }

  // ---- Duplicar (AM11, TASK-FE-036-122, B-11) — busca o DRAFT (`GET
  // /expenses/{uuid}/duplicate`, leitura pura, NUNCA persiste) e navega para
  // a CRIAÇÃO com o draft no `state` do router, chave `duplicateDraft`
  // (MESMO idioma da Tarefa irmã de Contas a Receber, TASK-FE-036-320).
  // `CreateOrUpdateExpense.tsx` lê `location.state?.duplicateDraft` no mount
  // e hidrata reaproveitando a lógica de `fillExpenseForm`. Sem
  // confirmação/modal — nada é persistido pelo clique. ----
  const [duplicatingUuid, setDuplicatingUuid] = useState<string | null>(null);

  async function handleDuplicateClick(expense: ExpenseListItem) {
    if (duplicatingUuid) return;
    setDuplicatingUuid(expense.uuid);
    try {
      const response = await duplicateExpense(expense.uuid);
      navigate(`${EXPENSES_BASE_PATH}/novo`, { state: { duplicateDraft: response.data } });
    } catch (error) {
      const message = (error as { message?: string })?.message ?? text.list.actions.duplicateError;
      toaster.error({ title: text.list.actions.duplicate, description: message });
    } finally {
      setDuplicatingUuid(null);
    }
  }

  // ---- Gerar Recibo (B-12, TASK-FE-036-B12-CAP) — download do PDF via
  // `getExpenseReceipt` (`responseType:'blob'`) + `downloadBlob`, mirror
  // EXATO de `handleDownloadDanfe` (`NfeEmissionPanel.tsx:323-336`). Loading
  // POR LINHA (múltiplas linhas na grid, mesmo padrão de `duplicatingUuid`
  // acima). Sem `useRequest`/mutation (ação de leitura, não persiste nada;
  // ver `CONTRATO-FRONT-B12-recibo-CaP-CaR.md` §1/§2). ----
  const [generatingReceiptUuid, setGeneratingReceiptUuid] = useState<string | null>(null);

  async function handleGenerateReceipt(expense: ExpenseListItem) {
    if (generatingReceiptUuid) return;
    setGeneratingReceiptUuid(expense.uuid);
    try {
      const blob = await getExpenseReceipt(expense.uuid);
      downloadBlob(blob, `recibo-${expense.number}.pdf`);
    } catch {
      toaster.error({
        title: text.list.actions.receipt,
        description: text.list.actions.receiptError,
      });
    } finally {
      setGeneratingReceiptUuid(null);
    }
  }

  // ---- Seleção múltipla + exclusão em lote (esteira 036, ver cabeçalho) ----
  const [rowSelection, setRowSelection] = useState<RowSelectionMap>({});

  const items = expensesList.data?.data?.items ?? [];

  // TASK-FE-036-114 (FID-G3F LM14/LM15) — soma SÓ da página corrente
  // (paginação é server-side, mesma limitação do legado, mesma rotulagem
  // cautelosa "Total da página" — NUNCA o total geral do filtro). 100%
  // client-side, `reduce` sobre os itens já carregados, sem chamada nova.
  const pageTotalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);
  const pageTotalBalance = useMemo(
    () => items.reduce((sum, item) => sum + item.balance, 0),
    [items]
  );

  // Mirror EXATO da condição legada (`expenses/index.blade.php:245`) — só
  // títulos com saldo em aberto e que NÃO são Adiantamento (4) nem Fatura (5)
  // podem ser selecionados para a exclusão em lote.
  const isRowSelectable = (item: ExpenseListItem) =>
    item.balance > 0 && item.payment_type !== 4 && item.payment_type !== 5;

  function toggleRowSelected(uuid: string, checked: boolean) {
    setRowSelection((prev) => {
      const next = { ...prev };
      if (checked) {
        next[uuid] = true;
      } else {
        delete next[uuid];
      }
      return next;
    });
  }

  // "Selecionar todos" considera só as linhas ELEGÍVEIS da página (mirror do
  // checkbox por linha); baixadas/adiantamentos/faturas nunca entram.
  const selectableItems = useMemo(() => items.filter(isRowSelectable), [items]);
  const allCurrentPageSelected =
    selectableItems.length > 0 && selectableItems.every((item) => rowSelection[item.uuid]);

  function toggleSelectAllCurrentPage(checked: boolean) {
    setRowSelection((prev) => {
      const next = { ...prev };
      selectableItems.forEach((item) => {
        if (checked) {
          next[item.uuid] = true;
        } else {
          delete next[item.uuid];
        }
      });
      return next;
    });
  }

  // Reconferência defensiva (AM13/SE07, mirror EXATO `hasSelectedAdvanceOrInvoice`
  // abaixo) — a linha já vem com o item "Excluir" desabilitado quando
  // `hasExpenseMoved`, mas o estado pode ter mudado entre o clique e a
  // confirmação (refetch em background). Reconfere sobre o dado MAIS RECENTE
  // de `items` (não o snapshot capturado em `toDelete`) antes de disparar a
  // mutation — se baixou nesse intervalo, aborta com toast em vez de excluir
  // às cegas.
  function handleConfirmDelete() {
    if (!toDelete) return;

    const currentRow = items.find((item) => item.uuid === toDelete.uuid) ?? toDelete;

    if (hasExpenseMoved(currentRow)) {
      toaster.warning({
        title: text.list.actions.delete,
        description: text.list.actions.deleteDisabledMovedHint,
      });
      onCloseDeleteDialog();
      setToDelete(null);
      return;
    }

    deleteMutation.mutate({ expenseUuid: toDelete.uuid });
  }

  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );

  const {
    open: isOpenBulkDeleteDialog,
    onOpen: onOpenBulkDeleteDialog,
    onClose: onCloseBulkDeleteDialog,
  } = useDisclosure();

  // Rede de segurança defensiva (mirror `Incomes/index.tsx`) — a
  // elegibilidade por linha já bloqueia a seleção de Adiantamento/Fatura, mas
  // a seleção pode ficar "presa" a um uuid cuja linha mudou de elegibilidade
  // entre o clique e o refetch.
  const hasSelectedAdvanceOrInvoice = useMemo(
    () =>
      items.some(
        (item) =>
          selectedUuids.includes(item.uuid) && (item.payment_type === 4 || item.payment_type === 5)
      ),
    [items, selectedUuids]
  );

  const bulkDeleteMutation = useRequest({
    asyncFunction: async ({ uuids }: { uuids: string[] }) => {
      return await multipleDestroyExpenses(uuids);
    },
    queryKey: queryKey.expenses.list,
    queryKey2: queryKey.expenses.detail,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.bulk.deletedToast,
    actionSuccess: () => {
      onCloseBulkDeleteDialog();
      setRowSelection({});
    },
  });

  function handleConfirmBulkDelete() {
    if (selectedUuids.length > 0) {
      bulkDeleteMutation.mutate({ uuids: selectedUuids });
    }
  }

  // ---- Baixa Manual (AM08/AM10, TASK-FE-036-118) — Drawer dedicado aberto
  // pela ação "Baixas" do menu de linha, mirror `Incomes/IncomeDetalhe.tsx`
  // (único outro consumidor do módulo compartilhado hoje). A invalidação das
  // queries de Expense é feita AQUI (nunca dentro do componente
  // compartilhado, que não conhece `queryKey` de Income/Expense). ----
  const queryClient = useQueryClient();

  // ---- Baixa EM LOTE (AM14, TASK-FE-036-119) — MESMA seleção
  // (`rowSelection`/`selectedUuids`) da exclusão em lote acima, filtrada por
  // `isExpenseEligibleForNewWriteOff` (AM08, compartilhada com o
  // `WriteOffCreateModal` individual via `utils/expense-guards.ts`) — essa
  // condição é DIFERENTE de `isRowSelectable` (AM15), então a seleção
  // corrente pode misturar linhas elegíveis/inelegíveis para baixa. ----
  const {
    open: isOpenBatchWriteOffModal,
    onOpen: onOpenBatchWriteOffModal,
    onClose: onCloseBatchWriteOffModal,
  } = useDisclosure();

  const eligibleForWriteoffItems = useMemo(
    () =>
      items.filter(
        (item) => selectedUuids.includes(item.uuid) && isExpenseEligibleForNewWriteOff(item)
      ),
    [items, selectedUuids]
  );
  const eligibleForWriteoffUuids = useMemo(
    () => eligibleForWriteoffItems.map((item) => item.uuid),
    [eligibleForWriteoffItems]
  );
  const ignoredForWriteoffCount = selectedUuids.length - eligibleForWriteoffUuids.length;

  const batchWriteOffRows = useMemo(
    () =>
      eligibleForWriteoffItems.map((item) => ({
        titleUuid: item.uuid,
        titleNumber: item.number,
        titleBalance: item.balance,
      })),
    [eligibleForWriteoffItems]
  );

  // Ponto de entrada — ignora cliques repetidos em "Baixar selecionados"
  // enquanto o modal já está aberto (cobre o duplo-clique/duplo-toque no
  // botão de entrada, cenário mais comum).
  //
  // GAP-FE-036-120 (registrado, não bloqueia) — o `WriteOffBatchModal`
  // compartilhado NÃO expõe `isPending` ao consumidor nem aceita
  // `preventCloseOnOutside`; o `CustomDialog` interno permite fechar por
  // clique-fora/Esc mesmo com o `POST /writeoffs/batch` em voo, o que — em
  // tese — permitiria reabrir e reenviar o MESMO lote antes da 1ª chamada
  // resolver (o backend não é idempotente). Como o componente compartilhado
  // NÃO pode ser editado por esta Tarefa, não há como bloquear 100% esse
  // caminho a partir daqui; ver Gap para o Roteiro Cirúrgico sugerido
  // (`preventCloseOnOutside` fixo/condicionado no próprio componente).
  function handleOpenBatchWriteOff() {
    if (isOpenBatchWriteOffModal) return;

    // Aviso ANTES de montar `rows`/abrir o modal (mirror
    // `hasSelectedAdvanceOrInvoice`/`warningText`) — nunca envia uuid
    // inelegível ao `POST /writeoffs/batch` silenciosamente.
    if (ignoredForWriteoffCount > 0) {
      toaster.warning({
        title: text.list.bulk.writeOffButton,
        description: `${ignoredForWriteoffCount} ${text.list.bulk.writeOffIneligibleWarningSuffix}`,
      });
    }

    if (eligibleForWriteoffUuids.length === 0) return;

    onOpenBatchWriteOffModal();
  }

  function handleBatchWriteOffSuccess() {
    // MESMA chave já usada por `deleteMutation`/`bulkDeleteMutation`/
    // `handleWriteOffChanged` neste arquivo — nenhuma invalidação nova.
    queryClient.invalidateQueries({ queryKey: [queryKey.expenses.list] });
    queryClient.invalidateQueries({ queryKey: [queryKey.expenses.detail] });
    // Mirror `actionSuccess` de `bulkDeleteMutation` — limpa a seleção após
    // concluir com sucesso (a barra de ação em lote some sozinha).
    setRowSelection({});
  }

  const [writeOffExpense, setWriteOffExpense] = useState<ExpenseListItem | null>(null);
  const {
    open: isOpenWriteOffDrawer,
    onOpen: onOpenWriteOffDrawer,
    onClose: onCloseWriteOffDrawer,
  } = useDisclosure();
  const {
    open: isOpenWriteOffCreateModal,
    onOpen: onOpenWriteOffCreateModal,
    onClose: onCloseWriteOffCreateModal,
  } = useDisclosure();

  function handleOpenWriteOffDrawer(expense: ExpenseListItem) {
    setWriteOffExpense(expense);
    onOpenWriteOffDrawer();
  }

  function handleCloseWriteOffDrawer() {
    onCloseWriteOffDrawer();
    setWriteOffExpense(null);
  }

  function handleWriteOffChanged() {
    // Reflete `balance`/estado atualizado na grid e no resumo `write_offs`
    // (LM12, coluna "Data de Baixa") sem reload manual — DoD da Tarefa.
    queryClient.invalidateQueries({ queryKey: [queryKey.expenses.list] });
    queryClient.invalidateQueries({ queryKey: [queryKey.expenses.detail] });
  }

  // Reconferência sobre o dado MAIS RECENTE de `items` (mesmo racional
  // defensivo de `handleConfirmDelete`) — depois de criar/cancelar uma baixa
  // a query é invalidada e `items` é atualizado, mas o snapshot em
  // `writeOffExpense` (capturado no clique do menu) ficaria parado; o Drawer
  // precisa do `balance`/`payment_type` FRESCOS para decidir se "Nova baixa"
  // continua elegível sem exigir fechar/reabrir.
  const currentWriteOffExpense = writeOffExpense
    ? (items.find((item) => item.uuid === writeOffExpense.uuid) ?? writeOffExpense)
    : null;
  const canCreateWriteOff = currentWriteOffExpense
    ? isExpenseEligibleForNewWriteOff(currentWriteOffExpense)
    : false;
  // GAP-FE-036-119 — `WriteOffActiveList` (compartilhado) não expõe prop
  // para desabilitar o "Cancelar" por item; `pointerEvents:'none'` aqui é um
  // wrapper do CONSUMIDOR (não edita o componente), mitigação por mouse —
  // não substitui a correção real (prop dedicada no componente, ver Gap).
  const canCancelWriteOff = currentWriteOffExpense
    ? isExpenseEligibleForWriteOffCancel(currentWriteOffExpense)
    : false;

  // ---- Documentos Anexos (AM05/LM01, TASK-FE-036-120) — Drawer dedicado
  // aberto pela ação "Documentos" do menu de linha, MESMO idioma visual do
  // Drawer de "Baixas" acima (mirror estrutural). A invalidação das queries
  // de Expense é feita AQUI (nunca dentro do `DocumentPanel` compartilhado,
  // que não conhece `queryKey` de Income/Expense). ----
  const [documentsExpense, setDocumentsExpense] = useState<ExpenseListItem | null>(null);
  const {
    open: isOpenDocumentsDrawer,
    onOpen: onOpenDocumentsDrawer,
    onClose: onCloseDocumentsDrawer,
  } = useDisclosure();

  function handleOpenDocumentsDrawer(expense: ExpenseListItem) {
    setDocumentsExpense(expense);
    onOpenDocumentsDrawer();
  }

  function handleCloseDocumentsDrawer() {
    onCloseDocumentsDrawer();
    setDocumentsExpense(null);
  }

  function handleDocumentsChanged() {
    // `documents_count` vem embutido em `ExpenseListItem` (GB-04) — nenhuma
    // invalidação nova além da já usada por delete/writeOff neste arquivo.
    queryClient.invalidateQueries({ queryKey: [queryKey.expenses.list] });
    queryClient.invalidateQueries({ queryKey: [queryKey.expenses.detail] });
  }

  const columnHelper = createColumnHelper<ExpenseListItem>();
  const defaultColumns = useMemo(
    () => [
      // Seleção múltipla + exclusão em lote (esteira 036) — coluna inteira
      // gateada por `expenses_delete` (mirror `Incomes/index.tsx`); por
      // linha, só oferece o checkbox quando ELEGÍVEL (`isRowSelectable`, ver
      // cabeçalho do arquivo), caso contrário a célula fica vazia.
      ...(canDelete
        ? [
            columnHelper.display({
              id: 'selecao',
              // B2 (esteira 036) — checkbox de seleção em lote nunca pode
              // ser ocultado pela personalização de grid (não é dado).
              enableHiding: false,
              header: () => (
                <input
                  type="checkbox"
                  aria-label={text.list.selection.selectAllLabel}
                  checked={allCurrentPageSelected}
                  onChange={(e) => toggleSelectAllCurrentPage(e.target.checked)}
                />
              ),
              cell: ({ row }) =>
                isRowSelectable(row.original) ? (
                  <input
                    type="checkbox"
                    aria-label={text.list.selection.selectRowLabel}
                    checked={!!rowSelection[row.original.uuid]}
                    onChange={(e) => toggleRowSelected(row.original.uuid, e.target.checked)}
                  />
                ) : null,
              meta: {
                ...styleColumTable.button,
                gridLabel: text.list.selection.selectAllLabel,
                gridDataColumn: false,
              },
            }),
          ]
        : []),
      // LM04 (esteira 036, TASK-FE-036-113) — "Número" volta a exibir só o
      // número (sem "(código)" concatenado); footer mostra o rótulo do
      // rodapé de totais (TASK-FE-036-114), lido só nesta 1ª coluna de
      // dados para não repetir o texto em toda coluna.
      columnHelper.accessor('number', {
        header: text.list.table.number,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.number}</Text>,
        footer: () => (
          <Text fontSize="sm" fontWeight="bold">
            {text.list.pageTotalLabel}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // LM04 (esteira 036, TASK-FE-036-113) — Código como coluna PRÓPRIA,
      // separada do Número (dado já eager-loaded, `ExpenseListItem.code`,
      // 100% front — accessor column, estruturalmente ordenável se/quando o
      // sort genérico por-coluna do `TableProvider` for habilitado, ver
      // nota da Tarefa).
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => <Text fontSize="sm">{row.original.code ?? '—'}</Text>,
        meta: styleColumTable.sm,
      }),
      // LM07 (esteira 036, TASK-FE-036-113) — "Tipo de Título" já vem
      // eager-loaded no `index` (`ExpenseRepository::listWithFilters`), só
      // faltava a coluna (comentário anterior a excluía "fora do escopo"
      // sem nunca virar decisão do dono).
      columnHelper.display({
        id: 'typeTitle',
        header: text.list.table.typeTitle,
        cell: ({ row }) => <Text fontSize="sm">{row.original.type?.description ?? '—'}</Text>,
        meta: styleColumTable.md,
      }),
      columnHelper.accessor('provider', {
        header: text.list.table.provider,
        cell: ({ row }) => <Text lineClamp="1">{row.original.provider?.name ?? '—'}</Text>,
      }),
      // DEC-115 (TASK-FE-036-125, §7, TASK-BE-036-128 commitado/`34c1f305e`)
      // — coluna "Fazenda" SÓ existe no DOM/painel de personalização quando
      // o modo de visão é cross-farm (spread condicional, mirror EXATO da
      // coluna `selecao` acima) — nunca `enableHiding`/visibilidade de
      // coluna, que ainda deixaria a coluna existir oculta.
      ...(paginatedQuery.filter?.all_farms
        ? [
            columnHelper.display({
              id: 'farm',
              header: text.list.table.farm,
              cell: ({ row }) => (
                <Badge colorPalette="gray" variant="subtle">
                  {row.original.farm?.description ?? '—'}
                </Badge>
              ),
              meta: styleColumTable.sm,
            }),
          ]
        : []),
      // LM06 (esteira 036, TASK-FE-036-113) — "Gestor" (`proprietary`) só
      // existe no `index` a partir da extensão de eager-load da Tarefa de
      // API companheira; renderiza `—` com segurança enquanto/se o campo
      // vier ausente (`undefined`), nunca quebra a grid.
      columnHelper.display({
        id: 'manager',
        header: text.list.table.manager,
        cell: ({ row }) => <Text fontSize="sm">{row.original.proprietary?.name ?? '—'}</Text>,
        meta: styleColumTable.md,
      }),
      // "Parcela" (esteira 036fix, audit L-08) — dado já entregue pela API
      // no `index` (`ExpenseResource::installment`), só faltava a coluna.
      columnHelper.accessor('installment', {
        header: text.list.table.installment,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="center">
            {row.original.installment ?? '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('dt_emission', {
        header: text.list.table.dtEmission,
        // P2 (audit L-10, "Emissão ... ISO cru") — localizado via
        // `formatDate` (mesma convenção do resto da SPA), nunca `YYYY-MM-DD`
        // cru retornado pela API.
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.dt_emission ? formatDate(row.original.dt_emission) : '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('due_date', {
        header: text.list.table.dueDate,
        // P2 (audit L-09, "Vencimento ... ISO cru") — idem `dt_emission`.
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.due_date ? formatDate(row.original.due_date) : '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      // LM12 (esteira 036, TASK-FE-036-113) — "Data de Baixa" + popover
      // conta/valor/total. `write_offs` (SÓ baixas ATIVAS, mais recente
      // primeiro, ver `ExpenseRepository::listWithFilters`) pode vir
      // ausente/vazio enquanto a Tarefa de API companheira não landa (ou
      // simplesmente quando o título não tem baixa) — nunca quebra a grid.
      columnHelper.display({
        id: 'writeOffDate',
        header: text.list.table.writeOffDate,
        cell: ({ row }) => {
          const writeOffs = row.original.write_offs ?? [];
          if (writeOffs.length === 0) {
            return <Text fontSize="sm">—</Text>;
          }

          const latest = writeOffs[0];
          const total = writeOffs.reduce((sum, writeOff) => sum + writeOff.amount, 0);

          return (
            <Popover.Root positioning={{ placement: 'bottom-start' }} lazyMount unmountOnExit>
              {/* @ts-ignore - Chakra UI v3 type issue */}
              <Popover.Trigger asChild>
                <Text
                  fontSize="sm"
                  cursor="pointer"
                  textDecoration="underline"
                  textDecorationStyle="dotted"
                >
                  {latest.date_movement ? formatDate(latest.date_movement) : '—'}
                </Text>
              </Popover.Trigger>
              <Portal>
                {/* @ts-ignore - Chakra UI v3 type issue */}
                <Popover.Positioner>
                  {/* @ts-ignore - Chakra UI v3 type issue */}
                  <Popover.Content
                    w="280px"
                    bg="cardBG"
                    borderRadius="md"
                    boxShadow="lg"
                    border="1px solid"
                    borderColor="cardBorder"
                    p={3}
                  >
                    <VStack align="stretch" gap={2}>
                      {writeOffs.map((writeOff) => (
                        <Flex key={writeOff.uuid} justify="space-between" gap={2}>
                          <Text fontSize="xs" lineClamp="1">
                            {writeOff.account?.description ?? '—'}
                          </Text>
                          <Text fontSize="xs" whiteSpace="nowrap">
                            {writeOff.date_movement ? formatDate(writeOff.date_movement) : '—'}
                          </Text>
                          <Text fontSize="xs" fontWeight="medium" whiteSpace="nowrap">
                            {writeOff.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Text>
                        </Flex>
                      ))}
                      <Flex
                        justify="space-between"
                        borderTop="1px solid"
                        borderColor="border1"
                        pt={2}
                      >
                        <Text fontSize="xs" fontWeight="bold">
                          {text.list.writeOffPopover.total}
                        </Text>
                        <Text fontSize="xs" fontWeight="bold">
                          {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                      </Flex>
                    </VStack>
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          );
        },
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('amount', {
        header: text.list.table.amount,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right">
            {row.original.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        // TASK-FE-036-114 (FID-G3F LM14/LM15) — soma SÓ da página atual
        // (`pageTotalAmount`, derivado de `items`), mirror `Incomes/index.tsx`.
        footer: () => (
          <Text fontSize="sm" fontWeight="bold">
            {pageTotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('balance', {
        header: text.list.table.balance,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right">
            {row.original.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        footer: () => (
          <Text fontSize="sm" fontWeight="bold">
            {pageTotalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('payment_type', {
        header: text.list.table.paymentType,
        cell: ({ row }) =>
          row.original.payment_type ? (
            <Badge colorPalette="info" variant="subtle">
              {expensePaymentTypeOptions.getLabel(row.original.payment_type, languageGB)}
            </Badge>
          ) : (
            <Text fontSize="sm">—</Text>
          ),
        meta: styleColumTable.sm,
      }),
      // LM13 (esteira 036, TASK-FE-036-113) — "Dedutível" (`fiscal_document`,
      // já eager-loaded no `index`) só EXIBIÇÃO (badge Sim/Não), SEM o
      // switch interativo de `PUT /expenses/{id}/toggle-fiscal-document`
      // (AM16/SE09) — isso é Onda 3, fora do escopo desta Tarefa.
      columnHelper.display({
        id: 'deductible',
        header: text.list.table.deductible,
        cell: ({ row }) => (
          <Badge colorPalette={row.original.fiscal_document ? 'green' : 'gray'} variant="subtle">
            {row.original.fiscal_document
              ? languageGB.defaltStrings.yes
              : languageGB.defaltStrings.no}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      // LM01 (esteira 036, TASK-FE-036-120) — indicador de anexos: célula
      // vazia quando `documents_count===0` (mirror exato do legado — SEM
      // ícone "vazio"/desabilitado), ícone de clipe quando `>0`. NÃO é
      // link — o clipe é só indicador visual, a ação "Documentos" do menu é
      // quem abre o Drawer/painel.
      columnHelper.accessor('documents_count', {
        header: text.list.table.documentsCount,
        cell: ({ row }) =>
          row.original.documents_count > 0 ? (
            <Icon as={FiPaperclip} boxSize={4} color="fg.muted" />
          ) : null,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.documentsCount },
      }),
      columnHelper.display({
        id: 'status',
        header: text.list.table.status,
        cell: ({ row }) => {
          const status = computeExpenseStatus(row.original);
          return (
            <Badge colorPalette={getExpenseStatusColor(status)} variant="subtle">
              {text.list.statusOptions[status]}
            </Badge>
          );
        },
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        // B1/B2 (esteira 036, correções pós-E2E) — nunca ocultável pela
        // personalização; `meta.gridOrder: 'fixed-end'` abaixo ancora a
        // coluna no fim (painel de personalização) E a gruda na borda
        // direita da grid via `position: sticky` (`Table.tsx`), garantindo
        // que Ações continue acessível em grids largas (CaP tem ~14
        // colunas) mesmo sem o usuário rolar horizontalmente.
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <ExpenseActionsMenu
              canView={canView}
              canEdit={canEdit}
              canDelete={canDelete}
              isDeleting={isDeleting}
              labels={{ ...text.list.actions, writeOff: languageGB.writeOff.list.title }}
              onView={() => navigate(`${EXPENSES_BASE_PATH}/${row.original.uuid}/visualizar`)}
              onEdit={() => navigate(`${EXPENSES_BASE_PATH}/${row.original.uuid}`)}
              onDelete={() => handleDeleteClick(row.original)}
              // AM12 (FID-G3F) — Adiantamento (payment_type=4) não pode ser
              // editado (mirror legado).
              editDisabled={row.original.payment_type === 4}
              editDisabledReason={text.list.actions.editDisabledAdvanceHint}
              // AM13/SE07 (FID-G3F) — só título SEM baixa (amount===balance,
              // ou seja `!hasExpenseMoved`) pode ser excluído; fonte única de
              // verdade é `hasExpenseMoved` (`utils/expense-guards.ts`), nunca
              // reimplementar `amount===balance` aqui.
              deleteDisabled={hasExpenseMoved(row.original)}
              deleteDisabledReason={text.list.actions.deleteDisabledMovedHint}
              // AM08/AM10 (TASK-FE-036-118) — "Baixas" só aparece quando ao
              // menos 1 das 2 operações vale para a linha; oculta quando
              // nenhuma vale (mirror do legado).
              canWriteOff={
                canEdit &&
                (isExpenseEligibleForNewWriteOff(row.original) ||
                  isExpenseEligibleForWriteOffCancel(row.original))
              }
              onWriteOff={() => handleOpenWriteOffDrawer(row.original)}
              // AM05 (TASK-FE-036-120) — permissão DEDICADA
              // `expensedocument_view`, INDEPENDENTE de `canView`/`canEdit`.
              canViewDocuments={canViewDocuments}
              onDocuments={() => handleOpenDocumentsDrawer(row.original)}
              // AM11 (TASK-FE-036-122, B-11) — mirror da permissão real do
              // backend (`expenses_create` no middleware de `duplicate`).
              canDuplicate={canCreate}
              onDuplicate={() => handleDuplicateClick(row.original)}
              isDuplicating={duplicatingUuid === row.original.uuid}
              // B-12 (TASK-FE-036-B12-CAP) — MESMA permissão de
              // "Visualizar" (leitura de documento); backend já é a 2ª
              // barreira real (`permission:expenses_view`).
              canGenerateReceipt={canView}
              onGenerateReceipt={() => handleGenerateReceipt(row.original)}
              isGeneratingReceipt={generatingReceiptUuid === row.original.uuid}
            />
          </Flex>
        ),
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
      canViewDocuments,
      canCreate,
      duplicatingUuid,
      generatingReceiptUuid,
      languageGB,
      rowSelection,
      allCurrentPageSelected,
      pageTotalAmount,
      pageTotalBalance,
      paginatedQuery.filter?.all_farms,
    ]
  );

  // B2 (esteira 036, correções pós-E2E) — personalização de grid (reordenar/
  // ocultar colunas, presets), REUSO INTEGRAL do par `useGridSettings` +
  // `GridSettingsFloatingPanel` já consumido por
  // `CadastrosBase/CentroCusto/index.tsx` (nenhum componente novo criado).
  const gridSettings = useGridSettings<ExpenseListItem>({
    storageKey: EXPENSES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([expensesList]);
  const isEmpty = !isLoading && items.length === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        // TASK-FE-036-114 (FID-G3F LM14/LM15) — habilita o rodapé de totais
        // (footer por-coluna, mirror `Incomes/index.tsx`).
        hasFooter
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <Flex gap={2} align="center">
              {/* Import/Export de planilha (esteira 036, Onda 3 sub-onda 3e, B-08) —
                  módulo COMPARTILHADO com Incomes/index.tsx, `segment='expenses'`.
                  Export recebe os MESMOS filtros atuais da grid
                  (`paginatedQuery.filter`), mirror do que `listExpenses` já
                  envia ao servidor. */}
              <ImportExportActions
                segment="expenses"
                canView={canView}
                canImport={canCreate}
                filterParams={(paginatedQuery.filter as Record<string, unknown>) ?? undefined}
                templateFileName="modelo-contas-a-pagar.xlsx"
                exportFileName="contas-a-pagar.xlsx"
                onImportSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: [queryKey.expenses.list] });
                  queryClient.invalidateQueries({ queryKey: [queryKey.expenses.detail] });
                }}
                texts={{
                  tooltipLabel: languageGB.defaltStrings?.actions,
                  ...text.list.excel,
                }}
              />
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate(`${EXPENSES_BASE_PATH}/novo`)}
                  languageGB={languageGB}
                />
              )}
              {/* B2 (esteira 036) — mesmo gatilho/posição de
                  `CadastrosBase/CentroCusto/HeaderTable.tsx` (entre Add e
                  Filtro). */}
              <GridSettingsFloatingPanel
                gridSettings={gridSettings}
                triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
              />
              {/* DEC-115 (TASK-FE-036-125, §2) — modo de visão (não é filtro
                  de busca), por isso vive FORA do drawer, ao lado do
                  `ButtonFilter`; visível só quando `tenant.list_all_farms`.
                  `disabled` durante fetch/refetch de `useCurrentFarm()`
                  evita o usuário alternar em cima de um dado ainda em
                  trânsito. */}
              {listAllFarmsEnabled && (
                // `Box` (forwardRef, mirror `Depreciacao/index.tsx`) — o
                // `Tooltip` clona `onMouseEnter`/ref no filho via
                // `asChild`; `CrossFarmViewToggle` é function component sem
                // forwardRef, então o wrapper garante que os handlers do
                // Ark UI cheguem a um nó DOM real.
                <Tooltip content={text.list.allFarmsToggle.description}>
                  <Box>
                    <CrossFarmViewToggle
                      checked={!!paginatedQuery.filter?.all_farms}
                      onCheckedChange={handleToggleAllFarms}
                      label={text.list.allFarmsToggle.label}
                      disabled={currentFarmQuery.isFetching}
                    />
                  </Box>
                </Tooltip>
              )}
              <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
            </Flex>
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

        {/* Barra de ação em lote (esteira 036, mirror `Incomes/index.tsx`) —
            composição local, sem componente `BulkActionBar` compartilhado. */}
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
            <Flex gap={2}>
              <Button
                title={text.list.bulk.writeOffButton}
                colorPalette="purple"
                size="sm"
                onClick={handleOpenBatchWriteOff}
                // Desabilitado quando NENHUM item selecionado passa em
                // `isExpenseEligibleForNewWriteOff` (mirror do DoD).
                disabled={eligibleForWriteoffUuids.length === 0}
              />
              <Button
                title={text.list.bulk.deleteButton}
                colorPalette="red"
                size="sm"
                onClick={onOpenBulkDeleteDialog}
              />
            </Flex>
          </Flex>
        )}

        <Box mt={6}>
          {/* B3 (esteira 036, correções pós-E2E) — `pageSizeOptions`
              customizado ([20,30,50,80,100]) removido: sem a prop, `Table`
              cai no default `[5,10,25,50,100]` de `SelectPagination.tsx`,
              o MESMO padrão consolidado usado por
              `CadastrosBase/CentroCusto/index.tsx`. A opção "fiel ao
              legado" (TASK-FE-036-116) foi revertida — decisão do dono no
              E2E foi priorizar o padrão da SPA, não o seletor do legado. */}
          <Table
            isLoading={isLoading}
            isError={expensesList.isError}
            error={expensesList.error}
            isEmpty={isEmpty}
            onRetry={() => expensesList.refetch()}
            isRetrying={expensesList.isFetching}
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
            onCreate={() => navigate(`${EXPENSES_BASE_PATH}/novo`)}
          />
        </Box>
      </TableProvider>

      <FilterSideExpense
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleDrawerFilterChange}
        handleReset={handleDrawerResetFilter}
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
        itemName={toDelete?.number}
      />

      <DeleteConfirmDialog
        isOpen={isOpenBulkDeleteDialog}
        onClose={onCloseBulkDeleteDialog}
        onConfirm={handleConfirmBulkDelete}
        isLoading={bulkDeleteMutation.isPending}
        title={text.list.bulk.confirmTitle}
        description={text.list.bulk.confirmDescription}
        // Ressalva quando alguma linha selecionada é Adiantamento/Fatura
        // (payment_type 4/5) — mirror `Incomes/index.tsx` §4.5.
        warningText={
          hasSelectedAdvanceOrInvoice ? text.list.bulk.advanceOrInvoiceWarning : undefined
        }
        tone="danger"
      />

      {/* AM08/AM10 (TASK-FE-036-118) — Drawer dedicado da ação "Baixas",
          mirror estrutural `FilterSide.tsx` (mesmo idioma visual de Drawer já
          usado nesta tela em `FilterSideExpense.tsx`) + mirror de conteúdo
          `Incomes/IncomeDetalhe.tsx` (`WriteOffActiveList` sempre visível,
          "Nova baixa" só quando `canCreateWriteOff`). Busca própria do
          `WriteOffActiveList` por `uuid`+`segment='expenses'` — NUNCA reusa o
          resumo cacheado `write_offs` da coluna LM12/grid. */}
      {/* @ts-ignore - Chakra UI v3 type issue (mirror FilterSide.tsx) */}
      <Drawer.Root
        open={isOpenWriteOffDrawer}
        onOpenChange={(e: { open: boolean }) => {
          if (!e.open) handleCloseWriteOffDrawer();
        }}
        placement="end"
        size="lg"
        closeOnInteractOutside={false}
      >
        <Portal>
          <Drawer.Positioner
            paddingTop="calc(8px + 48px + 8px)"
            paddingBottom="calc(8px + 8px)"
            paddingInlineEnd="calc(8px + 8px)"
          >
            {/* @ts-ignore */}
            <Drawer.Content
              bg="formBG"
              border="1px solid"
              borderColor="border2"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="overlay"
            >
              <Drawer.Header borderBottom="1px solid" borderColor="border2">
                <Drawer.Title>
                  <Text as="b">{languageGB.writeOff.list.title}</Text>
                </Drawer.Title>
                <Drawer.CloseTrigger asChild position="absolute" top="3" insetEnd="3">
                  <CloseButton size="sm" onClick={handleCloseWriteOffDrawer} />
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body overflow="auto" flex="1" minHeight="0">
                <Flex justify="flex-end" mb={4}>
                  {canCreateWriteOff && (
                    <Button
                      title={languageGB.writeOff.form.createTitle}
                      icon={FiDollarSign as ElementType}
                      size="sm"
                      onClick={onOpenWriteOffCreateModal}
                    />
                  )}
                </Flex>
                {/* Wrapper do CONSUMIDOR (GAP-FE-036-119) — não edita
                    `WriteOffActiveList`; só reduz a chance de cancelar uma
                    baixa de título Adiantamento/Fatura por clique de mouse
                    enquanto o componente compartilhado não ganha uma prop
                    dedicada. */}
                <Box
                  pointerEvents={canCancelWriteOff ? 'auto' : 'none'}
                  opacity={canCancelWriteOff ? 1 : 0.6}
                >
                  {currentWriteOffExpense && (
                    <WriteOffActiveList
                      segment="expenses"
                      titleUuid={currentWriteOffExpense.uuid}
                      onCancelled={handleWriteOffChanged}
                    />
                  )}
                </Box>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      {currentWriteOffExpense && (
        <WriteOffCreateModal
          isOpen={isOpenWriteOffCreateModal}
          onClose={onCloseWriteOffCreateModal}
          segment="expenses"
          titleUuid={currentWriteOffExpense.uuid}
          titleBalance={currentWriteOffExpense.balance}
          onSuccess={() => {
            onCloseWriteOffCreateModal();
            handleWriteOffChanged();
          }}
        />
      )}

      {/* AM14 (TASK-FE-036-119) — modal COMPARTILHADO de baixa EM LOTE
          (Tarefas 334/335), `segment='expenses'`. A invalidação das queries
          de Expense é feita AQUI (`handleBatchWriteOffSuccess`), nunca dentro
          do componente compartilhado. `rows` já vem filtrado por
          `isExpenseEligibleForNewWriteOff` — nenhum uuid inelegível chega
          aqui. Guarda de idempotência (duplo-clique no confirmar) é
          responsabilidade do próprio `WriteOffBatchModal`
          (`disabled={isSubmitting}` no botão de submit, conferido nesta
          Tarefa). */}
      <WriteOffBatchModal
        isOpen={isOpenBatchWriteOffModal}
        onClose={onCloseBatchWriteOffModal}
        segment="expenses"
        rows={batchWriteOffRows}
        onSuccess={handleBatchWriteOffSuccess}
      />

      {/* AM05 (TASK-FE-036-120) — Drawer dedicado da ação "Documentos",
          MESMO idioma visual do Drawer de "Baixas" acima (mirror estrutural
          — consistência entre as 2 ações operacionais deste menu). Embute o
          `DocumentPanel` COMPARTILHADO (Tarefa 338), `segment='expenses'` —
          NENHUM arquivo de `components/Document/`, `services/v2/Document/`,
          `@types/v2/Document/` é tocado aqui, só consumido. A invalidação
          das queries de Expense é feita AQUI (`handleDocumentsChanged`),
          nunca dentro do componente compartilhado. */}
      {/* @ts-ignore - Chakra UI v3 type issue (mirror Drawer de Baixas acima) */}
      <Drawer.Root
        open={isOpenDocumentsDrawer}
        onOpenChange={(e: { open: boolean }) => {
          if (!e.open) handleCloseDocumentsDrawer();
        }}
        placement="end"
        size="lg"
        closeOnInteractOutside={false}
      >
        <Portal>
          <Drawer.Positioner
            paddingTop="calc(8px + 48px + 8px)"
            paddingBottom="calc(8px + 8px)"
            paddingInlineEnd="calc(8px + 8px)"
          >
            {/* @ts-ignore */}
            <Drawer.Content
              bg="formBG"
              border="1px solid"
              borderColor="border2"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="overlay"
            >
              <Drawer.Header borderBottom="1px solid" borderColor="border2">
                <Drawer.Title>
                  <Text as="b">{languageGB.document.panel.title}</Text>
                </Drawer.Title>
                <Drawer.CloseTrigger asChild position="absolute" top="3" insetEnd="3">
                  <CloseButton size="sm" onClick={handleCloseDocumentsDrawer} />
                </Drawer.CloseTrigger>
              </Drawer.Header>
              <Drawer.Body overflow="auto" flex="1" minHeight="0">
                {documentsExpense && (
                  <DocumentPanel
                    segment="expenses"
                    titleUuid={documentsExpense.uuid}
                    canView={canViewDocuments}
                    canUpload={canUploadDocuments}
                    canDelete={canDeleteDocuments}
                    onChanged={handleDocumentsChanged}
                  />
                )}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </ContainerGrid>
  );
}
