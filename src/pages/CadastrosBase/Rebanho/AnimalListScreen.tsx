// src/pages/CadastrosBase/Rebanho/AnimalListScreen.tsx
// -----------------------------------------------------------------------------
// Núcleo de tela COMPARTILHADO da LISTAGEM (grid, 9 colunas) de Animal —
// extraído de `Rebanho/index.tsx` na Tarefa 53 (execução 017, item 4/4,
// reversão de SD-01 — ver contrato de tela
// `97-Esteiras/017/CONTRATOS/contrato-tela-gestao-animais-dedicada.md` §2
// AD-F06/F07/F09). Parametrizado por `basePath`/`pageTitle`/`pageSubtitle`/
// `storageKeyPrefix` para ser reaproveitado por DUAS cascas de rota finas:
// `CadastrosBase/Rebanho/index.tsx` (`/cadastros-base/rebanho`) e
// `Operacional/GestaoAnimais/index.tsx` (`/operacional/gestao-animais`, Tarefa
// 54). Refactor puramente EXTRATIVO — nenhuma lógica de grid/filtro/lote foi
// alterada nesta extração, só os 3 pontos hardcoded de `basePath` (AD-F07) e a
// origem de `pageTitle`/`pageSubtitle`/`storageKey` (props em vez de
// `text.list.*`/literal fixo).
//
// Tela de LISTAGEM (grid, 7 colunas) do REBANHO (Animal) — Cadastros Base /
// Pecuários, execução 027. Rota: /cadastros-base/rebanho (guardada por
// `animals_view`, wiring de rota real em TASK-FE-887 — CHOKEPOINT retido pelo
// Maestro nesta rodada, `router/index.tsx` sendo editado em paralelo pela
// frente de Depreciação; este arquivo não mexe em rota/menu).
//
// Molde estrutural: `CadastrosBase/CategoriasAnimais/index.tsx` (precedente
// MAIS PRÓXIMO no domínio Pecuários — grid + envelope-adapter + drawer
// `<Form formFilter>`) combinado com `Administrativo/Funcoes/index.tsx`
// (molde primário, PR #103).
//
// Sem flags `can_edit`/`can_delete` por item no Resource — autorização das
// ações de linha é 100% por permissão GLOBAL (`animals_edit`/`animals_delete`,
// mesmo padrão de Function/Marker/CategoryAnimal).
//
// Exclusão DEFINITIVA (sem guarda de FK estruturada confirmada no legado,
// RN-9 da Doc Bruta) — `DeleteConfirmDialog` recebe `warningText` deixando
// isso explícito, mesma decisão de CategoryAnimal/Racas/Kind. `useRequest`
// (não `useMutation` dedicado) porque não há um shape de erro estruturado
// (`errors.in_use`) confirmado para Animal nesta rodada — mesmo racional de
// `CategoriasAnimais/index.tsx`.
//
// Colunas (7 + Ações — `GAP-FE-203`/`TASK-BE-893`, 2026-08-03): Tipo · Tipo
// de Identificação · Identificação · Categoria · Lote · Peso Atual (Kg) ·
// Ações — mesma ordem do legado (`agro365/resources/views/animals/
// index.blade.php`).
//
// RECONCILIADO contra `AnimalResource::toArray()` real (`GAP-FE-203`): a
// premissa original de `TASK-FE-881` (arrays crus `identifications`/
// `batches` no `AnimalListItem`, concatenados CLIENT-SIDE) NUNCA bateu com o
// backend. O Resource real devolve `identification` (string JÁ concatenada
// pelo accessor do Model) + `id_animals[]` (pivot real, usado só para a
// coluna "Tipo de Identificação") — `category` é `{uuid, label}`.
//
// Coluna "Lote" RESTAURADA (`TASK-BE-893`, fecha `GAP-FE-203`): o backend
// passou a expor `batch: {uuid, label} | null` em `AnimalResource::toArray()`
// (SÓ no `index()` — `show()` sempre devolve `null`, Lote não é editável
// neste CRUD, igual ao legado). `null` → `table.batchEmpty` (i18n, mirror
// `{{ $item->batch ?? 'Sem lote' }}` do legado). O FILTRO "Lote"
// (`FilterSideAnimal.tsx`) já era funcional antes desta resolução.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper, type OnChangeFn, type RowSelectionState } from '@tanstack/react-table';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { PiCow } from 'react-icons/pi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Checkbox } from '@/components/ui/checkbox';

import { TableProvider } from '@/contexts/TableContext';

import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import {
  animalStatusColor,
  animalStatusOptions,
} from '@/constants/pecuaria/animal/options/animal-status-options';
import { reproductiveStatusOptions } from '@/constants/pecuaria/animal/options/reproductive-status-options';
import { typeColor, typeOptions } from '@/constants/pecuaria/animal/options/type-options';
import { queryKey } from '@/constants/query-key';

