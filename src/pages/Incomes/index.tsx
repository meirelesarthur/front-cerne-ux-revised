// src/pages/Incomes/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de CONTAS A RECEBER (Income) — Financeiro.
// TASK-FE-036-311 (grid/filtros/status) + TASK-FE-036-318 (seleção múltipla +
// exclusão em lote, GAP-FE-036-304 + alternância de documento fiscal).
//
// Cada LINHA é UMA PARCELA (contrato §3.2) — um título parcelado em 3x
// aparece como 3 linhas distintas, cada uma com seu próprio uuid/due_date/
// amount/balance. NÃO é bug a "corrigir" agrupando por `number` — é o modelo
// de dados real do backend.
//
// Seleção múltipla — SEM `RowSelectionState` nativo do TanStack Table (o
// Chokepoint `TableContext.tsx`/`TableProvider` não tem precedente de row
// selection habilitado em nenhuma das ~50 listagens do fork, e espalhar
// `state.rowSelection` por `...rest` substituiria por completo o objeto
// `state` já montado internamente — risco de regressão no Chokepoint). Estado
// 100% LOCAL, chaveado por `uuid` (mirror do precedente descrito no contrato/
// Gap — nunca por índice de linha, que muda com paginação/filtro).
//
// Colunas "Cliente"/"Proprietário"/"Safra" — auditoria de fidelidade 2026-08
// (achados B-06/L-05/L-06): `IncomeResource` passou a eager-carregar e
// devolver `name`/`description` (não só `uuid`) para as 3 relações. Exibe o
// nome quando presente; cai para o `uuid` truncado/mono SÓ como honestidade
// de fallback (relação sem nome cadastrado ou ainda não hidratada), NUNCA um
// nome inventado (SEM MOCK).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';
import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCheckCircle, FiDollarSign, FiPaperclip } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { ContainerGrid } from '@/components/ContainerGrid';
import { CrossFarmViewToggle } from '@/components/CrossFarmViewToggle';
import { CustomDialog } from '@/components/CustomDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { DocumentPanel } from '@/components/Document';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { HeaderGrid } from '@/components/HeaderGrid';
import { ImportExportActions } from '@/components/ImportExport/ImportExportActions';
import { Table } from '@/components/Table';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';
import { Tooltip } from '@/components/ui/tooltip';
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
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  deleteIncome,
  duplicateIncome,
  getIncomeReceipt,
  multipleDestroyIncomes,
  toggleFiscalDocumentIncome,
} from '@/services/v2/Incomes/income-service';

import type { IncomeFilterForm, IncomeListItem } from '@/@types/v2/Incomes';

import { FilterSideIncome } from './FilterSideIncome';
import {
  INCOME_STATUS_COLOR_PALETTE,
  deriveIncomeStatus,
  isIncomeEligibleForWriteOff,
} from './income-status';
import { IncomeActionsMenu } from './IncomeActionsMenu';
import { useIncomesList } from './useIncomes';

import { PageHeader } from '@/components/ui/PageHeader';

const INCOMES_STORAGE_KEY = 'Incomes' + queryKey.incomes.incomes;
const INCOMES_LIST_ROUTE = '/financeiro/receber';

// B3 (esteira 036, correções pós-E2E, achado img08/img09) — a constante
// `PAGE_SIZE_OPTIONS` ([10,20,30,50,80,100], TASK-FE-036-325) divergia do
// padrão REAL do sistema (Centros de Custo: [5,10,25,50,100]/default 10,
// teto de `SelectPagination.tsx`). Removida — a tela agora NÃO passa
// `pageSizeOptions` a `<Table>`, caindo no default consolidado (mesmo
// idioma de `CadastrosBase/CentroCusto/index.tsx`). A alegação de "teto
// UNIVERSAL" da Tarefa anterior não é mais a decisão do dono.

/** Chave = `uuid` da linha — NUNCA índice (sobrevive a reordenação/paginação). */
type RowSelectionMap = Record<string, boolean>;

