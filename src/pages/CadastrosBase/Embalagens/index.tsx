// src/pages/CadastrosBase/Embalagens/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de EMBALAGENS (Package) —
// Cadastros Base / Estrutura, execução 025. Rota:
// /cadastros-base/embalagens (guardada por `product-packages_view`, wiring
// de rota real em TASK-FE-523).
//
// Passo UX: layout adotado de `EmbalagemLista.tsx` (GB.Cerne.UX, commit
// 305e10e3), implementado com o catálogo real do fork (`ContainerGrid`/
// `Table`), não com os componentes visuais do `cerne` — mirror estrutural de
// `Classes/index.tsx` (grid + filtro + delete, mesmo grupo de menu
// "Produtos").
//
// ACHADO CRÍTICO (Package-Frontend-Contrato.md §3.3) — guard de fazenda
// ativa OBRIGATÓRIO: o backend usa bloco `farm.context` ESTRITO — sem
// `X-Farm-Id`, 403 imediato, mesmo o dado sendo tenant-scoped (não
// filtrado por fazenda). Package é o PRIMEIRO catálogo COM LISTAGEM (não
// settings-form de registro único, ao contrário de `TenantParameters`) a
// precisar desse guard — esta tela ESTABELECE o padrão: a query só dispara
// quando `usePermissions().hasFarm` é `true`; caso contrário, mostra um
// estado informativo em vez de deixar a requisição estourar 403.
//
// `size` chega como NUMBER do backend (`PackageResource` serializa
// `(float) $this->size`, apesar do cast Eloquent ser `decimal:2`) — nunca
// exibida crua, sempre formatada `pt-BR` 2 casas decimais. CORREÇÃO
// TASK-FE-522: `measurement` chega FLAT (`measurement_uuid`/
// `measurement_name`), não aninhado — ver @types/v2/Packages/index.d.ts.
//
// SortHeader do mock explicitamente NÃO adotado — o backend já ordena
// `description asc` fixo, sem parâmetro de sort no front (Contrato §2).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiPackage, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
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

import { deletePackage } from '@/services/v2/Packages/package-service';

import type { PackageFilterForm, PackageListItem } from '@/@types/v2/Packages';

import { FilterSideEmbalagens } from './FilterSideEmbalagens';
import { HeaderTable } from './HeaderTable';
import { usePackagesList } from './usePackages';

import { PageHeader } from '@/components/ui/PageHeader';

export default function EmbalagensList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can, hasFarm } = usePermissions();
  const text = languageGB.packages.package;

  // Permissões REAIS do backend (product-packages_*, grafia com hífen,
  // idêntica ao backend — sem divergência, ver Contrato §1).
  const canCreate = can('product-packages_create');
  const canEdit = can('product-packages_edit');
  const canDelete = can('product-packages_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseEmbalagens' + queryKey.packages.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<PackageFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<PackageListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Guard de fazenda ativa (§3.3 do Contrato) — a query só dispara quando
  // `hasFarm` é verdadeiro. Sem fazenda ativa, NENHUMA chamada de rede é
  // feita (evita 403 cru do backend `farm.context` estrito).
  const packagesList = usePackagesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
    enabled: hasFarm,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ packageUuid }: { packageUuid: string }) => {
      return await deletePackage(packageUuid);
    },
    queryKey: queryKey.packages.list,
    queryKey2: queryKey.packages.detail,
    // ERRO-FE-018: excluir Embalagem também precisa invalidar o cache do
    // multiselect de Produto (`usePackageOptionsList`) — senão a Embalagem
    // excluída continua aparecendo lá como selecionável.
    queryKey3: queryKey.packages.options,
    // `useRequest`'s TypesRequest não tem variante "delete" — "update" é a
    // opção compilável usada pelo mesmo motivo em Classes/GruposProduto (o
    // texto exibido vem de `personalizedMessage`). O `onError` GLOBAL deste
    // hook já exibe a mensagem de negócio real (422 de FK em uso — Embalagem
    // vinculada a produtos).
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (item: PackageListItem) => {
    setToDelete(item);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ packageUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const items = hasFarm ? (packagesList.data?.data?.items ?? []) : [];

  const columnHelper = createColumnHelper<PackageListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('description', {
        header: text.list.columns.description,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.description}
          </Text>
        ),
      }),
      columnHelper.accessor('size', {
        header: text.list.columns.size,
        // `size` chega como STRING do backend (decimal cast) — nunca exibida
        // crua, sempre formatada pt-BR com 2 casas decimais (Contrato §2/
        // Riscos + solução da Tarefa).
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {Number(row.original.size).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.measurement_name ?? '', {
        id: 'measurement',
        header: text.list.columns.measurement,
        cell: ({ row }) =>
          row.original.measurement_name ? (
            <Text fontSize="sm" color="fg.muted" lineClamp="1">
              {row.original.measurement_name}
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ),
        meta: styleColumTable.md,
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
                  onClick={() => navigate(`/cadastros-base/embalagens/${row.original.uuid}`)}
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
    [navigate, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = hasFarm && checkLoadingStatus([packagesList]);
  const isEmpty = hasFarm && !isLoading && items.length === 0;

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
          {!hasFarm ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiPackage} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.noFarmSelected.title}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.noFarmSelected.description}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={packagesList.isError}
              error={packagesList.error}
              isEmpty={isEmpty}
              onRetry={() => packagesList.refetch()}
              isRetrying={packagesList.isFetching}
              emptyIcon={FiPackage as ElementType}
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
              onCreate={() => navigate('/cadastros-base/embalagens/novo')}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideEmbalagens
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={(applied) => handleFilterChange(applied)}
        handleReset={() => handleResetFilter()}
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
        itemName={toDelete?.description}
        warningText={text.list.deleteConfirm.warning}
      />
    </ContainerGrid>
  );
}
