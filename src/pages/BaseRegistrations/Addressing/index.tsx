// src/pages/BaseRegistrations/Addressing/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM EM ÁRVORE de ENDEREÇAMENTOS — Cadastros Base.
// Rota: /cadastros-base/enderecos (guardada por `addressings_view`).
//
// Consome GET /api/v1/addressings/tree (não-paginado, árvore completa dos 4
// níveis fixos do tenant — Setor→Corredor→Prateleira→Nível, Seção 3 do
// Addressing-contrato.md) via `useAddressingTree` (useQuery direto, ver
// useAddressing.tsx — desvio documentado em TASK-AD-03a, mesmo padrão de
// TASK-CV-04a: a família `useCustomGridQuery*` do projeto pressupõe
// paginação server-side, que este endpoint não tem).
//
// Estrutura: casca padrão (ContainerGrid+HeaderGrid, igual Cultivation/
// Perfil) + linha de árvore GENUINAMENTE RECURSIVA (AddressingTreeRow — se
// chama a si mesma para `node.children`, ao contrário do precedente
// `Cultivation`, fixo em 2 níveis).
//
// Busca por descrição é CLIENT-SIDE (filtra o array já carregado,
// recursivamente em qualquer profundidade — generaliza `filterTreeBySearch`
// de Cultivation de 2 níveis para N níveis), mantendo expandido todo ramo com
// match em qualquer nível.
//
// Exclusão (mesmo desenho de `Cultivation/index.tsx`): NÃO usa `useRequest`
// para a mutação de exclusão. O `onError` genérico do `useRequest`
// (src/hooks/useRequest.tsx) só lê `resData?.message`/`resData?.error` —
// nunca `resData?.errors`, o que esconderia a lista `errors.in_use[]`
// (Addressing-contrato.md DA-AD-05/07). Por isso a exclusão usa um
// `useMutation` DEDICADO: no sucesso replica o toast do `useRequest`; no
// erro, se `extractInUseItems` reconhecer o 422 estruturado com
// `errors.in_use[]`, abre o `InUseBlockedDialog` genérico (canário
// FRONT-03-InUseBlockedDialog.md, TASK-AD-03b) listando cada vínculo por
// `table` — só cai no toast genérico de erro para qualquer OUTRO erro (403,
// 500, 422 residual de corrida sem `in_use` populado). O antigo
// `AddressingInUseDialog.tsx` (molde original) permanece no diretório, sem
// uso, até o Tester confirmar paridade e autorizar sua remoção (DoD).
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";

import { Box, Button as ChakraButton, Table, Text, VStack, useDisclosure } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import type { AddressingTreeNode } from "@/@types/v2/Addressing/addressing";
import { toaster } from "@/components/ui/toaster";
import { ContainerGrid } from "@/components/ContainerGrid";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { HeaderGrid } from "@/components/HeaderGrid";
import { InUseBlockedDialog, type InUseBlockedItem } from "@/components/InUseBlockedDialog";
import { QueryErrorState } from "@/components/QueryErrorState";
import { TableSkeleton } from "@/components/TableSkeleton";
import { addressingInUseTableLabels } from "@/constants/Addressing/options/addressing-in-use-table-labels";
import { queryKey } from "@/constants/query-key";
import { useLanguage } from "@/hooks/useLanguage";
import { usePermissions } from "@/hooks/usePermissions";
import { deleteAddressing } from "@/services/v2/Addressing/addressing-service";

import { AddressingTreeRow } from "./AddressingTreeRow";
import { FilterSideAddressing } from "./FilterSideAddressing";
import { HeaderTable } from "./HeaderTable";
import { useAddressingTree } from "./useAddressing";
import { extractInUseItems } from '@/utils/extractApiErrorMessage';

import { PageHeader } from '@/components/ui/PageHeader';

/** Filtra a árvore por descrição (client-side), RECURSIVAMENTE em qualquer
 *  profundidade (generaliza `filterTreeBySearch` de `Cultivation`, que só
 *  cobre 2 níveis fixos, para os 4 níveis de `Addressing`). Mantém um nó se
 *  ele próprio OU qualquer descendente (em qualquer nível) bater com o
 *  termo — nesse caso só os descendentes que batem (ou que têm descendentes
 *  que batem) permanecem visíveis (ramo "focado" na busca). */
function filterTreeBySearch(
  nodes: AddressingTreeNode[],
  term: string
): AddressingTreeNode[] {
  const trimmed = term.trim().toLowerCase();
  if (!trimmed) return nodes;

  const result: AddressingTreeNode[] = [];
  for (const node of nodes) {
    const selfMatch = node.description.toLowerCase().includes(trimmed);
    const filteredChildren = filterTreeBySearch(node.children ?? [], trimmed);

    if (selfMatch || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: selfMatch ? node.children : filteredChildren,
      });
    }
  }
  return result;
}

