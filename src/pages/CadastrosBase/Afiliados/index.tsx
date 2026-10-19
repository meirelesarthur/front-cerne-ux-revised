// src/pages/CadastrosBase/Afiliados/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid flat, sem hierarquia) de AFILIADOS (Partner) —
// Cadastros Base / Pessoas, execução 024, TASK-FE-431. Rota:
// /cadastros-base/pessoas/afiliados (guardada por `partners_view`, wiring de
// rota real em TASK-FE-433).
//
// Mirror estrutural EXATO de `Produtos/Classes/index.tsx` (Kind) — catálogo
// GLOBAL sem farm/tenant, grid flat, mesma composição de componentes
// (`ContainerGrid`, `TableProvider`+`Table`, `HeaderGrid`+`HeaderTable`,
// `EmptyState.Root` 3 variantes, `DeleteConfirmDialog`).
//
// Colunas na ordem do legado (Partner-Frontend-Contrato.md §3.3): Nome, CPF/
// CNPJ, Telefone, Status, Dt. Afiliação, Dt. Vigência, Ações. Coluna
// "Telefone" usa `contact_phone` — `PartnerResource` real (§10 do contrato
// backend) NÃO expõe `person.phone` (achado documentado em
// `@types/v2/Afiliados/index.d.ts`), fallback já previsto (GAP-FE-126 é sobre
// o FILTRO de período, não sobre esta coluna).
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
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
import { docTypeOfDigits, normalizeDocument } from '@/utils/cpfCnpj';
import formatDate from '@/utils/formatDate';
import { formatDocument } from '@/utils/formatDocument';
import { styleColumTable } from '@/utils/style-colum-table';

import { partnerStatusBadgeVariant } from '@/constants/afiliados/partner/options/partner-status-options';
import { queryKey } from '@/constants/query-key';

import { deletePartner } from '@/services/v2/Afiliados/partner-service';

import type { PartnerFilterForm, PartnerListItem } from '@/@types/v2/Afiliados';

import { FilterSideAfiliados } from './FilterSideAfiliados';
import { HeaderTable } from './HeaderTable';
import { usePartnersList } from './useAfiliados';

// Mascara CPF/CNPJ para exibição na grid (mirror `Pessoas/nif.ts::maskNif`,
// reimplementado sobre os utils compartilhados `@/utils/cpfCnpj` +
// `@/utils/formatDocument` — sem importar de dentro de `Pessoas/`, mesma
// disciplina já adotada por `Fazendas/StepIdentificacao.tsx`/`Contador`).
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

export default function AfiliadosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.afiliados.partner;

  const canCreate = can('partners_create');
  const canEdit = can('partners_edit');
  const canDelete = can('partners_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseAfiliados' + queryKey.afiliados.partners,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<PartnerFilterForm>(defaultQueryOptions);

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
  const [toDelete, setToDelete] = useState<PartnerListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const partnersList = usePartnersList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ partnerUuid }: { partnerUuid: string }) => {
      return await deletePartner(partnerUuid);
    },
    queryKey: queryKey.afiliados.partners,
    queryKey2: queryKey.afiliados.partner,
    // `useRequest` não tem variante "delete" nativa — mesmo contorno já usado
    // em Kind/Racas/GruposProduto.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (partner: PartnerListItem) => {
    setToDelete(partner);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ partnerUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const items = partnersList.data?.data?.items ?? [];

  const columnHelper = createColumnHelper<PartnerListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.person.name, {
        id: 'name',
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.person.name}
          </Text>
        ),
      }),
      columnHelper.accessor((row) => row.person.nif, {
        id: 'nif',
        header: text.list.table.nif,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {maskNif(row.original.person.nif)}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      // `person.phone` não é exposto por `PartnerResource` (achado
      // documentado em `@types/v2/Afiliados/index.d.ts`) — fallback
      // `contact_phone` (GAP-FE-126 é sobre o filtro de período, não sobre
      // esta coluna).
      columnHelper.accessor('contact_phone', {
        id: 'phone',
        header: text.list.table.phone,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.contact_phone ?? '—'}
          </Text>
        ),
        meta: styleColumTable.md,
      }),
      columnHelper.accessor((row) => row.status.value, {
        id: 'status',
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={partnerStatusBadgeVariant[row.original.status.value]}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.status.label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('dt_affiliation', {
        header: text.list.table.dtAffiliation,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.dt_affiliation)}
          </Text>
        ),
        meta: styleColumTable.date,
      }),
      columnHelper.accessor('due_date', {
        header: text.list.table.dueDate,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {row.original.due_date
              ? formatDate(row.original.due_date)
              : text.list.table.dueDateIndeterminate}
          </Text>
        ),
        meta: styleColumTable.date,
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
                  onClick={() => navigate(`/cadastros-base/pessoas/afiliados/${row.original.uuid}`)}
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

  const isLoading = checkLoadingStatus([partnersList]);
  const isEmpty = !isLoading && items.length === 0;

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
            isError={partnersList.isError}
            error={partnersList.error}
            isEmpty={isEmpty}
            onRetry={() => partnersList.refetch()}
            isRetrying={partnersList.isFetching}
            emptyIcon={FiUsers as ElementType}
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
            onCreate={() => navigate('/cadastros-base/pessoas/afiliados/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideAfiliados
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
        itemName={toDelete?.person.name}
      />
    </ContainerGrid>
  );
}
