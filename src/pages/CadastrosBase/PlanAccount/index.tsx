// src/pages/CadastrosBase/PlanAccount/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PLANO DE CONTAS — Cadastros Base, domínio
// Financeiro (TASK-PA-03a).
//
// Rota: /cadastros-base/plano-de-contas (guardada por `plan-accounts_view`,
// registrada em src/router/index.tsx — este arquivo não mexe em rota/menu).
//
// Estrutura ADAPTADA de CadastrosBase/CentroCusto/index.tsx (precedente
// estrutural confirmado pelo dev — ver "Decisão do Desenvolvedor" na Tarefa):
//   - grid PAGINADO (TableProvider + Table) via usePlanAccountsList, NÃO uma
//     árvore com expand/collapse — o contrato aprovado só expõe
//     `GET /plan-accounts` paginado, sem endpoint `/tree` (decisão explícita
//     do dev, 2026-07-20: grid paginado + indentação, NÃO árvore real);
//   - indentação visual por profundidade via `row.original.parent` (mesmo
//     padrão `pl={row.original.parent ? 4 : 0}` do CentroCusto — o contrato
//     só devolve o PAI direto, não a profundidade numérica, então a
//     indentação é binária: tem pai vs. é raiz, igual ao módulo irmão);
//   - ação de linha "Ver subcontas" — NÃO é navegação nem query nova: aplica
//     o filtro `parent_uuid` sobre a mesma listagem (reaproveita o mecanismo
//     de filtro já existente, sem carregar a árvore inteira de uma vez);
//   - `class`/`code` são SEMPRE somente-leitura nesta tela (badge/texto),
//     nunca em nenhum estado editável (DA-PA-01/DA-PA-02);
//   - exclusão via useRequest + DeleteConfirmDialog — o 422 de exclusão
//     bloqueada (DA-PA-05: subcontas/lançamentos/categorias vinculadas) trae
//     uma mensagem ÚNICA em `message` (não um array por campo) — o `onError`
//     GENÉRICO de `useRequest` já lê `resData?.message` e mostra no toast,
//     sem necessidade de tratamento dedicado (diferente de outros módulos
//     com erros 422 estruturados por campo);
//   - Empty state com 2 variantes (GAP-PA-01/DA-PA-03, Opção B): (a) tenant
//     sem filtro aplicado e sem NENHUMA conta própria — situação aceita para
//     ~93% dos tenants (404 de 437, fidelidade consciente ao legado) — texto
//     específico explicando que a fazenda ainda não tem plano de contas
//     próprio, CTA "Nova Conta" se `plan-accounts_create`; (b) filtro
//     aplicado sem resultado — mensagem genérica de filtro sem match.
//
// As rotas de formulário (`/novo`, `/:uuid`) ainda não existem (Tarefa irmã
// TASK-PA-03b) — navegar para elas cai no catch-all `/cadastros-base/*`
// (RoutePlaceholder), sem quebrar a aplicação.
// -----------------------------------------------------------------------------

import { ElementType, useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  FiCornerDownRight,
  FiEdit,
  FiFolder,
  FiPlusCircle,
  FiPower,
  FiTrash2,
} from 'react-icons/fi';
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