export default function AddressingList() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can("addressings_create");
  const canEdit = can("addressings_edit");
  const canDelete = can("addressings_delete");

  const addressingTree = useAddressingTree();
  const roots = addressingTree.data ?? [];

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

  function toggleExpand(node: AddressingTreeNode) {
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

  // ---- Estado de exclusão --------------------------------------------------
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<AddressingTreeNode | null>(null);
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();

  // Estado do aviso de exclusão BLOQUEADA (422 `errors.in_use[]`) —
  // TASK-AD-03b, mesmo desenho de Cultivation/index.tsx. Canário
  // FRONT-03-InUseBlockedDialog.md: itens normalizados por `extractInUseItems`.
  const [blockedInUse, setBlockedInUse] = useState<InUseBlockedItem[] | null>(null);
  const {
    open: isOpenBlockedDialog,
    onOpen: onOpenBlockedDialog,
    onClose: onCloseBlockedDialog,
  } = useDisclosure();

  // ⚠️ NÃO usa `useRequest` aqui — ver nota de topo do arquivo (o `onError`
  // genérico dele não lê `resData?.errors`, escondendo `in_use[]`).
  const deleteMutation = useMutation({
    mutationFn: async (addressingUuid: string) =>
      await deleteAddressing(addressingUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.addressing.tree] });

      toaster.success({
        title: languageGB.baseRegistrations.addressing.pageTitle,
        description: languageGB.baseRegistrations.addressing.deletedToast,
        duration: 7000,
      });

      onCloseDeleteDialog();
      setToDelete(null);
    },
    onError: (error) => {
      console.error("Addressing delete - error:", error);

      const inUseItems = extractInUseItems(error);
      if (inUseItems) {
        // Mensagem DEDICADA (TASK-AD-03b) — fecha a confirmação genérica e
        // abre o diálogo com a lista de vínculos, SEM toast genérico.
        onCloseDeleteDialog();
        setBlockedInUse(inUseItems);
        onOpenBlockedDialog();
        return;
      }

      // Fallback: qualquer erro que NÃO seja o 422 estruturado de bloqueio
      // (403, 500, 422 residual de corrida sem `in_use` populado) — mesmo
      // formato de mensagem do `onError` genérico do `useRequest`.
      let errorMessage = languageGB.common.errorLog.unknownError;
      if (isAxiosError(error)) {
        const statusCode = error.response?.status ?? null;
        const resData = error.response?.data as any;
        if (resData?.message) {
          const msg =
            typeof resData.message === "string"
              ? resData.message
              : JSON.stringify(resData.message);
          errorMessage = `${statusCode} — ${msg}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toaster.error({
        title: languageGB.baseRegistrations.addressing.pageTitle,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isDeleting = deleteMutation.isPending;

  function handleEdit(node: AddressingTreeNode) {
    navigate(`/cadastros-base/enderecos/${node.uuid}`);
  }

  function handleAddChild(parent: AddressingTreeNode) {
    navigate(`/cadastros-base/enderecos/novo?parentUuid=${parent.uuid}`);
  }

  function handleDeleteClick(node: AddressingTreeNode) {
    setToDelete(node);
    onOpenDeleteDialog();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  function handleCloseBlockedDialog() {
    onCloseBlockedDialog();
    setBlockedInUse(null);
    setToDelete(null);
  }

  const isLoading = addressingTree.isLoading || addressingTree.isPending;
  const isError = addressingTree.isError;

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
        <PageHeader title={languageGB.baseRegistrations.addressing.pageTitle} description={languageGB.baseRegistrations.addressing.pageSubtitle} />
      </HeaderGrid>

      <Box mt={6}>
        {isLoading ? (
          <TableSkeleton rows={8} columns={4} hasPagination={false} />
        ) : isError ? (
          <QueryErrorState
            error={addressingTree.error}
            message={languageGB.baseRegistrations.addressing.error.message}
            retryLabel={languageGB.baseRegistrations.addressing.error.retry}
            onRetry={() => addressingTree.refetch()}
            isRetrying={addressingTree.isFetching}
          />
        ) : roots.length === 0 ? (
          <VStack
            gap={3}
            py={12}
            borderTop="1px solid"
            borderColor="borderGrid"
          >
            <Text color="fg.muted">{languageGB.baseRegistrations.addressing.empty.message}</Text>
            {canCreate && (
              <ChakraButton
                colorPalette="green"
                onClick={() => navigate("/cadastros-base/enderecos/novo")}
              >
                {languageGB.baseRegistrations.addressing.empty.cta}
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
                    {languageGB.baseRegistrations.addressing.table.description}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader width="140px">
                    {languageGB.baseRegistrations.addressing.table.level}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader width="140px">
                    {languageGB.baseRegistrations.addressing.table.childrenCount}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader width="112px" />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredRoots.map((root) => (
                  <AddressingTreeRow
                    key={root.uuid}
                    node={root}
                    depth={0}
                    expandedIds={expandedIds}
                    forceExpanded={isSearching}
                    onToggleExpand={toggleExpand}
                    onEdit={handleEdit}
                    onAddChild={handleAddChild}
                    onDelete={handleDeleteClick}
                    canEdit={canEdit}
                    canCreate={canCreate}
                    canDelete={canDelete}
                  />
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        )}
      </Box>

      <FilterSideAddressing
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        filter={{ search }}
        handleFilterChange={(data) => setSearch(data.search ?? "")}
        handleReset={() => setSearch("")}
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

      <InUseBlockedDialog
        isOpen={isOpenBlockedDialog}
        onClose={handleCloseBlockedDialog}
        title={languageGB.baseRegistrations.addressing.deleteBlocked.title}
        description={languageGB.baseRegistrations.addressing.deleteBlocked.description}
        itemName={toDelete?.description}
        items={blockedInUse}
        closeLabel={languageGB.defaltStrings.close}
        resourceLabelTemplate={languageGB.baseRegistrations.addressing.deleteBlocked.resourceLabel}
        getResourceLabel={(table) => addressingInUseTableLabels.getLabel(table, languageGB)}
      />
    </ContainerGrid>
  );
}
