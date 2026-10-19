// src/pages/BaseRegistrations/Banks/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de BANCOS — Cadastros Base /
// Financeiros. Rota: /cadastros-base/bancos (guardada por `banks_view`,
// registrada em src/router/index.tsx antes do catch-all /cadastros-base/*).
//
// Molde estrutural: CadastrosBase/GruposProduto/index.tsx (grid flat sem FK/
// hierarquia, mais próximo de Bank do que Racas/CentroCusto). Diferenças
// (TASK-BANK-FE-03, Bug #2 — corrige TASK-BANK-FE-01):
//   - `Bank` não tem `is_enabled` — sem Badge de status, sem drawer
//     `FilterSide*` (não há campo enum/booleano filtrável — decisão técnica
//     própria do Arquiteto, ver ficha "Decisão técnica #4": manter o `Input`
//     de busca já existente no header).
//   - `GET /banks` agora pagina/filtra de VERDADE no servidor
//     (TASK-BANK-API-PAG ✅ CONCLUÍDO) — `useBanksList` usa o adaptador de
//     meta real (mesmo de `useProductGroupsList`), NÃO mais o de página
//     única/`useMemo` client-side (obsoleto). A busca por `code`/`name` viaja
//     ao servidor via `search`, com debounce local (~400ms, `useEffect`+
//     `setTimeout` puro) para não martelar o backend a cada tecla — 1ª tela
//     do projeto com busca-enquanto-digita indo ao servidor (nenhuma outra
//     tela dispara 1 request por tecla; todas as outras buscas server-side
//     são via botão "Aplicar" de drawer).
//   - Exclusão SEM guarda de FK no backend (Achado #2 de TASK-BANK-FE-01 —
//     `DeleteBankAction` não captura `QueryException`/23503 apesar de existir
//     FK real `providers.bank_id → banks.id`). `onError` NÃO customizado
//     aqui — usa o tratamento genérico interno do `useRequest` (lê
//     `message`/`error` do envelope, seja um 422 estruturado ou um 500
//     genérico), sem fabricar mensagem de negócio ("banco em uso") que o
//     backend hoje não produz.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Landmark } from 'lucide-react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { deleteBank, listBanks } from '@/services/v2/Banks/bank-service';

import type { BankFilterForm, BankListItem } from '@/@types/v2/Banks';

import { HeaderTable } from './HeaderTable';

export default function BanksList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.bank;

  // `user_id` é o identificador estável para compor o escopo da preferência de
  // grid (mesma fonte que CadastrosBase/CentroCusto/index.tsx).

  const canCreate = can('banks_create');
  const canEdit = can('banks_edit');
  const canDelete = can('banks_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.banks,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange } =
    userPaginatedQuery<BankFilterForm>(defaultQueryOptions);

  // ---- Busca (servidor, code/name, com debounce local) --------------------
  // Estado LOCAL de texto — inicializado a partir do filtro já aplicado
  // (persistido em localStorage por `userPaginatedQuery`) para não perder o
  // valor ao recarregar a tela. O debounce abaixo evita 1 requisição por
  // tecla (ver nota de cabeçalho do arquivo).
  const [searchInput, setSearchInput] = useState(paginatedQuery.filter?.search ?? '');
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Não dispara no efeito de montagem inicial — `searchInput` já nasce
    // sincronizado com `paginatedQuery.filter?.search`, então rodar o
    // debounce aqui geraria um refetch supérfluo assim que a tela abre.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      handleFilterChange({ search: searchInput.trim() || undefined });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput, handleFilterChange]);

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<BankListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const banksList = useCustomGridQuery<BankListItem, BankFilterForm>({
    asyncFunction: listBanks,
    queryKey: queryKey.baseRegistrations.banks,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as BankFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ bankUuid }: { bankUuid: string }) => {
      return await deleteBank(bankUuid);
    },
    queryKey: queryKey.baseRegistrations.banks,
    queryKey2: queryKey.baseRegistrations.bank,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // mesma convenção usada por Species/ProductGroups para a mesma operação.
    // onError: NÃO customizado — usa o tratamento genérico interno do
    // useRequest (lê `message`/`error` do envelope). `DeleteBankAction` hoje
    // NÃO tem guarda de FK (Achado #2) — um Banco referenciado por um
    // Fornecedor pode surfacear um 500 genérico, tratado aqui como qualquer
    // outro erro de negócio (toast com a message do envelope).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (bank: BankListItem) => {
    setToDelete(bank);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ bankUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  // Itens já vêm filtrados/paginados do servidor (`search`/`page`/`per_page`
  // reais, TASK-BANK-API-PAG) — nenhum filtro adicional no client.
  const items = banksList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<BankListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.code}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.code },
      }),
      columnHelper.accessor('name', {
        header: text.list.table.name,
        enableHiding: false,
        meta: { gridLabel: text.list.table.name },
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/bancos/${row.original.uuid}`)}
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
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [navigate, isDeleting, languageGB.defaltStrings.actions, text, canEdit, canDelete]
  );

  const gridSettings = useGridSettings<BankListItem>({
    storageKey: 'GBCerneBaseRegistrationsBanks',
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([banksList]);
  // Reflete o filtro REALMENTE aplicado no servidor (não o texto ainda sendo
  // digitado localmente) — evita o EmptyState mostrar a variante "filtrado"
  // antes do debounce aplicar.
  const hasSearch = Boolean(paginatedQuery.filter?.search);
  const isEmpty = !isLoading && items.length === 0;

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
            <HeaderTable
              searchValue={searchInput}
              onSearchChange={setSearchInput}
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
            isError={banksList.isError}
            error={banksList.error}
            isEmpty={isEmpty}
            onRetry={() => banksList.refetch()}
            isRetrying={banksList.isFetching}
            emptyIcon={Landmark as ElementType}
            emptyTitle={
              hasSearch ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              hasSearch
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={!hasSearch && canCreate}
            createLabel={text.list.emptyState.cta}
            onCreate={() => navigate('/cadastros-base/bancos/novo')}
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
        title={text.list.deleteConfirm.title}
        itemName={toDelete?.name}
        warningText={text.list.deleteConfirm.warning}
      />
    </ContainerGrid>
  );
}
