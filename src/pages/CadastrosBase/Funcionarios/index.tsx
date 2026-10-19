// src/pages/CadastrosBase/Funcionarios/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de FUNCIONÁRIOS (Employee — Cadastros Base).
// Rota: /cadastros-base/funcionarios (guardada por `employees_view`, wiring
// em TASK-EMP-FE-02). Item de menu `cad-pes-fun` NOVO — hoje não existia
// (`navigationTree.ts` admitia literalmente "Funcionários ainda não tem
// página própria nesta SPA"), fechado por esta Tarefa.
//
// Sem desenho de UX dedicado (UX-GAP, Employee-FrontEnd-contrato.md `## 2`)
// — decisão do dono: seguir-pelo-padrão, espelhando `Fornecedores/index.tsx`
// (estrutura ContainerGrid/HeaderGrid/TableProvider/Table), adaptado aos
// campos de Employee — nenhum layout novo inventado.
//
// Colunas (Employee-FrontEnd-contrato.md `## 3.4`, shape real de
// `EmployeeListResource`, api_root): nif, name, email, phone, office,
// is_enabled (badge). SEM `nickname`/`city` — fora do DoD de `TASK-EMP-03`
// (confirmado no Resource real, `@/@types/v2/CadastrosBase/employee`) — não
// fabricado aqui, diferente da coluna "Nome" de Fornecedores (que mostra
// `nickname` como subtítulo real).
//
// Três ações por linha (095): "Desativar" (`PATCH …/deactivate`) e "Ativar"
// (`PATCH …/activate`), guardadas por `employees_edit`; "Excluir" (`DELETE`),
// guardada por `employees_delete`. A exclusão com vínculos devolve 422
// genérico e o toast do `useRequest` exibe a `message` da API.
// `DeactivateEmployeeRoleAction` (api_root) desativa o Employee E o
// registro-espelho de Provider da mesma pessoa, preservando os demais campos.
//
// Filtro PADRÃO (mirror Fornecedores): `is_enabled=true` — a listagem abre
// já mostrando só Funcionários ATIVOS; desativar um item o remove da vista
// padrão, reaparecendo só ao filtrar "Inativo" explicitamente. "Limpar
// filtros" no drawer volta para "Todos" (sem filtro de status).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiEdit, FiTrash2, FiUserCheck, FiUsers, FiUserX } from 'react-icons/fi';
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
  activateEmployee,
  deactivateEmployee,
  deleteEmployee,
} from '@/services/v2/CadastrosBase/Employee/employee-service';