import { deleteAnimal } from '@/services/v2/Animals/animal-service';

import type { LanguageDate } from '@/@types/language';
import type {
  AnimalFilterForm,
  AnimalIdentificationItem,
  AnimalListItem,
} from '@/@types/v2/Animals';

import { AnimalBatchTransferDialog } from './AnimalBatchTransferDialog';
import { AnimalBulkActionBar, type AnimalBulkAction } from './AnimalBulkActionBar';
import { AnimalDeleteManyDialog } from './AnimalDeleteManyDialog';
import { AnimalReproductiveStatusDialog } from './AnimalReproductiveStatusDialog';
import { FilterSideAnimal } from './FilterSideAnimal';
import { HeaderTable } from './HeaderTable';
import { useAnimalsList } from './useAnimal';

import { PageHeader } from '@/components/ui/PageHeader';

// Resolve a coluna "Identificação" — `GAP-FE-203`: `AnimalResource` já
// devolve a string CONCATENADA (`identification`, accessor do Model,
// `Animal::getIdentificationAttribute()`, "S/ID" se vazio) — não há mais
// array cru para concatenar client-side (achado que invalidou a premissa
// original de `TASK-FE-881`). Guarda defensiva mantida (o Model sempre
// devolve ao menos "S/ID", nunca string vazia).
function resolveIdentification(
  identification: string,
  table: LanguageDate['animals']['animal']['list']['table']
): string {
  return identification || table.identificationEmpty;
}

// Resolve a coluna "Tipo de Identificação" — registro PRINCIPAL do pivot
// real `id_animals[]` (primeiro item, `description` = tipo), "—" se sem
// identificação (`GAP-FE-203`: nome real do array é `id_animals`, shape
// `{uuid, description, identification}`, não `identifications` com
// `identification_type_label` como `TASK-FE-881` assumia).
function resolveIdentificationType(
  idAnimals: AnimalIdentificationItem[],
  table: LanguageDate['animals']['animal']['list']['table']
): string {
  if (!idAnimals || idAnimals.length === 0) return table.identificationTypeEmpty;
  return idAnimals[0].description;
}

export interface AnimalListScreenProps {
  basePath: string;
  pageTitle: string;
  pageSubtitle: string;
  storageKeyPrefix: string;
}

