// src/pages/Administrativo/FuncionarioXEventos/index.tsx
// -----------------------------------------------------------------------------
// Tela 1 — LISTAGEM-PICKER de Funcionários (Funcionário x Eventos) —
// Administrativo → Gestão Pessoal (TASK-FE-FXE-01). Rota
// `/administrativo/func-eventos` (path já cravado no menu, item `adm-gp-fxe`/
// permissão de menu `employeeevents_view` JÁ EXISTEM — `navigationTree.ts`/
// `navigationPermissions.ts`/`permissionsCatalog.json`, zero edição nesta
// Tarefa).
//
// DA-EE-FE-01 (INVIOLÁVEL): esta tela é um PICKER de Funcionários, NÃO uma
// grid de vínculos — reaproveita `listEmployees`/`EmployeeListItem`/
// `EmployeeFilterForm` (já existentes, `employee-service.ts`, camada
// Funcionários já ✅ entregue), ZERO tipo novo para a listagem. Mirror
// estrutural DIRETO de `CadastrosBase/Funcionarios/index.tsx`
// (`useCustomGridQuery` inline, sem `useGridSettings` — catálogo não precisa
// de personalização de colunas ainda), MAS:
//   - SEM colunas de ações de excluir/editar Funcionário (essa listagem já
//     existe em `/cadastros-base/funcionarios`, ✅ entregue).
//   - 1 ÚNICA ação nova: "Gerenciar vínculos" → navega para a Matriz de
//     Vínculos daquele funcionário (`/administrativo/func-eventos/{uuid}`,
//     Tarefa 07/TASK-FE-FXE-02).
//   - Filtro PADRÃO `isEnabled: true` (mirror `defaultFilter` de
//     `Funcionarios/index.tsx`).
//   - SEM CTA de criação no EmptyState — não há cadastro de Funcionário
//     nesta tela.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import type { ElementType } from 'react';

import { Box, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCalendar, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { docTypeOfDigits, normalizeDocument } from '@/utils/cpfCnpj';
import { formatDocument } from '@/utils/formatDocument';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import type { ListEmployeesParams } from '@/services/v2/CadastrosBase/Employee/employee-service';

import type { EmployeeFilterForm, EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';

import { FilterSideFuncionarioXEventos } from './FilterSideFuncionarioXEventos';
import { HeaderTable } from './HeaderTable';

// Máscara de EXIBIÇÃO de CPF/CNPJ (reuso dos utils globais já existentes) —
// mesmo helper local duplicado de `Funcionarios/index.tsx` (convenção já
// estabelecida no projeto de NÃO extrair para util compartilhado).
function maskNif(nif: string): string {
  const digits = normalizeDocument(nif);
  const type = docTypeOfDigits(nif);
  if (type === 'unknown') return nif;
  return formatDocument(digits, type) ?? nif;
}

// Filtro PADRÃO da listagem — só Funcionários ATIVOS (mirror
// `Funcionarios/index.tsx`).
const defaultFilter: EmployeeFilterForm = {
  isEnabled: { value: true, label: '' },
};

export default function FuncionarioXEventosList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.employeeEvents.employeeEvent;

  const canManageLinks = can('employeeevents_view');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: 'AdministrativoFuncionarioXEventos' + queryKey.employeeEvents.employeeEventsList,
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

  // Reaproveita `listEmployees` DIRETO — mesmo padrão de
  // `Funcionarios/useFuncionarios.tsx::useEmployeesList`, inline aqui (a
  // Tarefa não exige hook próprio, ZERO tipo/serviço novo para a listagem).
  const employeeList = useCustomGridQuery<EmployeeListItem, ListEmployeesParams>({
    asyncFunction: listEmployees,
    queryKey: queryKey.cadastrosBase.employees,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: {
      search: paginatedQuery.filter?.search || undefined,
      start_date: paginatedQuery.filter?.startDate || undefined,
      end_date: paginatedQuery.filter?.endDate || undefined,
      // Armadilha #11/checklist item 19: `false` (Inativo) é valor válido —
      // NUNCA `filter?.isEnabled?.value || undefined`.
      is_enabled: paginatedQuery.filter?.isEnabled
        ? paginatedQuery.filter.isEnabled.value
        : undefined,
    },
  });

  const columnHelper = createColumnHelper<EmployeeListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.list.table.name,
        enableHiding: false,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
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
      columnHelper.accessor('office', {
        header: text.list.table.office,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.office ?? '—'}
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
              {canManageLinks && (
                <Actions.Item
                  icon={<Icon as={FiCalendar} />}
                  onClick={() => navigate(`/administrativo/func-eventos/${row.original.uuid}`)}
                >
                  {text.list.table.actions.manageLinks}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, text, canManageLinks]
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
            emptyIcon={FiUsers as ElementType}
            emptyTitle={
              filtersApplied > 0 ? text.list.emptyState.titleFiltered : text.list.emptyState.titleEmpty
            }
            emptyDescription={
              filtersApplied > 0
                ? text.list.emptyState.descriptionFiltered
                : text.list.emptyState.descriptionEmpty
            }
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSideFuncionarioXEventos
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />
    </ContainerGrid>
  );
}
