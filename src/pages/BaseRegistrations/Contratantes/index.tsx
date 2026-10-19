// src/pages/BaseRegistrations/Contratantes/index.tsx
// Tela de LISTAGEM de Contratantes (Tenant) — Cadastros Base → Gerais.
// Mirror estrutural do canônico `BaseRegistrations/DiagnosisPregnancy/
// index.tsx` (protocolo v2), com `useGridSettings`/`GridSettingsFloatingPanel`
// wired (item 8 do protocolo, obrigatório mesmo para grid pequena — mirror
// `BodyScores/index.tsx`). Coluna de status usa `tenantStatusBadgeVariant`
// (mapa de cor co-locado, Lei 6 — nunca `colorPalette` cru), mesmo padrão de
// `Afiliados/index.tsx::partnerStatusBadgeVariant` (precedente mais próximo,
// mesma forma de status multi-valor).
//
// Filtros do legado (TASK-072-FE-07, I10): search, status, assinatura, mês e
// dia de vencimento, adesão, período de criação, atribuição e plano — 10 por
// página, ordenados por nome no back (`TenantRepository`).

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Building2 } from 'lucide-react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
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
import { docTypeOfDigits, normalizeDocument } from '@/utils/cpfCnpj';
import formatDate from '@/utils/formatDate';
import { formatDocument } from '@/utils/formatDocument';
import { styleColumTable } from '@/utils/style-colum-table';

import { countAppliedTenantFilters } from '@/constants/BaseRegistrations/mappers/tenant-filter-mapper';
import { tenantStatusBadgeVariant } from '@/constants/BaseRegistrations/options/tenant-status-options';
import { queryKey } from '@/constants/query-key';

import { deleteTenant, listTenants } from '@/services/v2/BaseRegistrations/tenant-service';

import type { TenantListItem, TenantsFilterForm } from '@/@types/v2/BaseRegistrations/tenant';

import { FilterSideContratantes } from './FilterSideContratantes';
import { HeaderTable } from './HeaderTable';

// Mascara CPF/CNPJ para exibição na grid — heurística pura por contagem de
// dígitos (11/14), mirror `Afiliados/index.tsx::maskNif`. `TenantListItem`
// não expõe `country_id` (a máscara BR-only da Gate 3 do contrato de tela
// governa só o INPUT do formulário, não a leitura da grid) — dígitos que não
// batem 11/14 (outro país, sem doc formatável) caem no fallback cru.
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

export default function ContratantesList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.tenant;

  const canCreate = can('tenants_create');
  const canEdit = can('tenants_edit');
  // TASK-072-FE-06 (I9) — ação única por linha: Editar (tenants_edit) ou,
  // na falta dela, Visualizar (tenants_view), mirror da ação "Visualizar"
  // do `index.blade.php` legado.
  const canView = can('tenants_view');
  const canDelete = can('tenants_delete');

  // Chave de storage desta tela — paginação (`userPaginatedQuery`) e
  // personalização de grid (`useGridSettings`) derivam da MESMA expressão
  // (mirror `BodyScoreList`, DEC-007 §12).
  const storageKey = languageGB.baseRegistrations.titleModule + queryKey.baseRegistrations.tenants;

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey,
    }),
    [storageKey]
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<TenantsFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  // TASK-072-FE-07 — conta só as chaves do contrato (`role_label`/
  // `plan_label` são rótulos de apresentação, não filtros).
  const filtersApplied = useMemo(
    () => countAppliedTenantFilters(paginatedQuery.filter),
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<TenantListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const tenantsList = useCustomGridQuery<TenantListItem, TenantsFilterForm>({
    asyncFunction: listTenants,
    queryKey: queryKey.baseRegistrations.tenants,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as TenantsFilterForm),
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ tenantUuid }: { tenantUuid: string }) => {
      return await deleteTenant(tenantUuid);
    },
    queryKey: queryKey.baseRegistrations.tenants,
    queryKey2: queryKey.baseRegistrations.tenant,
    // `useRequest` não tem variante "delete" nativa — mesma convenção usada
    // por BodyScore/DiagnosisPregnancy/Afiliados para a mesma operação. O
    // texto do toast vem de `personalizedMessage`, então o rótulo genérico
    // associado a "update" nunca aparece ao usuário.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (tenant: TenantListItem) => {
    setToDelete(tenant);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ tenantUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<TenantListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor((row) => row.person.nickname, {
        id: 'nickname',
        header: text.list.table.nickname,
        enableHiding: false,
        meta: { gridLabel: text.list.table.nickname },
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={Building2} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.person.nickname}
            </Text>
          </Flex>
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
        meta: { ...styleColumTable.md, gridLabel: text.list.table.nif },
      }),
      columnHelper.accessor((row) => row.status.value, {
        id: 'status',
        header: text.list.table.status,
        cell: ({ row }) => (
          <Badge
            colorPalette={tenantStatusBadgeVariant[row.original.status.value]}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.status.label}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.status },
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
        meta: { ...styleColumTable.date, gridLabel: text.list.table.dueDate },
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
                  onClick={() => navigate(`/cadastros-base/contratantes/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {!canEdit && canView && (
                <Actions.Item
                  icon={<Icon as={FiEye} />}
                  onClick={() => navigate(`/cadastros-base/contratantes/${row.original.uuid}`)}
                >
                  {text.list.actions.view}
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
    [navigate, isDeleting, languageGB, text, canEdit, canView, canDelete]
  );

  const gridSettings = useGridSettings<TenantListItem>({
    storageKey,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = checkLoadingStatus([tenantsList]);
  const items = tenantsList.data?.data?.items;
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

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
            isError={tenantsList.isError}
            error={tenantsList.error}
            isEmpty={isEmpty}
            onRetry={() => tenantsList.refetch()}
            isRetrying={tenantsList.isFetching}
            emptyIcon={Building2}
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
            onCreate={() => navigate('/cadastros-base/contratantes/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideContratantes
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
        itemName={toDelete?.person.nickname}
        warningText={text.list.deleteConfirm.warning}
        tone="danger"
      />
    </ContainerGrid>
  );
}
