// src/pages/CadastrosBase/Fornecedores/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de FORNECEDORES (Provider — Cadastros Base).
// Rota: /cadastros-base/fornecedores (guardada por `providers_view`, wiring
// em TASK-PR-FE-02). Item de menu `cad-for-lis` NOVO, separado de "Pessoas"
// (decisão do dono: COEXISTIR — Provider-FrontEnd-contrato.md ## 11 item 1).
//
// Referência UX: UX-GAP declarado e RESOLVIDO em
// `GAP-UX-PR-01-fornecedores-tela-inexistente-decisoes-escopo` — não existe
// tela "Fornecedores" dedicada no design system `cerne` (só o step embutido
// `StepFornecedor.tsx` do wizard "Pessoas"). Candidato de espelho adotado
// (Provider-FrontEnd-contrato.md ## 2): grid+filtro de
// Emissores/Armazem/Safra/CentroCusto (estrutura ContainerGrid/HeaderGrid/
// TableProvider/Table), adaptado aos tokens do `cerne` (`src/theme.ts`) —
// nenhum componente do Storybook importado direto.
//
// Colunas (contrato `## 6.1`): nif, name+nickname, city, type (badge +
// type_label — já resolvido pelo backend em `ProviderListResource`, nenhum
// dado fabricado), is_enabled (badge). Ações de linha (095): Editar, Desativar
// (`PATCH …/deactivate`) ou Ativar (`PATCH …/activate`) conforme `is_enabled`,
// ambas por `providers_edit`; e Excluir (`DELETE`, `providers_delete`). A
// exclusão com vínculos devolve 422 genérico e o toast exibe a `message`.
//
// Filtro PADRÃO (Teste do dev sugerido na ficha): `is_enabled=true` — a
// listagem abre já mostrando só Fornecedores ATIVOS; desativar um item o
// remove da vista padrão, reaparecendo só ao filtrar `is_enabled=false`
// explicitamente. "Limpar filtros" no drawer volta para "Todos" (sem filtro
// de status), não para este default.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTrash2, FiTruck, FiUserCheck, FiUserX } from 'react-icons/fi';
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
import { formatDocument } from '@/utils/formatDocument';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  activateProvider,
  deactivateProvider,
  deleteProvider,
} from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { ProviderFilterForm, ProviderListItem } from '@/@types/v2/CadastrosBase/provider';

import { FilterSideFornecedores } from './FilterSideFornecedores';
import { HeaderTable } from './HeaderTable';
import { useProviderList } from './useProviders';

// Máscara de EXIBIÇÃO de CPF/CNPJ (reuso dos utils globais já existentes —
// `format-document.ts`/`cpfCnpj.ts`, contrato `## 3` "Reuso obrigatório de
// utilitários" — nenhum novo helper de máscara criado aqui).
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

// Filtro PADRÃO da listagem — só Fornecedores ATIVOS (ver cabeçalho do
// arquivo). `isEnabled` já no shape `Option<boolean>` de `ProviderFilterForm`
// (TASK-PR-FE-01) — nenhuma conversão adicional necessária.
const defaultFilter: ProviderFilterForm = {
  isEnabled: { value: true, label: '' },
};

