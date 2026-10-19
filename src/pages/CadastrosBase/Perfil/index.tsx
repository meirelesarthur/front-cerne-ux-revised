// src/pages/CadastrosBase/Perfil/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de PERFIS (Roles RBAC) — Cadastros Base.
// Rota: /cadastros-base/perfil (guardada por `roles_tenant_view`).
//
// Estrutura idêntica à camada de exemplo (src/_examples/pages/cadastros/
// recursos/index.tsx):
//   - grid paginado (TableProvider + Table) via useRolesList;
//   - HeaderTable   → botões de ação (Add respeita roles_tenant_create);
//   - FilterSidePerfil → drawer de busca por nome (param `search`);
//   - delete via useRequest + DeleteConfirmDialog (respeita
//     roles_tenant_delete; erro de negócio do backend vira toast com a
//     message do envelope).
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";

import {
  Box,
  Flex,
  Icon,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { FiEdit, FiShield, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import type { RoleFilterForm, RoleListItem } from "@/@types/v2/Roles";
import { Actions } from "@/components/Action";
import { ContainerGrid } from "@/components/ContainerGrid";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { HeaderGrid } from "@/components/HeaderGrid";
import { Table } from "@/components/Table";
import { queryKey } from "@/constants/query-key";
import { TableProvider } from "@/contexts/TableContext";
import { useLanguage } from "@/hooks/useLanguage";
import { userPaginatedQuery } from "@/hooks/usePaginatedQueryStorage";
import { usePermissions } from "@/hooks/usePermissions";
import { useRequest } from "@/hooks/useRequest";
import { deleteRole } from "@/services/v2/Roles/role-service";
import { checkLoadingStatus } from "@/utils/checkLoadingStatus";
import { styleColumTable } from "@/utils/style-colum-table";

import { FilterSidePerfil } from "./FilterSidePerfil";
import { HeaderTable } from "./HeaderTable";
import { useRolesList } from "./useRoles";

export default function PerfilList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canEdit = can("roles_tenant_edit");
  const canDelete = can("roles_tenant_delete");

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: "CadastrosBasePerfil" + queryKey.roles.list,
    }),
    [],
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<RoleFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const {
    open: isFilterOpen,
    onOpen: onOpenFilter,
    onClose: onCloseFilter,
  } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== "" && v !== false,
      ).length,
    [paginatedQuery.filter],
  );

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<RoleListItem | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const rolesList = useRolesList({
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filter: paginatedQuery.filter ?? undefined,
  });

  const deleteMutation = useRequest({
    asyncFunction: async ({ roleUuid }: { roleUuid: string }) => {
      return await deleteRole(roleUuid);
    },
    queryKey: queryKey.roles.list,
    queryKey2: queryKey.roles.detail,
    typesRequest: "update",
    entityName: languageGB.roles.role.singularLabel,
    personalizedMessage: languageGB.roles.role.list.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const handleDeleteClick = (role: RoleListItem) => {
    setToDelete(role);
    onOpenDeleteDialog();
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      deleteMutation.mutate({ roleUuid: toDelete.uuid });
    }
  };

  const isDeleting = deleteMutation.isPending;

  const columnHelper = createColumnHelper<RoleListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: languageGB.roles.role.list.table.name,
        cell: ({ row }) => (
          <Flex align="center" gap={2}>
            <Icon as={FiShield} color="blue.400" boxSize={4} />
            <Text fontWeight="medium" lineClamp="1">
              {row.original.name}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor("description", {
        header: languageGB.roles.role.list.table.description,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {row.original.description || "—"}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "acoes",
        header: "",
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm">
              <Actions.Item
                icon={<Icon as={FiEdit} />}
                onClick={() =>
                  navigate(`/cadastros-base/perfil/${row.original.uuid}`)
                }
              >
                {languageGB.roles.role.list.actions.edit}
              </Actions.Item>
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(row.original)}
                  color="red.400"
                  disabled={isDeleting}
                >
                  {languageGB.roles.role.list.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: styleColumTable.sm,
      }),
    ],
    [navigate, isDeleting, languageGB, canDelete, canEdit],
  );

  const isLoading = checkLoadingStatus([rolesList]);
  const items = rolesList.data?.data?.items;
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
              {languageGB.roles.role.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {languageGB.roles.role.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          <Table
            isLoading={isLoading}
            isError={rolesList.isError}
            error={rolesList.error}
            isEmpty={isEmpty}
            onRetry={() => rolesList.refetch()}
            isRetrying={rolesList.isFetching}
            emptyIcon={FiShield}
            emptyTitle={languageGB.roles.role.list.pageTitle}
            emptyDescription={languageGB.roles.role.list.pageSubtitle}
            canCreate={false}
          />
        </Box>
      </TableProvider>

      <FilterSidePerfil
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
        itemName={toDelete?.name}
      />
    </ContainerGrid>
  );
}