import type { EmployeeFilterForm, EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';

import { FilterSideFuncionarios } from './FilterSideFuncionarios';
import { HeaderTable } from './HeaderTable';
import { useEmployeesList } from './useFuncionarios';

// Máscara de EXIBIÇÃO de CPF/CNPJ (reuso dos utils globais já existentes —
// mesmo helper local de `Fornecedores/index.tsx`, nenhum novo utilitário de
// máscara criado aqui).
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

// Filtro PADRÃO da listagem — só Funcionários ATIVOS (ver cabeçalho do
// arquivo). `isEnabled` já no shape `Option<boolean>` de `EmployeeFilterForm`
// (TASK-EMP-FE-01) — nenhuma conversão adicional necessária.
const defaultFilter: EmployeeFilterForm = {
  isEnabled: { value: true, label: '' },
};

export default function FuncionariosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.employees.employee;

  const canCreate = can('employees_create');
  const canEdit = can('employees_edit');
  const canDelete = can('employees_delete');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'CadastrosBaseFuncionarios' + queryKey.cadastrosBase.employees,
      filter: defaultFilter,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<EmployeeFilterForm>(defaultQueryOptions);

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
  const [toDeactivate, setToDeactivate] = useState<EmployeeListItem | null>(null);
  const {
    open: isOpenDeactivateDialog,
    onOpen: onOpenDeactivateDialog,
    onClose: onCloseDeactivateDialog,
  } = useDisclosure();

  const employeeList = useEmployeesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  // Mutação dedicada de desativação (`PATCH …/deactivate`). `typesRequest:
  // 'update'` (mesma convenção de Fornecedores para esta operação).
  const deactivateMutation = useRequest({
    asyncFunction: async ({ employeeUuid }: { employeeUuid: string }) => {
      return await deactivateEmployee(employeeUuid);
    },
    queryKey: queryKey.cadastrosBase.employees,
    queryKey2: queryKey.cadastrosBase.employee,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deactivatedToast,
    actionSuccess: () => {
      onCloseDeactivateDialog();
      setToDeactivate(null);
    },
  });

  const handleDeactivateClick = (employee: EmployeeListItem) => {
    setToDeactivate(employee);
    onOpenDeactivateDialog();
  };

  const handleConfirmDeactivate = () => {
    if (toDeactivate) {
      deactivateMutation.mutate({ employeeUuid: toDeactivate.uuid });
    }
  };

  const isDeactivating = deactivateMutation.isPending;

  // ---- Estado de ativação (reativação — ação condicional de linha) --------
  // Mirror EXATO do bloco de desativação acima; só o verbo/endpoint mudam
  // (`PATCH /employees/{uuid}/activate`). Convive na mesma coluna "Ações",
  // mutuamente exclusiva por linha com "Desativar" (ver `is_enabled` na
  // coluna de ações abaixo).
  const [toActivate, setToActivate] = useState<EmployeeListItem | null>(null);
  const {
    open: isOpenActivateDialog,
    onOpen: onOpenActivateDialog,
    onClose: onCloseActivateDialog,
  } = useDisclosure();

  const activateMutation = useRequest({
    asyncFunction: async ({ employeeUuid }: { employeeUuid: string }) => {
      return await activateEmployee(employeeUuid);
    },
    queryKey: queryKey.cadastrosBase.employees,
    queryKey2: queryKey.cadastrosBase.employee,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.activatedToast,
    actionSuccess: () => {
      onCloseActivateDialog();
      setToActivate(null);
    },
  });

  const handleActivateClick = (employee: EmployeeListItem) => {
    setToActivate(employee);
    onOpenActivateDialog();
  };

  const handleConfirmActivate = () => {
    if (toActivate) {
      activateMutation.mutate({ employeeUuid: toActivate.uuid });
    }
  };

  const isActivating = activateMutation.isPending;

  // ---- Estado de exclusão (095 — `DELETE /employees/{uuid}`) --------------
  // Com vínculos a API responde 422 genérico: o `useRequest` exibe a `message`
  // no toast de erro, o diálogo fecha e o item permanece.
  const [toDelete, setToDelete] = useState<EmployeeListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async ({ employeeUuid }: { employeeUuid: string }) => {
      await deleteEmployee(employeeUuid);
      return undefined;
    },
    queryKey: queryKey.cadastrosBase.employees,
    queryKey2: queryKey.cadastrosBase.employee,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (employee: EmployeeListItem) => {
    setToDelete(employee);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      // 422 (vínculos): o toast do `useRequest` exibe a `message` da API; aqui
      // só fecha o diálogo e mantém o item na lista.
      deleteMutation.mutate(
        { employeeUuid: toDelete.uuid },
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

  const columnHelper = createColumnHelper<EmployeeListItem>();
  const defaultColumns = useMemo(
    () => [
      // Bug 7 (F-164, esteira 090): sem `meta`/largura, a coluna esticava e o
      // nome longo era cortado sem reticências nem forma de ler o valor
      // completo. `title` nativo (tooltip do browser) + `meta:
      // styleColumTable.lg` — mesmo padrão já usado por colunas-irmãs que
      // truncam corretamente (`Operacional/Reproducao/EstacaoDeMonta`,
      // `BullSeedSeason`, `LoteReproducao`, coluna `description`).
      columnHelper.accessor('name', {
        header: text.list.table.name,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1" title={row.original.name}>
            {row.original.name}
          </Text>
        ),
        meta: styleColumTable.lg,
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
      columnHelper.accessor('email', {
        header: text.list.table.email,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.email ?? '—'}
          </Text>
        ),
      }),
      columnHelper.accessor('phone', {
        header: text.list.table.phone,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.phone ?? '—'}
          </Text>
        ),
        meta: styleColumTable.sm,
      }),
      columnHelper.accessor('office', {
        header: text.list.table.office,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.office ?? '—'}
          </Text>
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
                  onClick={() => navigate(`/cadastros-base/funcionarios/${row.original.uuid}`)}
                >
                  {text.list.actions.edit}
                </Actions.Item>
              )}
              {/* Ação condicional pelo status (is_enabled), guardada por
                  `employees_edit`: ATIVO mostra "Desativar"; INATIVO mostra
                  "Ativar". "Excluir" (`employees_delete`) vale para ambos. */}
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

  const isLoading = checkLoadingStatus([employeeList]);
  const items = employeeList.data?.data?.items;
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
            isError={employeeList.isError}
            error={employeeList.error}
            isEmpty={isEmpty}
            onRetry={() => employeeList.refetch()}
            isRetrying={employeeList.isFetching}
            emptyIcon={FiUsers}
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
            onCreate={() => navigate('/cadastros-base/funcionarios/novo')}
          />
        </Box>
      </TableProvider>

      <FilterSideFuncionarios
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

      {/* Diálogo de reativação — mirror do de desativação acima, reaproveita
          `DeleteConfirmDialog` com tom `info`/verde ao invés de laranja
          (mesma convenção de `Usuarios/index.tsx::confirmDialogConfig` para
          `willActivate`). `warningText` EXPLÍCITO e OBRIGATÓRIO aqui: sem
          ele, o componente cai no fallback global
          `languageGB.admin.common.deleteDialog.warning` ("Esta ação é
          permanente e não pode ser desfeita...") — FALSO para ativação
          (reversível). Achado do Tester (2026-09-18), corrigido. */}
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
    </ContainerGrid>
  );
}