export function AnimalListScreen({
  basePath,
  pageTitle,
  pageSubtitle,
  storageKeyPrefix,
}: AnimalListScreenProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.animals.animal;

  const canCreate = can('animals_create');
  const canEdit = can('animals_edit');
  const canDelete = can('animals_delete');

  // ---- Ações em lote (Tarefa 27, Gestão Animais — feature 3596a556) -------
  // O OR espelha `authorize()` dos 3 Form Requests do backend
  // (`AnimalReproductiveStatusManyRequest`/`AnimalDeleteManyRequest`/
  // `AnimalBatchTransferRequest`) — um perfil só-`animals-management_*` já
  // exerce as ações em massa, mesma lógica de leitura de SD-01/Tarefa 26.
  const canBulkEdit = can('animals-management_edit') || can('animals_edit');
  const canBulkDelete = can('animals-management_delete') || can('animals_delete');
  const canBulk = canBulkEdit || canBulkDelete;

  // Mirror literal de `Operacional/VendaAnimais/index.tsx:101-111` (mesmo
  // domínio, precedente vivo). Chaves de `rowSelection` são uuids
  // (`getRowId`), não índices de linha — AD-F04.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) =>
    setRowSelection((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );
  function clearSelection() {
    setRowSelection({});
  }
  // 095 — "Desmarcar bloqueados" do diálogo de exclusão em massa: remove da
  // seleção os uuids que a API recusou (animais com vínculos ativos).
  function handleDeselectBlocked(uuids: string[]) {
    setRowSelection((prev) => {
      const next = { ...prev };
      uuids.forEach((uuid) => delete next[uuid]);
      return next;
    });
  }

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: storageKeyPrefix + queryKey.animals.animalsList,
    }),
    [storageKeyPrefix]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<AnimalFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {})
        // Chaves `*_label` são DISPLAY-ONLY — só re-hidratam o
        // `SelectAsyncPaginate` do drawer, nunca contam no badge "Filtros(N)".
        .filter(([key]) => !key.endsWith('_label'))
        // Tarefa 26 (§2/§3) — `status === 'A'` é o default pré-selecionado do
        // drawer (mirror `CLM-05`); sem esta exclusão o badge acusaria 1
        // filtro permanentemente, já que o campo nunca fica vazio.
        .filter(([key, v]) => !(key === 'status' && v === 'A'))
        .map(([, v]) => v)
        .filter((v) => v !== undefined && v !== null && v !== '').length,
    [paginatedQuery.filter]
  );

  const animalsList = useAnimalsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<AnimalListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ animalUuid }: { animalUuid: string }) => {
      return await deleteAnimal(animalUuid);
    },
    queryKey: queryKey.animals.animalsList,
    queryKey2: queryKey.animals.animal,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável (mesmo racional de `CategoriasAnimais`/`Racas`/
    // `Classes`, o texto exibido vem de `personalizedMessage`). Sem guarda de
    // FK estruturada confirmada no legado (RN-9) — o `onError` GLOBAL deste
    // hook já exibe a `message` do envelope.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (animal: AnimalListItem) => {
    setToDelete(animal);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ animalUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const items = animalsList.data?.data?.items ?? [];

  // ---- Diálogos de ação em lote (Tarefas 28/29/30) -------------------------
  // Um `useDisclosure` POR diálogo (`get_pwa_ui_components_pattern §38`) —
  // nunca compartilhado entre modais diferentes.
  const {
    open: isOpenReproductive,
    onOpen: onOpenReproductive,
    onClose: onCloseReproductive,
  } = useDisclosure();
  const {
    open: isOpenDeleteMany,
    onOpen: onOpenDeleteMany,
    onClose: onCloseDeleteMany,
  } = useDisclosure();
  const {
    open: isOpenBatchTransfer,
    onOpen: onOpenBatchTransfer,
    onClose: onCloseBatchTransfer,
  } = useDisclosure();

  // Tarefa 30 — o modo "por animal" do diálogo de transferência precisa da
  // identificação de cada selecionado, não só do uuid. Derivado do cache já
  // carregado da grid (`items`) — nunca um GET novo por animal. Limitação
  // aceita (AD-F04): a seleção só existe dentro da página corrente.
  const selectedAnimals = useMemo(
    () =>
      items
        .filter((item) => rowSelection[item.uuid])
        .map((item) => ({
          uuid: item.uuid,
          identification: resolveIdentification(item.identification, text.list.table),
        })),
    [items, rowSelection, text.list.table]
  );

  // Array `actions` da `AnimalBulkActionBar` (contrato de tela §7.2) —
  // condicional por gate, ordem: Transferir de Lote · Status Reprodutivo ·
  // Apagar Animais (`danger`).
  const bulkActions: AnimalBulkAction[] = [
    ...(canBulkEdit
      ? [{ label: text.list.bulkBar.batchTransfer, onClick: onOpenBatchTransfer }]
      : []),
    ...(canBulkEdit
      ? [{ label: text.list.bulkBar.reproductiveStatus, onClick: onOpenReproductive }]
      : []),
    ...(canBulkDelete
      ? [{ label: text.list.bulkBar.deleteMany.action, onClick: onOpenDeleteMany, danger: true }]
      : []),
  ];

  const columnHelper = createColumnHelper<AnimalListItem>();
  const defaultColumns = useMemo(
    () => [
      // Tarefa 27 (§7.1) — primeira coluna, condicional a `canBulk` (spread
      // de array vazio quando falso, mirror `VendaAnimais/index.tsx:292-309`).
      // `disabled={status !== 'A'}` é regra de negócio preservada (`CLM-11`):
      // no legado o checkbox só era renderizado para animais ativos; aqui é
      // renderizado e DESABILITADO (célula vazia numa coluna de checkbox lê
      // como bug) — efeito funcional idêntico.
      ...(canBulk
        ? [
            columnHelper.display({
              id: 'select',
              header: '',
              enableHiding: false,
              enableSorting: false,
              cell: ({ row }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={() => row.toggleSelected()}
                  disabled={row.original.status !== 'A'}
                  aria-label={resolveIdentification(row.original.identification, text.list.table)}
                />
              ),
              meta: { gridOrder: 'fixed-start' },
            }),
          ]
        : []),
      columnHelper.accessor('type', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette={typeColor[row.original.type]} variant="subtle" py={1} px={3}>
            {typeOptions.getLabel(row.original.type, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'identificationType',
        header: text.list.table.identificationType,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {resolveIdentificationType(row.original.id_animals, text.list.table)}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.display({
        id: 'identification',
        header: text.list.table.identification,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {resolveIdentification(row.original.identification, text.list.table)}
          </Text>
        ),
      }),
      columnHelper.accessor((row) => row.category.label, {
        id: 'category',
        header: text.list.table.category,
        cell: ({ row }) => <Text lineClamp="1">{row.original.category.label}</Text>,
      }),
      // Coluna "Lote" RESTAURADA (`TASK-BE-893`, fecha `GAP-FE-203`) — ver
      // nota de reconciliação no cabeçalho do arquivo. `batch: null` (sempre
      // o caso em `show()`, e também quando o animal não tem lote vinculado
      // em `index()`) → fallback i18n `table.batchEmpty` ("Sem lote"/"No
      // batch"/"Sin lote"), NUNCA string literal.
      columnHelper.accessor((row) => row.batch?.label ?? '', {
        id: 'batch',
        header: text.list.table.batch,
        cell: ({ row }) => (
          <Text lineClamp="1" color={row.original.batch ? undefined : 'fg.muted'}>
            {row.original.batch?.label ?? text.list.table.batchEmpty}
          </Text>
        ),
      }),
      columnHelper.accessor('weight', {
        header: text.list.table.weight,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Text>{row.original.weight}</Text>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
      // Tarefa 26 (LM-12) — `AnimalResource` expõe `status` incondicionalmente
      // (contrato de tela §6). Paleta: 'A'→verde · 'D'/'L'/'R'→vermelho ·
      // 'S'→azul · 'P'→laranja (`animalStatusColor`, ao lado do factory).
      columnHelper.accessor('status', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge colorPalette={animalStatusColor[row.original.status]} variant="subtle">
            {animalStatusOptions.getLabel(row.original.status, languageGB)}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      // Tarefa 26 (LM-14) — `null`/`undefined` → i18n `reproductiveStatusEmpty`
      // ("N/I"), nunca string fabricada.
      columnHelper.accessor('reproductive_status', {
        header: text.list.table.reproductiveStatus,
        cell: ({ row }) => (
          <Text fontSize="sm">
            {row.original.reproductive_status != null
              ? reproductiveStatusOptions.getLabel(row.original.reproductive_status, languageGB)
              : text.list.table.reproductiveStatusEmpty}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`${basePath}/${row.original.uuid}`)}
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
    [navigate, basePath, isDeleting, text, languageGB, canEdit, canDelete, canBulk]
  );

  const isLoading = checkLoadingStatus([animalsList]);
  const isEmpty = !isLoading && items.length === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={canBulk}
        getRowId={(row) => row.uuid}
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              basePath={basePath}
            />
          }
        >
          <PageHeader title={pageTitle} description={pageSubtitle} />
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={animalsList.isError}
            error={animalsList.error}
            isEmpty={isEmpty}
            onRetry={() => animalsList.refetch()}
            isRetrying={animalsList.isFetching}
            retryLabel={text.list.error.retry}
            emptyIcon={PiCow as ElementType}
            emptyTitle={
              filtersApplied > 0
                ? text.list.emptyState.titleFiltered
                : canCreate
                  ? text.list.emptyState.titleEmpty
                  : text.list.emptyState.titleEmptyNoCreate
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : canCreate
                  ? text.list.emptyState.descriptionEmpty
                  : text.list.emptyState.descriptionEmptyNoCreate
            }
            canCreate={filtersApplied === 0 && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate(`${basePath}/novo`)}
          />
        </Box>
      </TableProvider>

      {/* Tarefa 27 (§7.2) — some com 0 selecionados; sem ação plugada nesta
          Tarefa, as Tarefas 28/29/30 preenchem `bulkActions`. */}
      {canBulk && (
        <AnimalBulkActionBar
          count={selectedUuids.length}
          actions={bulkActions}
          onClose={clearSelection}
          languageGB={languageGB}
        />
      )}

      <FilterSideAnimal
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
        title={text.list.deleteConfirm.title}
        itemName={resolveIdentification(toDelete?.identification ?? '', text.list.table)}
        warningText={text.list.deleteConfirm.warning}
      />

      {/* Tarefa 28 — diálogo de Status Reprodutivo em massa. */}
      <AnimalReproductiveStatusDialog
        isOpen={isOpenReproductive}
        onClose={onCloseReproductive}
        selectedUuids={selectedUuids}
        languageGB={languageGB}
        onSuccess={() => {
          onCloseReproductive();
          clearSelection();
        }}
      />

      {/* Tarefa 29 — diálogo de exclusão em massa (confirmação digitada). */}
      <AnimalDeleteManyDialog
        isOpen={isOpenDeleteMany}
        onClose={onCloseDeleteMany}
        selectedUuids={selectedUuids}
        selectedAnimals={selectedAnimals}
        onDeselectBlocked={handleDeselectBlocked}
        languageGB={languageGB}
        onSuccess={() => {
          onCloseDeleteMany();
          clearSelection();
        }}
      />

      {/* Tarefa 30 — diálogo de transferência de lote em massa. */}
      <AnimalBatchTransferDialog
        isOpen={isOpenBatchTransfer}
        onClose={onCloseBatchTransfer}
        selectedAnimals={selectedAnimals}
        languageGB={languageGB}
        onSuccess={() => {
          onCloseBatchTransfer();
          clearSelection();
        }}
      />
    </ContainerGrid>
  );
}
