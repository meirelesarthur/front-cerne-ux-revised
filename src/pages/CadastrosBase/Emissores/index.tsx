// src/pages/CadastrosBase/Emissores/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid FLAT — sem hierarquia) de EMISSORES NFe (Issuer) —
// Cadastros Base / Fiscal (execução 023, TASK-FE-321).
// Rota: /cadastros-base/emissores (guardada por `issue_view`, registrada em
// src/router/index.tsx, TASK-FE-325).
//
// Referência UX real (raro nesta esteira): `EmissoresLista.tsx` (ux_root,
// commit f45073270fc2de51feaa264de92326229dd15338). Estrutura mecânica
// idêntica a CondicoesPagamento/index.tsx (ContainerGrid/HeaderGrid/
// TableProvider/Table, paginação REAL server-side).
//
// Coluna "Certificado" mostra só 2 estados a partir do dado do índice
// (`has_certificate` boolean) — os estados ricos (expirado/expirando/válido,
// com contagem de dias) só existem DENTRO da tela dedicada de certificado de
// UM registro por vez (contrato de tela §5.4, D9 do contrato de backend: o
// índice NUNCA decifra certificados em lote). SEM filtro de Ambiente
// (GAP-FE-114) — a coluna aparece (dado de leitura), só não é filtrável.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCheck, FiEdit, FiFileText, FiShield, FiTrash2, FiX } from 'react-icons/fi';
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

import { deleteIssuer } from '@/services/v2/Issuers/issuer-service';

import type { IssuerFilterForm, IssuerListItem } from '@/@types/v2/Issuers';

import { FilterSideEmissores } from './FilterSideEmissores';
import { HeaderTable } from './HeaderTable';
import { useIssuerList } from './useIssuers';

import { PageHeader } from '@/components/ui/PageHeader';

import { ListToolbar } from '@/components/ui/ListToolbar';
import { useListSearch } from '@/hooks/useListSearch';

export default function EmissoresList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.issuers.issuer;

  const canCreate = can('issue_create');
  const canEdit = can('issue_edit');
  const canDelete = can('issue_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseEmissores' + queryKey.issuers.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<IssuerFilterForm>(defaultQueryOptions);
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

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<IssuerListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const issuersList = useIssuerList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ issuerUuid }: { issuerUuid: string }) => {
      return await deleteIssuer(issuerUuid);
    },
    queryKey: queryKey.issuers.list,
    queryKey2: queryKey.issuers.detail,
    // `useRequest` não tem variante própria de "delete" — "update" é a mesma
    // convenção já usada por PaymentTerm/FamilyEquipment. onError NÃO
    // customizado — o 422 estruturado de GAP-BE-052 (se/quando resolvido)
    // já é exibido pelo tratamento genérico do useRequest.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (issuer: IssuerListItem) => {
    setToDelete(issuer);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ issuerUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<IssuerListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('razao_social', {
        header: text.list.table.razaoSocial,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.razao_social}
          </Text>
        ),
      }),
      columnHelper.accessor('cpf_cnpj', {
        header: text.list.table.cpfCnpj,
        cell: ({ row }) => <Text lineClamp="1">{row.original.cpf_cnpj}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.display({
        id: 'cidade',
        header: text.list.table.cidade,
        cell: ({ row }) => (
          <Text lineClamp="1">
            {[row.original.endereco.cidade_nome, row.original.endereco.uf]
              .filter(Boolean)
              .join(' — ') || '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('ambiente_label', {
        header: text.list.table.ambiente,
        cell: ({ row }) => <Text lineClamp="1">{row.original.ambiente_label ?? '—'}</Text>,
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('issues_nfe', {
        header: text.list.table.issuesNfe,
        cell: ({ row }) => (
          <Icon
            as={row.original.issues_nfe ? FiCheck : FiX}
            color={row.original.issues_nfe ? 'green.500' : 'fg.muted'}
            boxSize={5}
          />
        ),
        meta: styleColumTable.sm,
      }),
      // Só 2 estados a partir do dado do índice — contrato de tela §5.4 (D9
      // do contrato de backend: nunca decifra certificados em lote).
      columnHelper.accessor('has_certificate', {
        header: text.list.table.certificado,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.has_certificate ? 'blue' : 'orange'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.has_certificate
              ? text.list.table.certificadoConfigured
              : text.list.table.certificadoNotConfigured}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.active : text.list.table.inactive}
          </Badge>
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
                  onClick={() => navigate(`/cadastros-base/emissores/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item
                  icon={<Icon as={FiShield} />}
                  onClick={() =>
                    navigate(`/cadastros-base/emissores/${row.original.uuid}/certificado`)
                  }
                >
                  {text.list.actions.certificate}
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

  const isLoading = checkLoadingStatus([issuersList]);
  const items = issuersList.data?.data?.items;
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
          <PageHeader title={text.list.pageTitle} description={text.list.pageSubtitle} />
        </HeaderGrid>

        <ListToolbar
          search={listSearch.value}
          onSearch={listSearch.onChange}
          searchPlaceholder={languageGB.defaltStrings.searchList}
          onOpenFilter={onOpenFilter}
          filtersApplied={filtersApplied - (paginatedQuery.filter?.search ? 1 : 0)}
        />

        <Box>
          <Table
            isLoading={isLoading}
            isError={issuersList.isError}
            error={issuersList.error}
            isEmpty={isEmpty}
            onRetry={() => issuersList.refetch()}
            isRetrying={issuersList.isFetching}
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
            onCreate={() => navigate('/cadastros-base/emissores/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideEmissores
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
        itemName={toDelete?.razao_social}
      />
    </ContainerGrid>
  );
}
