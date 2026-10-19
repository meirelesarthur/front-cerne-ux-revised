// src/pages/BaseRegistrations/Cultivation/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM EM ÁRVORE de CULTURA/VARIEDADE — Cadastros Base.
// Rota: /cadastros-base/cultura (guardada por `cultivations_view`).
//
// Consome GET /api/v1/cultivations/tree (não-paginado, árvore completa do
// tenant — Seção 3 do Cultivation-contrato.md) via `useCultivationTree`
// (useQuery direto, ver useCultivation.tsx — desvio documentado em
// TASK-CV-04a: a família `useCustomGridQuery*` do projeto pressupõe
// paginação server-side, que este endpoint não tem).
//
// Estrutura: casca padrão (ContainerGrid+HeaderGrid, igual Perfil/_examples)
// + linha de árvore DEDICADA (CultivationTreeRow — ver "Decisão do
// Desenvolvedor" na Tarefa: Alternativa A, não reaproveita a expansão por
// seleção do Table/TableProvider genérico).
//
// Busca por nome é CLIENT-SIDE (filtra o array já carregado, mantém
// expandidos só os ramos com match).
//
// Exclusão (095): `useRequest` (typesRequest 'update', toast `deletedToast`). A API
// devolve 422 genérico (`errors:null`) quando há vínculos e o toast do
// `useRequest` exibe a `message` da API; não há mais diálogo de vínculos.
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";

import { Box, Button as ChakraButton, Table, Text, VStack, useDisclosure } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import type { CultivationTreeNode } from "@/@types/v2/Cultivation/cultivation";
import { ContainerGrid } from "@/components/ContainerGrid";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { HeaderGrid } from "@/components/HeaderGrid";
import { QueryErrorState } from "@/components/QueryErrorState";
import { TableSkeleton } from "@/components/TableSkeleton";
import { queryKey } from "@/constants/query-key";
import { useLanguage } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermissions";
import { useRequest } from "@/hooks/useRequest";
import { deleteCultivation } from "@/services/v2/Cultivation/cultivation-service";

import { CultivationTreeRow } from "./CultivationTreeRow";
import { FilterSideCultivation } from "./FilterSideCultivation";
import { HeaderTable } from "./HeaderTable";
import { useCultivationTree } from "./useCultivation";

/** Filtra a árvore por nome (client-side) — mantém a Cultura se ela própria
 *  ou qualquer Variedade filha bater com o termo; nesse caso só as
 *  Variedades que batem permanecem visíveis (ramo "focado" na busca). */
function filterTreeBySearch(
  nodes: CultivationTreeNode[],
  term: string
): CultivationTreeNode[] {
  const trimmed = term.trim().toLowerCase();
  if (!trimmed) return nodes;

  const result: CultivationTreeNode[] = [];
  for (const node of nodes) {
    const selfMatch = node.name.toLowerCase().includes(trimmed);
    const matchingChildren = (node.children ?? []).filter((child) =>
      child.name.toLowerCase().includes(trimmed)
    );

    if (selfMatch || matchingChildren.length > 0) {
      result.push({
        ...node,
        children: selfMatch ? node.children : matchingChildren,
      });
    }
  }
  return result;
}