export default function FornecedoresList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.providers.provider;

  const canCreate = can('providers_create');
  const canEdit = can('providers_edit');
  const canDelete = can('providers_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseFornecedores' + queryKey.cadastrosBase.providers,
      filter: defaultFilter,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<ProviderFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de desativação ------------------------------------------------
  const [toDeactivate, setToDeactivate] = useState<ProviderListItem | null>(null);
  const {
    open: isOpenDeactivateDialog,
    onOpen: onOpenDeactivateDialog,
    onClose: onCloseDeactivateDialog,
  } = useDisclosure();

  const providerList = useProviderList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // Mutação dedicada de desativação (`PATCH …/deactivate`). `typesRequest:
  // 'update'` (mesma convenção de Pessoas/Perfil — não há variante "deactivate"
  // no `useRequest`).
  const deactivateMutation = useRequest({
    asyncFunction: async ({ providerUuid }: { providerUuid: string }) => {
      return await deactivateProvider(providerUuid);
    },
    queryKey: queryKey.cadastrosBase.providers,
    queryKey2: queryKey.cadastrosBase.provider,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deactivatedToast,
    actionSuccess: () => {
      onCloseDeactivateDialog();
      setToDeactivate(null);
    },
  });

  const handleDeactivateClick = (provider: ProviderListItem) => {
    setToDeactivate(provider);
    onOpenDeactivateDialog();
  };

  const handleConfirmDeactivate = () => {
    if (toDeactivate) {
      deactivateMutation.mutate({ providerUuid: toDeactivate.uuid });
    }
  };

  const isDeactivating = deactivateMutation.isPending;

  // ---- Estado de ativação (`PATCH /providers/{uuid}/activate`) -------------
  const [toActivate, setToActivate] = useState<ProviderListItem | null>(null);
  const {
    open: isOpenActivateDialog,
    onOpen: onOpenActivateDialog,
    onClose: onCloseActivateDialog,
  } = useDisclosure();

  const activateMutation = useRequest({
    asyncFunction: async ({ providerUuid }: { providerUuid: string }) => {
      return await activateProvider(providerUuid);
    },
    queryKey: queryKey.cadastrosBase.providers,
    queryKey2: queryKey.cadastrosBase.provider,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.activatedToast,
    actionSuccess: () => {
      onCloseActivateDialog();
      setToActivate(null);
    },
  });

  const handleActivateClick = (provider: ProviderListItem) => {
    setToActivate(provider);
    onOpenActivateDialog();
  };

  const handleConfirmActivate = () => {
    if (toActivate) {
      activateMutation.mutate({ providerUuid: toActivate.uuid });
    }
  };

  const isActivating = activateMutation.isPending;

  // ---- Estado de exclusão (095 — `DELETE /providers/{uuid}`) ---------------
  // Com vínculos a API responde 422 genérico: o `useRequest` exibe a `message`
  // no toast de erro, o diálogo fecha e o item permanece.
  const [toDelete, setToDelete] = useState<ProviderListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ providerUuid }: { providerUuid: string }) => {
      await deleteProvider(providerUuid);
      return undefined;
    },
    queryKey: queryKey.cadastrosBase.providers,
    queryKey2: queryKey.cadastrosBase.provider,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (provider: ProviderListItem) => {
    setToDelete(provider);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      // 422 (vínculos): o toast do `useRequest` exibe a `message` da API; aqui
      // só fecha o diálogo e mantém o item na lista.
      deleteMutation.mutate(
        { providerUuid: toDelete.uuid },
        {
          onError: () => {
            onCloseDeleteDialog();
            setToDelete(null);
          },
        }
      );
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<ProviderListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Box minW={0}>
            <Text fontWeight="medium" lineClamp="1">
              {row.original.name}
            </Text>
            <Text fontSize="xs" color="fg.muted" lineClamp="1">
              {row.original.nickname}
            </Text>
          </Box>
        ),
      }),
      columnHelper.accessor('nif', {
        header: text.list.table.document,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {maskNif(row.original.nif)}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('city', {
        header: text.list.table.city,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.city
              ? `${row.original.city.name}${row.original.city.state ? ` — ${row.original.city.state.uf}` : ''}`
              : '—'}
          </Text>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) => (
          <Badge colorPalette="blue" variant="subtle" py={1} px={3}>
            {row.original.type_label ?? '—'}
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
                  onClick={() => navigate(`/cadastros-base/fornecedores/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {canEdit && row.original.is_enabled && (
                <Actions.Item
                  icon={<Icon as={FiUserX} />}
                  onClick={() => handleDeactivateClick(row.original)}
                  disabled={isDeactivating}
                >
                  {text.list.actions.deactivate}
                </Actions.Item>
              )}
              {canEdit && !row.original.is_enabled && (
                <Actions.Item
                  icon={<Icon as={FiUserCheck} />}
                  onClick={() => handleActivateClick(row.original)}
                  disabled={isActivating}
                >
                  {text.list.actions.activate}
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
    [navigate, isDeactivating, isActivating, isDeleting, text, canEdit, canDelete]
  );

  const isLoading = checkLoadingStatus([providerList]);
  const items = providerList.data?.data?.items;
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
            isError={providerList.isError}
            error={providerList.error}
            isEmpty={isEmpty}
            onRetry={() => providerList.refetch()}
            isRetrying={providerList.isFetching}
            emptyIcon={FiTruck as ElementType}
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
            onCreate={() => navigate('/cadastros-base/fornecedores/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFornecedores
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeactivateDialog}
        onClose={() => {
          onCloseDeactivateDialog();
          setToDeactivate(null);
        }}
        onConfirm={handleConfirmDeactivate}
        isLoading={isDeactivating}
        itemName={toDeactivate?.name}
        title={text.list.deactivateDialog.title}
        description={text.list.deactivateDialog.description}
        warningText={text.list.deactivateDialog.warning}
        confirmButtonText={text.list.deactivateDialog.confirm}
        colorPalette="orange"
        tone="warning"
      />

      <DeleteConfirmDialog
        isOpen={isOpenActivateDialog}
        onClose={() => {
          onCloseActivateDialog();
          setToActivate(null);
        }}
        onConfirm={handleConfirmActivate}
        isLoading={isActivating}
        itemName={toActivate?.name}
        title={text.list.activateDialog.title}
        description={text.list.activateDialog.description}
        warningText={text.list.activateDialog.warning}
        confirmButtonText={text.list.activateDialog.confirm}
        colorPalette="green"
        tone="info"
      />

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => {
          onCloseDeleteDialog();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        itemName={toDelete?.name}
        title={text.list.deleteDialog.title}
        description={text.list.deleteDialog.description}
        warningText={text.list.deleteDialog.warning}
        confirmButtonText={text.list.deleteDialog.confirm}
        colorPalette="red"
        tone="danger"
      />
    </ContainerGrid>
  );
}