import {
  deletePlanAccount,
  getPlanAccount,
  updatePlanAccount,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { PlanAccountFilterForm, PlanAccountListItem } from '@/@types/v2/PlanAccounts';

import { FilterSidePlanAccount } from './FilterSidePlanAccount';
import { HeaderTable } from './HeaderTable';
import { usePlanAccountsList } from './usePlanAccounts';

// `parent_label` é display-only (só re-hidrata o nome da conta-pai no
// drawer; NUNCA vai à API — ver comentário espelho em
// `plan-account-service.ts` e em `FilterSidePlanAccount.tsx`). Contar essa
// chave junto com `parent_uuid` infla o badge "Filtros(N)": uma única
// conta-pai selecionada geraria 2 chaves truthy no mesmo filtro.
const DISPLAY_ONLY_FILTER_KEYS = ['parent_label'];

export default function PlanAccountList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.planAccounts.planAccount;

  // PlanAccountResource não expõe flags de autorização por item
  // (`can_edit`/`can_delete`/`can_create_descendant`, diferente de
  // CostCenter/DEC-005) — a permissão genérica basta, sem exceção de papel.
  const canCreate = can('plan-accounts_create');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBasePlanAccount' + queryKey.planAccounts.list,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<PlanAccountFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, v]) =>
          !DISPLAY_ONLY_FILTER_KEYS.includes(key) &&
          v !== undefined &&
          v !== null &&
          v !== '' &&
          v !== false
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<PlanAccountListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const planAccountsList = usePlanAccountsList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ planAccountUuid }: { planAccountUuid: string }) => {
      return await deletePlanAccount(planAccountUuid);
    },
    queryKey: queryKey.planAccounts.list,
    queryKey2: queryKey.planAccounts.detail,
    // `useRequest`'s TypesRequest não tem variante "delete" (só update/create/
    // apply/export/revoke/restore) — "update" é a mesma convenção usada por
    // CostCenter/Perfil para a mesma operação; o texto exibido vem de
    // `personalizedMessage`, então o rótulo genérico nunca aparece ao
    // usuário. O `onError` GENÉRICO já lê `resData?.message` (mensagem ÚNICA
    // de negócio — DA-PA-05 — não um array por campo), suficiente para o
    // shape atual do contrato — sem tratamento dedicado necessário aqui.
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (planAccount: PlanAccountListItem) => {
    setToDelete(planAccount);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ planAccountUuid: toDelete.uuid });
    }
  };

  // ---- Toggle rápido Ativar/Inativar (TASK-PA-09) -------------------------
  // A grid (`PlanAccountListItem`) NÃO tem `categories` (só o detalhe via
  // `GET /plan-accounts/{uuid}` tem — `PlanAccountDetail`). `PUT` exige
  // payload COMPLETO (`description`/`condition`/`is_enabled` required,
  // `category_uuids` omitido == `[]` no backend, desvinculando TODAS as
  // categorias financeiras — Achado 1.1 do ROTEIRO-03). Por isso o handler
  // busca o detalhe completo ANTES de montar o PUT — nunca monta o payload
  // só com `row.original`.
  const toggleMutation = useRequest({
    asyncFunction: async ({
      planAccountUuid,
      nextIsEnabled,
    }: {
      planAccountUuid: string;
      nextIsEnabled: boolean;
    }) => {
      const detail = await getPlanAccount(planAccountUuid);

      return await updatePlanAccount(planAccountUuid, {
        description: detail.data.description,
        condition: detail.data.condition,
        is_enabled: nextIsEnabled,
        type: detail.data.type ?? null,
        category_uuids: (detail.data.categories ?? []).map((category) => category.uuid),
        // `parent_uuid` NUNCA no payload de update — prohibited no backend.
      });
    },
    queryKey: queryKey.planAccounts.list,
    queryKey2: queryKey.planAccounts.detail,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.statusUpdatedToast,
    actionSuccess: () => {},
  });

  const isToggling = toggleMutation.isPending;

  const handleToggleClick = (planAccount: PlanAccountListItem) => {
    toggleMutation.mutate({
      planAccountUuid: planAccount.uuid,
      nextIsEnabled: !planAccount.is_enabled,
    });
  };

  // "Ver subcontas": não é uma query nova nem navegação — só refina a mesma
  // listagem aplicando o filtro `parent_uuid` (contrato, Seção 3.1).
  const handleViewSubaccounts = (planAccount: PlanAccountListItem) => {
    handleFilterChange({
      ...(paginatedQuery.filter ?? {}),
      parent_uuid: planAccount.uuid,
      parent_label: `${planAccount.code} — ${planAccount.description}`,
    });
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<PlanAccountListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('code', {
        header: text.list.table.code,
        cell: ({ row }) => (
          <Text fontFamily="mono" fontSize="sm" fontWeight="medium">
            {row.original.code}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('class_label', {
        header: text.list.table.class,
        cell: ({ row }) => (
          // Sintético (class 1) = badge "info"; Analítico (class 2) = badge
          // "green" — mesma convenção do CentroCusto. Sempre somente-leitura
          // (DA-PA-01 — derivado no servidor por profundidade, nunca editável).
          <Badge colorPalette={row.original.class === 1 ? 'info' : 'green'} variant="subtle">
            {row.original.class_label}
          </Badge>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('condition_label', {
        header: text.list.table.condition,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.condition_label}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('description', {
        header: text.list.table.description,
        cell: ({ row }) => (
          <Flex align="center" gap={2} pl={row.original.parent ? 4 : 0}>
            <Icon as={FiFolder} color="blue.400" boxSize={4} flexShrink={0} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.description}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor('type_label', {
        header: text.list.table.type,
        cell: ({ row }) =>
          // `type` é nullable (DA-PA-14) — omitir o badge quando ausente, sem
          // fabricar um rótulo "N/A".
          row.original.type_label ? (
            // `type` é numérico (CAPEX=1/OPEX=2, DA-PA-14 — TASK-PA-FIX-03,
            // `PlanAccountResource` nunca devolveu a string 'capex'/'opex').
            <Badge colorPalette={row.original.type === 1 ? 'blue' : 'orange'} variant="subtle">
              {row.original.type_label}
            </Badge>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              —
            </Text>
          ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('is_enabled', {
        header: text.list.table.active,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_enabled ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
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
              <Actions.Item
                icon={<Icon as={FiCornerDownRight} />}
                onClick={() => handleViewSubaccounts(row.original)}
              >
                {text.list.actions.viewSubaccounts}
              </Actions.Item>
              {canCreate && row.original.is_enabled && row.original.class === 1 && (
                <Actions.Item
                  icon={<Icon as={FiPlusCircle} />}
                  onClick={() =>
                    navigate(`/cadastros-base/plano-de-contas/novo/${row.original.uuid}`)
                  }
                >
                  {text.list.actions.createDescendant}
                </Actions.Item>
              )}
              {can('plan-accounts_edit') && (
                <Actions.Item
                  icon={<Icon as={FiEdit} />}
                  onClick={() => navigate(`/cadastros-base/plano-de-contas/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {can('plan-accounts_edit') && (
                <Actions.Item
                  icon={<Icon as={FiPower} />}
                  onClick={() => handleToggleClick(row.original)}
                  disabled={isToggling}
                >
                  {row.original.is_enabled
                    ? text.list.actions.deactivate
                    : text.list.actions.activate}
                </Actions.Item>
              )}
              {can('plan-accounts_delete') && (
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
    [navigate, isDeleting, isToggling, text, can]
  );

  const isLoading = checkLoadingStatus([planAccountsList]);
  const items = planAccountsList.data?.data?.items;
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
            isError={planAccountsList.isError}
            error={planAccountsList.error}
            isEmpty={isEmpty}
            onRetry={() => planAccountsList.refetch()}
            isRetrying={planAccountsList.isFetching}
            emptyIcon={FiFolder as ElementType}
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
            onCreate={() => navigate('/cadastros-base/plano-de-contas/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSidePlanAccount
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
        itemName={toDelete?.description}
      />
    </ContainerGrid>
  );
}