export default function CultivationList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can("cultivations_create");
  const canEdit = can("cultivations_edit");
  const canDelete = can("cultivations_delete");

  const cultivationTree = useCultivationTree();
  const roots = cultivationTree.data ?? [];

  // ---- Estado de filtro (drawer) ------------------------------------------
  const [search, setSearch] = useState<string>("");
  const {
    open: isFilterOpen,
    onOpen: onOpenFilter,
    onClose: onCloseFilter,
  } = useDisclosure();

  const filtersApplied = search ? 1 : 0;

  const filteredRoots = useMemo(
    () => filterTreeBySearch(roots, search),
    [roots, search]
  );

  // ---- Estado de expansão (árvore dedicada) -------------------------------
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isSearching = !!search.trim();

  function toggleExpand(node: CultivationTreeNode) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(node.uuid)) {
        next.delete(node.uuid);
      } else {
        next.add(node.uuid);
      }
      return next;
    });
  }

  function isNodeExpanded(node: CultivationTreeNode) {
    // Durante a busca, todo ramo com match fica expandido automaticamente.
    if (isSearching) return true;
    return expandedIds.has(node.uuid);
  }

  // ---- Estado de exclusão --------------------------------------------------
  const [toDelete, setToDelete] = useState<CultivationTreeNode | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async (cultivationUuid: string) => {
      await deleteCultivation(cultivationUuid);
      return undefined;
    },
    queryKey: queryKey.cultivation.tree,
    queryKey2: queryKey.cultivation.active,
    typesRequest: 'update',
    entityName: languageGB.cultivation.pageTitle,
    personalizedMessage: languageGB.cultivation.deletedToast,
    actionSuccess: () => {
      onCloseDeleteDialog();
      setToDelete(null);
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleEdit(node: CultivationTreeNode) {
    navigate(`/cadastros-base/cultura/${node.uuid}`);
  }

  function handleNewVariety(parent: CultivationTreeNode) {
    navigate(`/cadastros-base/cultura/novo?parentUuid=${parent.uuid}`);
  }

  function handleDeleteClick(node: CultivationTreeNode) {
    setToDelete(node);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      // 422 (vínculos): o toast do `useRequest` exibe a `message` da API; aqui
      // só fecha o diálogo e mantém o item na lista.
      deleteMutation.mutate(toDelete.uuid, {
        onError: () => {
          onCloseDeleteDialog();
          setToDelete(null);
        },
      });
    }
  }

  const isLoading = cultivationTree.isLoading || cultivationTree.isPending;
  const isError = cultivationTree.isError;

  return (
    <ContainerGrid>
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
            {languageGB.cultivation.pageTitle}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {languageGB.cultivation.pageSubtitle}
          </Text>
        </VStack>
      </HeaderGrid>

      <Box mt={6}>
        {isLoading ? (
          <TableSkeleton rows={8} columns={4} hasPagination={false} />
        ) : isError ? (
          <QueryErrorState
            error={cultivationTree.error}
            message={languageGB.cultivation.error.message}
            retryLabel={languageGB.cultivation.error.retry}
            onRetry={() => cultivationTree.refetch()}
            isRetrying={cultivationTree.isFetching}
          />
        ) : roots.length === 0 ? (
          <VStack
            gap={3}
            py={12}
            borderTop="1px solid"
            borderColor="borderGrid"
          >
            <Text color="fg.muted">{languageGB.cultivation.empty.message}</Text>
            {canCreate && (
              <ChakraButton
                colorPalette="green"
                onClick={() => navigate("/cadastros-base/cultura/novo")}
              >
                {languageGB.cultivation.empty.cta}
              </ChakraButton>
            )}
          </VStack>
        ) : filteredRoots.length === 0 ? (
          <VStack
            gap={2}
            py={12}
            borderTop="1px solid"
            borderColor="borderGrid"
          >
            <Text color="fg.muted">{languageGB.defaltStrings.emptyData}</Text>
          </VStack>
        ) : (
          <Table.ScrollArea
            borderTop="1px"
            marginTop="6"
            borderTopRadius="md"
            borderColor="borderGrid"
          >
            <Table.Root
              variant="line"
              size="md"
              css={{
                border: "none",
                "& th": {
                  bg: "gridHeadSecondary",
                  color: "textGridColor",
                  height: "10",
                  fontWeight: "500",
                  fontSize: "14px",
                  paddingY: "2",
                  paddingLeft: "4",
                  paddingRight: "4",
                },
              }}
            >
              <Table.Header>
                <Table.Row borderBottom="1px solid" borderColor="borderGrid">
                  <Table.ColumnHeader>
                    {languageGB.cultivation.table.name}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader width="140px">
                    {languageGB.cultivation.table.status}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader width="140px">
                    {languageGB.cultivation.table.varietiesCount}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader width="112px" />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredRoots.map((root) => (
                  <>
                    <CultivationTreeRow
                      key={root.uuid}
                      node={root}
                      isExpanded={isNodeExpanded(root)}
                      onToggleExpand={toggleExpand}
                      onEdit={handleEdit}
                      onNewVariety={handleNewVariety}
                      onDelete={handleDeleteClick}
                      canEdit={canEdit}
                      canCreate={canCreate}
                      canDelete={canDelete}
                    />
                    {isNodeExpanded(root) &&
                      (root.children ?? []).map((variety) => (
                        <CultivationTreeRow
                          key={variety.uuid}
                          node={variety}
                          isExpanded={false}
                          onToggleExpand={toggleExpand}
                          onEdit={handleEdit}
                          onNewVariety={handleNewVariety}
                          onDelete={handleDeleteClick}
                          canEdit={canEdit}
                          canCreate={canCreate}
                          canDelete={canDelete}
                        />
                      ))}
                  </>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        )}
      </Box>

      <FilterSideCultivation
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={(data) => setSearch(data.search ?? "")}
        handleReset={() => setSearch("")}
        filter={{ search }}
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