export default function IncomesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.incomes.income;

  const canCreate = can('incomes_create');
  // INC-R15 (REAUDITORIA-036-2a-rodada) — o legado só oferece o checkbox de
  // seleção em lote (`index.blade.php:223`, `@if ($item->balance > 0 &&
  // $item->payment_type != 4)`) e a exclusão em lote é um botão de ação da
  // própria tela — gate visual explícito aqui (a exclusão real ainda é
  // sempre reforçada pelo backend em `IncomeController::multipleDestroy`).
  const canDelete = can('incomes_delete');
  // Import/Export de planilha (esteira 036, Onda 3 sub-onda 3e, B-08) —
  // download de modelo/export exigem `incomes_view` (mirror `ContasAPagar/
  // index.tsx`).
  const canView = can('incomes_view');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: INCOMES_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange } =
    userPaginatedQuery<IncomeFilterForm>(defaultQueryOptions);

  // DEC-115 (TASK-FE-036-344 §1/§6, mirror `TASK-FE-036-125`) — MESMO flag
  // lido pelo backend (`StoreIncomeAction`,
  // `context.tenant()?.list_all_farms`); `=== true` (ausência nunca é
  // bloqueio, mirror `useCurrentFarm.ts`).
  const currentFarmQuery = useCurrentFarm();
  const listAllFarmsEnabled = currentFarmQuery.data?.tenant?.list_all_farms === true;

  // DEC-115 (§5, o núcleo técnico da Tarefa, mirror `ContasAPagar/index.tsx`)
  // — `handleFilterChange`/`handleResetFilter` do hook cru
  // (`usePaginatedQueryStorage`) SUBSTITUEM o filtro inteiro. O toggle usa
  // `handleFilterChange` CRU direto (espalhando o filtro atual, só troca
  // `all_farms`); o drawer (`FilterSideIncome`) recebe versões EMBRULHADAS
  // que preservam `all_farms` vigente sem que o drawer precise conhecer o
  // campo.
  function handleToggleAllFarms(checked: boolean) {
    handleFilterChange({
      ...paginatedQuery.filter,
      all_farms: checked || undefined,
    } as IncomeFilterForm);
  }

  function handleDrawerFilterChange(data: IncomeFilterForm) {
    handleFilterChange({ ...data, all_farms: paginatedQuery.filter?.all_farms });
  }

  function handleDrawerResetFilter() {
    handlePaginatedQuery((prev) => ({
      ...prev,
      pageIndex: 1,
      pageSize: defaultQueryOptions.pageSize,
      orderBy: undefined,
      filter: { all_farms: prev.filter?.all_farms } as IncomeFilterForm,
    }));
  }

  // ---- Filtro (drawer) ------------------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== '' && v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Exclusão individual --------------------------------------------------
  const [toDelete, setToDelete] = useState<IncomeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const incomesList = useIncomesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ incomeUuid }: { incomeUuid: string }) => {
      return await deleteIncome(incomeUuid);
    },
    queryKey: queryKey.incomes.incomes,
    queryKey2: queryKey.incomes.income,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (income: IncomeListItem) => {
    setToDelete(income);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ incomeUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // ---- Duplicar (AM11, TASK-FE-036-320, B-11) — busca o DRAFT (`GET
  // /incomes/{uuid}/duplicate`, leitura pura, NUNCA persiste) e navega para
  // a CRIAÇÃO com o draft no `state` do router, chave `duplicateDraft`
  // (MESMO idioma da Tarefa irmã de Contas a Pagar, TASK-FE-036-122).
  // `CreateOrUpdateIncome.tsx` lê `location.state?.duplicateDraft` no mount
  // e hidrata reaproveitando a lógica de `fillForm`. Sem confirmação/modal
  // — nada é persistido pelo clique. ----
  const [duplicatingUuid, setDuplicatingUuid] = useState<string | null>(null);

  async function handleDuplicateClick(income: IncomeListItem) {
    if (duplicatingUuid) return;
    setDuplicatingUuid(income.uuid);
    try {
      const response = await duplicateIncome(income.uuid);
      navigate(`${INCOMES_LIST_ROUTE}/novo`, { state: { duplicateDraft: response.data } });
    } catch (error) {
      const message = (error as { message?: string })?.message ?? text.list.actions.duplicateError;
      toaster.error({ title: text.list.actions.duplicate, description: message });
    } finally {
      setDuplicatingUuid(null);
    }
  }

  // ---- Gerar Recibo (B-12, TASK-FE-036-B12-CAR) — download do PDF via
  // `getIncomeReceipt` (`responseType:'blob'`) + `downloadBlob`, mirror
  // EXATO de `handleDownloadDanfe` (`NfeEmissionPanel.tsx:323-336`) e da
  // fatia irmã de Contas a Pagar. Loading POR LINHA (mesmo padrão de
  // `duplicatingUuid` acima). Sem `useRequest`/mutation (ação de leitura,
  // não persiste nada; ver `CONTRATO-FRONT-B12-recibo-CaP-CaR.md` §1/§2).
  // Gate `incomes_view` é calculado INTERNAMENTE em `IncomeActionsMenu`. ----
  const [generatingReceiptUuid, setGeneratingReceiptUuid] = useState<string | null>(null);

  async function handleGenerateReceipt(income: IncomeListItem) {
    if (generatingReceiptUuid) return;
    setGeneratingReceiptUuid(income.uuid);
    try {
      const blob = await getIncomeReceipt(income.uuid);
      downloadBlob(blob, `recibo-${income.number}.pdf`);
    } catch {
      toaster.error({
        title: text.list.actions.receipt,
        description: text.list.actions.receiptError,
      });
    } finally {
      setGeneratingReceiptUuid(null);
    }
  }

  // ---- Exclusão múltipla (GAP-FE-036-304, TASK-FE-036-318) ------------------
  const [rowSelection, setRowSelection] = useState<RowSelectionMap>({});
  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );

  const {
    open: isOpenBulkDeleteDialog,
    onOpen: onOpenBulkDeleteDialog,
    onClose: onCloseBulkDeleteDialog,
  } = useDisclosure();

  const items = incomesList.data?.data?.items ?? [];

  // INC-R15 — mirror EXATO da condição legada (`index.blade.php:223`):
  // só títulos com saldo em aberto e que NÃO são Adiantamento (payment_type
  // 4) podem ser selecionados para a exclusão em lote. TASK-FE-036-333 —
  // MESMA condição do gate AM09 ("Baixar") — reaproveitada de
  // `isIncomeEligibleForWriteOff` (`income-status.ts`), não duplicada.
  const isRowSelectable = isIncomeEligibleForWriteOff;

  const hasSelectedAdvancePayment = useMemo(
    () => items.some((item) => selectedUuids.includes(item.uuid) && item.payment_type === 4),
    [items, selectedUuids]
  );

  const bulkDeleteMutation = useRequest({
    asyncFunction: async ({ uuids }: { uuids: string[] }) => {
      return await multipleDestroyIncomes(uuids);
    },
    queryKey: queryKey.incomes.incomes,
    queryKey2: queryKey.incomes.income,
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

  // ---- Baixa em Lote (AM16, TASK-FE-036-336) — abre o `WriteOffBatchModal`
  // COMPARTILHADO (Tarefas 334/335) com `segment='incomes'`, reaproveitando A
  // MESMA seleção (`rowSelection`/`selectedUuids`) já usada pela exclusão em
  // lote acima (mirror exato do legado, `DOC-BRUTA-B10-baixa.md §C`/AM15/
  // AM16 — os mesmos checkboxes elegíveis alimentam as duas ações). Nenhum
  // mecanismo de seleção novo criado. ----
  const {
    open: isOpenBatchWriteOffModal,
    onOpen: onOpenBatchWriteOffModal,
    onClose: onCloseBatchWriteOffModal,
  } = useDisclosure();

  // Reconferência defensiva no clique (UT-000111, esteira 064, onda 4,
  // causa-raiz) — mirror EXATO de `ContasAPagar/index.tsx:490-542`. Um uuid
  // selecionado pode ter ficado inelegível ENTRE o clique no checkbox e o
  // clique em "Baixar selecionados" (ex.: baixa concorrente em outra aba
  // zerando o saldo, refetch trazendo `items` atualizado enquanto
  // `rowSelection` — estado local — continua com o uuid antigo). O backend
  // é tudo-ou-nada por lote (`BatchWriteOffAction`, correto por design) — um
  // único título desatualizado no payload derruba o LOTE INTEIRO com 422.
  // Em Income (diferente de Expense) a condição de SELEÇÃO
  // (`isRowSelectable`) e a de ELEGIBILIDADE-PARA-BAIXA são a MESMA regra de
  // negócio (`isIncomeEligibleForWriteOff`) — não há 2ª função a criar, só
  // revalidar contra o dado VIVO (`items`) no instante do clique, nunca a
  // seleção "velha".
  const eligibleForWriteoffItems = useMemo(
    () =>
      items.filter(
        (item) => selectedUuids.includes(item.uuid) && isIncomeEligibleForWriteOff(item)
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
  // enquanto o modal já está aberto (mirror `ContasAPagar/index.tsx`).
  function handleOpenBatchWriteOff() {
    if (isOpenBatchWriteOffModal) return;

    // Aviso ANTES de montar `batchWriteOffRows`/abrir o modal — nunca envia
    // uuid inelegível ao `POST /writeoffs/batch` silenciosamente.
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
    // `toggleFiscalMutation` neste arquivo — nenhuma invalidação nova.
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.incomes] });
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.income] });
    // Mirror `actionSuccess` de `bulkDeleteMutation` — limpa a seleção após
    // concluir com sucesso (a barra de ação em lote some sozinha, ver
    // `selectedUuids.length > 0` abaixo).
    setRowSelection({});
  }

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

  // INC-R15 — "selecionar todos" considera só as linhas ELEGÍVEIS da página
  // (mirror do checkbox por linha); baixadas/adiantamentos nunca entram.
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

  // ---- Alternância de Documento Fiscal (TASK-FE-036-318) --------------------
  // NÃO otimista de propósito — o `Switch` só reflete o novo valor depois da
  // resposta 200 do servidor (refetch via invalidação); em erro, nada muda
  // visualmente (nenhuma reversão manual necessária).
  const [togglingFiscalUuid, setTogglingFiscalUuid] = useState<string | null>(null);

  const toggleFiscalMutation = useRequest({
    asyncFunction: async ({ incomeUuid }: { incomeUuid: string }) => {
      return await toggleFiscalDocumentIncome(incomeUuid);
    },
    queryKey: queryKey.incomes.incomes,
    queryKey2: queryKey.incomes.income,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: undefined,
    actionSuccess: () => {
      setTogglingFiscalUuid(null);
    },
  });

  function handleToggleFiscal(income: IncomeListItem) {
    setTogglingFiscalUuid(income.uuid);
    toggleFiscalMutation.mutate(
      { incomeUuid: income.uuid },
      // Reverte o estado "em voo" também no erro (o próprio hook já mostra o
      // toast de erro genérico — `text.list.toggleFiscalDocumentError` fica
      // registrado para uso futuro caso a Tarefa peça uma mensagem dedicada).
      { onError: () => setTogglingFiscalUuid(null) }
    );
  }

  // ---- Baixa Manual (AM09, TASK-FE-036-333) — abre o `WriteOffCreateModal`
  // COMPARTILHADO (Tarefas 330/331) com `segment='incomes'`. O componente
  // compartilhado não conhece `queryKey` de Income — a invalidação das
  // queries do próprio módulo é feita AQUI, no `onSuccess` repassado. ----
  const [writeOffIncome, setWriteOffIncome] = useState<IncomeListItem | null>(null);
  const {
    open: isWriteOffModalOpen,
    onOpen: onOpenWriteOffModal,
    onClose: onCloseWriteOffModal,
  } = useDisclosure();

  function handleOpenWriteOff(income: IncomeListItem) {
    setWriteOffIncome(income);
    onOpenWriteOffModal();
  }

  function handleWriteOffSuccess() {
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.incomes] });
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.income] });
  }

  // ---- Documentos Anexos (AM06/LM01, TASK-FE-036-339) — abre o
  // `DocumentPanel` COMPARTILHADO (Tarefa 338) num Drawer/Modal por LINHA
  // (mirror `toDelete`/`setToDelete` — guarda qual `income` está com o painel
  // aberto, não é seleção em lote). 3 permissões DEDICADAS — NUNCA
  // `incomes_edit` (Tarefa 337/339). ----
  const canViewDocuments = can('incomedocument_view');
  const canUploadDocuments = can('incomedocument_create');
  const canDeleteDocuments = can('incomedocument_delete');

  const [documentsIncome, setDocumentsIncome] = useState<IncomeListItem | null>(null);
  const {
    open: isDocumentsModalOpen,
    onOpen: onOpenDocumentsModal,
    onClose: onCloseDocumentsModal,
  } = useDisclosure();

  function handleOpenDocuments(income: IncomeListItem) {
    setDocumentsIncome(income);
    onOpenDocumentsModal();
  }

  function handleDocumentsChanged() {
    // MESMA chave já usada por `handleWriteOffSuccess` — `documents_count`
    // vem embutido em `IncomeListItem`/`IncomeDetail`, nenhuma invalidação nova.
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.incomes] });
    queryClient.invalidateQueries({ queryKey: [queryKey.incomes.income] });
  }

  // ---- Totais de página (TASK-FE-036-321, FID-G3F LM14/LM15/CV10) ----------
  // Mirror do legado (`list_page_totals`): soma SÓ da página atual carregada
  // (`items`), NUNCA um agregado de todas as páginas do backend.
  const pageTotalAmount = useMemo(() => items.reduce((acc, item) => acc + item.amount, 0), [items]);
  const pageTotalBalance = useMemo(
    () => items.reduce((acc, item) => acc + item.balance, 0),
    [items]
  );

  const columnHelper = createColumnHelper<IncomeListItem>();
  const defaultColumns = useMemo(
    () => [
      // INC-R15 (REAUDITORIA-036-2a-rodada) — a coluna de seleção em lote
      // inteira só existe para quem tem `incomes_delete` (gate visual). Por
      // linha, só oferece o checkbox quando ELEGÍVEL (saldo em aberto e
      // não-Adiantamento, mirror `index.blade.php:223`); caso contrário a
      // célula fica vazia, igual ao legado.
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
                  aria-label={text.list.bulk.selectAllLabel}
                  checked={allCurrentPageSelected}
                  onChange={(e) => toggleSelectAllCurrentPage(e.target.checked)}
                />
              ),
              cell: ({ row }) =>
                isRowSelectable(row.original) ? (
                  <input
                    type="checkbox"
                    aria-label={text.list.bulk.selectRowLabel}
                    checked={!!rowSelection[row.original.uuid]}
                    onChange={(e) => toggleRowSelected(row.original.uuid, e.target.checked)}
                  />
                ) : null,
              meta: {
                ...styleColumTable.button,
                gridLabel: text.list.bulk.selectAllLabel,
                gridDataColumn: false,
              },
            }),
          ]
        : []),
      columnHelper.accessor('number', {
        header: text.list.columns.number,
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.number },
      }),
      // L-03 (auditoria de fidelidade 2026-08) — `IncomeResource.code` já é
      // devolvido pelo backend (sequencial gerado no servidor); a coluna
      // simplesmente estava ausente da grid.
      columnHelper.accessor('code', {
        header: text.list.columns.code,
        cell: ({ row }) => <Text fontSize="sm">{row.original.code ?? '—'}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.code },
      }),
      columnHelper.accessor('type', {
        header: text.list.columns.type,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.type?.description ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.columns.type },
      }),
      columnHelper.accessor('client', {
        header: text.list.columns.client,
        // L-06/B-06 (auditoria de fidelidade 2026-08) — `IncomeResource`
        // agora devolve `client.name`; usa o nome quando presente, cai para
        // o uuid truncado/mono só como fallback honesto (nunca inventa nome).
        cell: ({ row }) =>
          row.original.client?.name ? (
            <Text fontSize="sm" lineClamp="1">
              {row.original.client.name}
            </Text>
          ) : (
            <Text
              fontFamily="mono"
              fontSize="xs"
              color="fg.muted"
              title={row.original.client?.uuid}
            >
              {row.original.client?.uuid ? row.original.client.uuid.slice(0, 8) : '—'}
            </Text>
          ),
        meta: { ...styleColumTable.md, gridLabel: text.list.columns.client },
      }),
      // DEC-115 (TASK-FE-036-344, §7, TASK-BE-036-318 commitado/`34c1f305e`,
      // mirror `TASK-FE-036-125` em Expense) — coluna "Fazenda" SÓ existe no
      // DOM/painel de personalização quando o modo de visão é cross-farm
      // (spread condicional, mirror EXATO a coluna `selecao` acima) — nunca
      // `enableHiding`/visibilidade de coluna, que ainda deixaria a coluna
      // existir oculta.
      ...(paginatedQuery.filter?.all_farms
        ? [
            columnHelper.display({
              id: 'farm',
              header: text.list.columns.farm,
              cell: ({ row }) => (
                <Badge colorPalette="gray" variant="subtle">
                  {row.original.farm?.description ?? '—'}
                </Badge>
              ),
              meta: { ...styleColumTable.sm, gridLabel: text.list.columns.farm },
            }),
          ]
        : []),
      // L-05/B-06 — "Gestor" no legado é o Proprietário do título.
      columnHelper.accessor('proprietary', {
        header: text.list.columns.proprietary,
        cell: ({ row }) =>
          row.original.proprietary?.name ? (
            <Text fontSize="sm" lineClamp="1">
              {row.original.proprietary.name}
            </Text>
          ) : row.original.proprietary?.uuid ? (
            <Text
              fontFamily="mono"
              fontSize="xs"
              color="fg.muted"
              title={row.original.proprietary.uuid}
            >
              {row.original.proprietary.uuid.slice(0, 8)}
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ),
        meta: { ...styleColumTable.md, gridLabel: text.list.columns.proprietary },
      }),
      columnHelper.accessor('harvest', {
        header: text.list.columns.harvest,
        cell: ({ row }) => (
          <Text fontSize="sm" lineClamp="1">
            {row.original.harvest?.name ?? '—'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.harvest },
      }),
      columnHelper.display({
        id: 'installment',
        header: text.list.columns.installment,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.installment}/{row.original.qtd_installments}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.installment },
      }),
      // TASK-FE-036-321 (FID-G3F LM11) — `dt_emission` já vinha na resposta
      // da API (`IncomeListItem.dt_emission`), só faltava o wiring da
      // coluna; mirror exato da célula de `due_date` (mesmo `formatDate`).
      columnHelper.accessor('dt_emission', {
        header: text.list.columns.dtEmission,
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.dt_emission)}</Text>,
        meta: { ...styleColumTable.date, gridLabel: text.list.columns.dtEmission },
      }),
      columnHelper.accessor('due_date', {
        header: text.list.columns.dueDate,
        // B-14 (auditoria de fidelidade 2026-08) — o backend devolve
        // `YYYY-MM-DD`; exibir cru diverge do formato localizado do legado.
        cell: ({ row }) => <Text fontSize="sm">{formatDate(row.original.due_date)}</Text>,
        meta: { ...styleColumTable.date, gridLabel: text.list.columns.dueDate },
      }),
      columnHelper.accessor('amount', {
        header: text.list.columns.amount,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        // TASK-FE-036-321 (FID-G3F LM14/LM15/CV10) — soma SÓ da página
        // atual (`pageTotalAmount`, derivado de `items`), mirror
        // `list_page_totals` do legado.
        footer: () => (
          <Text fontSize="sm" fontWeight="bold">
            {text.list.columns.amount}:{' '}
            {pageTotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.columns.amount },
      }),
      columnHelper.accessor('balance', {
        header: text.list.columns.balance,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        footer: () => (
          <Text fontSize="sm" fontWeight="bold">
            {text.list.columns.balance}:{' '}
            {pageTotalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Text>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.columns.balance },
      }),
      columnHelper.display({
        id: 'status',
        header: text.list.columns.status,
        cell: ({ row }) => {
          const status = deriveIncomeStatus(row.original);
          return (
            <Badge colorPalette={INCOME_STATUS_COLOR_PALETTE[status]} variant="subtle">
              {text.list.statusLabels[status]}
            </Badge>
          );
        },
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.status },
      }),
      columnHelper.display({
        id: 'fiscalDocument',
        header: text.form.fields.fiscalDocument,
        cell: ({ row }) => (
          <Switch
            checked={row.original.fiscal_document}
            disabled={togglingFiscalUuid === row.original.uuid || !can('incomes_edit')}
            onCheckedChange={() => handleToggleFiscal(row.original)}
          />
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.form.fields.fiscalDocument },
      }),
      // LM12 (TASK-FE-036-333) — indicador BOOLEANO de "tem baixa" na grid,
      // reaproveitando `is_locked` já existente no tipo (`balance !==
      // amount`, calculado pelo backend). A DATA/valor/conta completos da
      // baixa ficam só no Detalhe (`WriteOffActiveList`, 1 chamada por
      // título é aceitável lá; N+1 na grid foi explicitamente REJEITADO
      // nesta Tarefa — ver Roteiro item 3).
      columnHelper.display({
        id: 'hasWriteOff',
        header: text.list.columns.hasWriteOff,
        cell: ({ row }) =>
          row.original.is_locked ? (
            <Badge colorPalette="purple" variant="subtle">
              <Icon as={FiCheckCircle} boxSize={3} mr={1} />
              {text.list.hasWriteOffLabel}
            </Badge>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.hasWriteOff },
      }),
      // LM01 (TASK-FE-036-339) — indicador de anexos: célula vazia quando
      // `documents_count===0`, ícone de clipe quando `>0` (mirror
      // `fa-paperclip` do legado). NÃO é link — o clipe é só indicador
      // visual, a ação "Documentos" do menu é quem abre o painel.
      columnHelper.accessor('documents_count', {
        header: text.list.columns.documentsCount,
        cell: ({ row }) =>
          row.original.documents_count > 0 ? (
            <Icon as={FiPaperclip} boxSize={4} color="fg.muted" />
          ) : (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.columns.documentsCount },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <IncomeActionsMenu
            income={row.original}
            languageGB={languageGB}
            onView={(income) => navigate(`${INCOMES_LIST_ROUTE}/${income.uuid}/detalhe`)}
            onEdit={(income) => navigate(`${INCOMES_LIST_ROUTE}/${income.uuid}`)}
            onDelete={handleDeleteClick}
            onWriteOff={handleOpenWriteOff}
            onDocuments={handleOpenDocuments}
            onDuplicate={handleDuplicateClick}
            onGenerateReceipt={handleGenerateReceipt}
            isDeleting={isDeleting}
            isDuplicating={duplicatingUuid === row.original.uuid}
            isGeneratingReceipt={generatingReceiptUuid === row.original.uuid}
          />
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
      duplicatingUuid,
      generatingReceiptUuid,
      languageGB,
      text,
      rowSelection,
      allCurrentPageSelected,
      togglingFiscalUuid,
      canDelete,
      can,
      pageTotalAmount,
      pageTotalBalance,
      paginatedQuery.filter?.all_farms,
    ]
  );

  // B2 (esteira 036, correções pós-E2E) — personalização de grid (reordenar/
  // ocultar colunas, presets), REUSO INTEGRAL do par `useGridSettings` +
  // `GridSettingsFloatingPanel` já consumido por
  // `CadastrosBase/CentroCusto/index.tsx` (nenhum componente novo criado).
  const gridSettings = useGridSettings<IncomeListItem>({
    storageKey: INCOMES_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([incomesList]);
  const isEmpty = !isLoading && items.length === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        hasFooter
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            // TASK-FE-036fix3 (item 3) — `ButtonAdd`/`ButtonFilter` são o
            // par padrão de ação do header em TODAS as listagens da feature
            // (mirror `Invoices/index.tsx` e `ContasAPagar/index.tsx`, ambos
            // idênticos); a versão anterior usava um `Button` avulso aqui e
            // um segundo `Button variant="outline"` solto abaixo do header
            // só para o filtro — nenhum dos dois é o padrão da tela.
            <Flex gap={2} align="center">
              {/* Import/Export de planilha (esteira 036, Onda 3 sub-onda 3e, B-08) —
                  módulo COMPARTILHADO com ContasAPagar/index.tsx,
                  `segment='incomes'`. Export recebe os MESMOS filtros atuais
                  da grid (`paginatedQuery.filter`), mirror do que
                  `listIncomes` já envia ao servidor. */}
              <ImportExportActions
                segment="incomes"
                canView={canView}
                canImport={canCreate}
                filterParams={(paginatedQuery.filter as Record<string, unknown>) ?? undefined}
                templateFileName="modelo-contas-a-receber.xlsx"
                exportFileName="contas-a-receber.xlsx"
                onImportSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: [queryKey.incomes.incomes] });
                  queryClient.invalidateQueries({ queryKey: [queryKey.incomes.income] });
                }}
                texts={{
                  tooltipLabel: languageGB.defaltStrings?.actions,
                  ...text.list.excel,
                }}
              />
              {canCreate && (
                <ButtonAdd
                  onClick={() => navigate(`${INCOMES_LIST_ROUTE}/novo`)}
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
              {/* DEC-115 (TASK-FE-036-344, §2, mirror `TASK-FE-036-125`) —
                  modo de visão (não é filtro de busca), por isso vive FORA
                  do drawer, ao lado do `ButtonFilter`; visível só quando
                  `tenant.list_all_farms`. `disabled` durante fetch/refetch
                  de `useCurrentFarm()` evita o usuário alternar em cima de
                  um dado ainda em trânsito. */}
              {listAllFarmsEnabled && (
                // `Box` (forwardRef) — o `Tooltip` clona `onMouseEnter`/ref
                // no filho via `asChild`; `CrossFarmViewToggle` é function
                // component sem forwardRef, então o wrapper garante que os
                // handlers do Ark UI cheguem a um nó DOM real.
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        {/* Barra de ação em lote (GAP-FE-036-304) — composição local, sem
            componente `BulkActionBar` compartilhado (fora de escopo desta
            feature, tech debt rastreada em GAP-FE-141 de outro módulo). */}
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
                // `isIncomeEligibleForWriteOff` (mirror `ContasAPagar/index.tsx`).
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
          {/* B3 (esteira 036, correções pós-E2E) — sem `pageSizeOptions`
              customizado, `Table` cai no default `[5,10,25,50,100]` de
              `SelectPagination.tsx`, o padrão consolidado da SPA (mirror
              `CadastrosBase/CentroCusto/index.tsx`). */}
          <Table
            isLoading={isLoading}
            isError={incomesList.isError}
            error={incomesList.error}
            isEmpty={isEmpty}
            onRetry={() => incomesList.refetch()}
            isRetrying={incomesList.isFetching}
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
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${INCOMES_LIST_ROUTE}/novo`)}
          />
        </Box>
      </TableProvider>

      <FilterSideIncome
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleDrawerFilterChange}
        handleReset={handleDrawerResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
        filtersApplied={filtersApplied}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.list.deleteConfirm.title}
        itemName={toDelete?.number}
        tone="danger"
      />

      <DeleteConfirmDialog
        isOpen={isOpenBulkDeleteDialog}
        onClose={onCloseBulkDeleteDialog}
        onConfirm={handleConfirmBulkDelete}
        isLoading={bulkDeleteMutation.isPending}
        title={text.list.bulk.confirmTitle}
        description={text.list.bulk.confirmDescription}
        // §4.5 do contrato — mensagem de confirmação DIFERENTE quando alguma
        // linha selecionada é ADIANTAMENTO (payment_type=4): a exclusão
        // múltipla não desfaz o vínculo especial automaticamente.
        warningText={hasSelectedAdvancePayment ? text.list.bulk.advanceWarning : undefined}
        tone="danger"
      />

      {/* AM09 (TASK-FE-036-333) — modal COMPARTILHADO de baixa manual
          (Tarefas 330/331), `segment='incomes'`. A invalidação das queries
          do módulo Income é feita AQUI (`handleWriteOffSuccess`), nunca
          dentro do componente compartilhado. */}
      <WriteOffCreateModal
        isOpen={isWriteOffModalOpen}
        onClose={onCloseWriteOffModal}
        segment="incomes"
        titleUuid={writeOffIncome?.uuid ?? ''}
        titleBalance={writeOffIncome?.balance ?? 0}
        onSuccess={handleWriteOffSuccess}
      />

      {/* AM16 (TASK-FE-036-336) — modal COMPARTILHADO de baixa EM LOTE
          (Tarefas 334/335), `segment='incomes'`. A invalidação das queries do
          módulo Income é feita AQUI (`handleBatchWriteOffSuccess`), nunca
          dentro do componente compartilhado. */}
      <WriteOffBatchModal
        isOpen={isOpenBatchWriteOffModal}
        onClose={onCloseBatchWriteOffModal}
        segment="incomes"
        rows={batchWriteOffRows}
        onSuccess={handleBatchWriteOffSuccess}
      />

      {/* AM06 (TASK-FE-036-339) — modal com o `DocumentPanel` COMPARTILHADO
          (Tarefa 338), `segment='incomes'`. A invalidação das queries do
          módulo Income é feita AQUI (`handleDocumentsChanged`), nunca dentro
          do componente compartilhado. */}
      <CustomDialog
        isOpen={isDocumentsModalOpen}
        onClose={onCloseDocumentsModal}
        title={languageGB.document.panel.title}
        size="xl"
        showFooter={false}
        scrollableBody
      >
        {documentsIncome && (
          <DocumentPanel
            segment="incomes"
            titleUuid={documentsIncome.uuid}
            canView={canViewDocuments}
            canUpload={canUploadDocuments}
            canDelete={canDeleteDocuments}
            onChanged={handleDocumentsChanged}
          />
        )}
      </CustomDialog>
    </ContainerGrid>
  );
}
