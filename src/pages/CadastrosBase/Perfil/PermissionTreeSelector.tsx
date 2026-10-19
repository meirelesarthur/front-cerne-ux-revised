// src/pages/CadastrosBase/Perfil/PermissionTreeSelector.tsx
// -----------------------------------------------------------------------------
// Árvore de permissões em ACCORDION (GET /permissions/tree) para o formulário
// de Perfil.
//
//  - Grupos = nós com `title` (recursivo); folhas = checkboxes com
//    `description` (ex.: "Visualizar").
//  - Checkbox de GRUPO marca/desmarca todos os descendentes selecionáveis;
//    estado tri-state ("indeterminate") quando a seleção é parcial.
//  - Folhas com `uuid: null` (drift — permissão sem seed neste ambiente) são
//    renderizadas DISABLED com tooltip e nunca entram na seleção.
//  - A árvore é grande (~980 folhas): colapso por GRUPO RAIZ (todos fechados
//    por padrão, lazyMount) + busca por texto (título/descrição/nome técnico,
//    sem acento) que filtra os nós e auto-expande os grupos com match.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";

import {
  Accordion,
  Badge,
  Box,
  Flex,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import type { LanguageDate } from "@/@types/language";
import type {
  PermissionTreeGroup,
  PermissionTreeLeaf,
  PermissionTreeNode,
} from "@/@types/v2/Roles";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";

// ============================================
// HELPERS (puros)
// ============================================

function isLeaf(node: PermissionTreeNode): node is PermissionTreeLeaf {
  return "name" in node;
}

/** Normaliza para busca: minúsculas e sem acentos. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Coleta os uuids SELECIONÁVEIS de um nó, recursivamente: uuid != null (drift)
 * E permissão que o usuário logado POSSUI (`canAssign`) — o backend rejeita
 * atribuição de permissão que o autor não tem (anti-escalação de privilégio,
 * RN do contrato de Role), então a UI nem oferece.
 */
function collectSelectableUuids(
  node: PermissionTreeNode,
  canAssign: (name: string) => boolean,
): string[] {
  if (isLeaf(node)) {
    return node.uuid && canAssign(node.name) ? [node.uuid] : [];
  }
  return node.items.flatMap((child) => collectSelectableUuids(child, canAssign));
}

/**
 * Poda a árvore às permissões que o USUÁRIO LOGADO possui (RN de Role: não se
 * concede o que não se tem). Mantém a folha só se `canAssign(name)` for true e
 * remove os grupos que ficam sem nenhuma folha — reproduz o comportamento do
 * legado (Admin/RoleController@create/edit → checkPermissionsTenant), que
 * removia do catálogo as permissões fora do conjunto do usuário. Um usuário com
 * TODAS as permissões (Gestor_Plataf/admin) continua vendo tudo, pois toda folha
 * passa no `canAssign`. Folhas de drift (uuid null) não pertencem a ninguém e
 * saem naturalmente. Sem prop `canAssign` (default `() => true`), nada é podado.
 */
function pruneToAssignable(
  nodes: PermissionTreeNode[],
  canAssign: (name: string) => boolean,
): PermissionTreeNode[] {
  return nodes.flatMap((node): PermissionTreeNode[] => {
    if (isLeaf(node)) {
      return canAssign(node.name) ? [node] : [];
    }
    const items = pruneToAssignable(node.items, canAssign);
    return items.length > 0 ? [{ ...node, items }] : [];
  });
}

/**
 * Filtra a árvore pela busca: mantém a folha se ela (ou um grupo ancestral)
 * bate com o termo; mantém o grupo se o título bate (com todos os filhos) ou
 * se algum descendente bate (só com os filhos que batem).
 */
function filterNodes(
  nodes: PermissionTreeNode[],
  term: string,
): PermissionTreeNode[] {
  if (!term) return nodes;

  return nodes.flatMap((node): PermissionTreeNode[] => {
    if (isLeaf(node)) {
      const match =
        normalize(node.description).includes(term) ||
        normalize(node.name).includes(term);
      return match ? [node] : [];
    }

    if (normalize(node.title).includes(term)) {
      return [node]; // título bate → mantém o grupo inteiro
    }

    const filteredItems = filterNodes(node.items, term);
    return filteredItems.length > 0
      ? [{ ...node, items: filteredItems }]
      : [];
  });
}

type GroupCheckState = boolean | "indeterminate";

function groupCheckState(
  selectableUuids: string[],
  selected: Set<string>,
): { state: GroupCheckState; selectedCount: number } {
  const selectedCount = selectableUuids.filter((uuid) =>
    selected.has(uuid),
  ).length;

  if (selectableUuids.length === 0 || selectedCount === 0) {
    return { state: false, selectedCount };
  }
  if (selectedCount === selectableUuids.length) {
    return { state: true, selectedCount };
  }
  return { state: "indeterminate", selectedCount };
}

// ============================================
// SUB-COMPONENTES
// ============================================

interface CommonNodeProps {
  selected: Set<string>;
  onToggleLeaf: (uuid: string) => void;
  onToggleGroup: (node: PermissionTreeGroup) => void;
  readOnly: boolean;
  /** O usuário logado possui esta permissão? (anti-escalação — RN de Role) */
  canAssign: (name: string) => boolean;
  languageGB: LanguageDate;
}

function LeafRow({
  leaf,
  selected,
  onToggleLeaf,
  readOnly,
  canAssign,
  languageGB,
}: { leaf: PermissionTreeLeaf } & Omit<CommonNodeProps, "onToggleGroup">) {
  const isDrift = leaf.uuid === null;
  // Sem autoridade: o usuário não possui a permissão — não pode atribuí-la
  // (nem removê-la, no edit de um perfil privilegiado). Fica visível e
  // desabilitada, com o estado real (marcada se o perfil já a tem).
  const noAuthority = !isDrift && !canAssign(leaf.name);
  const blocked = isDrift || noAuthority;

  const checkbox = (
    <Checkbox
      size="sm"
      colorPalette="green"
      checked={!isDrift && selected.has(leaf.uuid as string)}
      disabled={blocked || readOnly}
      onCheckedChange={() => {
        if (!blocked) onToggleLeaf(leaf.uuid as string);
      }}
    >
      <Flex align="center" gap={2} minW={0}>
        {/* Só o rótulo amigável da ação (ex.: "Visualizar"). O slug técnico
            (`leaf.name`) permanece no estado/submit, mas NÃO é exibido. */}
        <Text fontSize="sm" opacity={blocked ? 0.5 : 1}>
          {leaf.description}
        </Text>
      </Flex>
    </Checkbox>
  );

  if (!blocked) return checkbox;

  return (
    <Tooltip
      content={
        isDrift
          ? languageGB.roles.role.form.permissionsTree.driftTooltip
          : languageGB.roles.role.form.permissionsTree.noAuthorityTooltip
      }
      showArrow
    >
      <Box display="inline-block">{checkbox}</Box>
    </Tooltip>
  );
}

function GroupBlock({
  group,
  depth,
  ...common
}: { group: PermissionTreeGroup; depth: number } & CommonNodeProps) {
  const selectableUuids = collectSelectableUuids(group, common.canAssign);
  const { state } = groupCheckState(selectableUuids, common.selected);

  return (
    <Box>
      <Checkbox
        size="sm"
        colorPalette="green"
        checked={state}
        disabled={common.readOnly || selectableUuids.length === 0}
        onCheckedChange={() => common.onToggleGroup(group)}
      >
        <Text fontSize="sm" fontWeight="semibold">
          {group.title}
        </Text>
      </Checkbox>

      <VStack align="stretch" gap={1.5} pl={6} pt={1.5}>
        {group.items.map((child, index) =>
          isLeaf(child) ? (
            <LeafRow
              key={`${depth}-${index}-${child.name}`}
              leaf={child}
              selected={common.selected}
              onToggleLeaf={common.onToggleLeaf}
              readOnly={common.readOnly}
              canAssign={common.canAssign}
              languageGB={common.languageGB}
            />
          ) : (
            <GroupBlock
              key={`${depth}-${index}-${child.title}`}
              group={child}
              depth={depth + 1}
              {...common}
            />
          ),
        )}
      </VStack>
    </Box>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface PermissionTreeSelectorProps {
  tree: PermissionTreeGroup[] | undefined;
  isLoading: boolean;
  /** Uuids selecionados (conjunto completo — o submit envia Array.from). */
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Sem permissão de salvar → árvore somente leitura. */
  readOnly?: boolean;
  /** O usuário logado possui a permissão? (anti-escalação — default: sim) */
  canAssign?: (name: string) => boolean;
  languageGB: LanguageDate;
}

export function PermissionTreeSelector({
  tree,
  isLoading,
  selected,
  onChange,
  readOnly = false,
  canAssign = () => true,
  languageGB,
}: PermissionTreeSelectorProps) {
  const strings = languageGB.roles.role.form.permissionsTree;

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);

  const term = normalize(search.trim());

  // Árvore podada às permissões do usuário logado (Bug B) — grupos/folhas sem
  // nenhuma permissão do usuário NÃO aparecem (nada de nós desabilitados/0-de-0).
  const assignableTree = useMemo(
    () => pruneToAssignable(tree ?? [], canAssign) as PermissionTreeGroup[],
    [tree, canAssign],
  );

  const filteredTree = useMemo(
    () => filterNodes(assignableTree, term) as PermissionTreeGroup[],
    [assignableTree, term],
  );

  // Chave estável por grupo raiz (títulos podem repetir → usa o índice do
  // grupo na árvore PODADA, para a expansão sobreviver ao filtro de busca).
  const rootKeys = useMemo(() => {
    const originalIndex = new Map<PermissionTreeGroup, number>();
    assignableTree.forEach((root, index) => originalIndex.set(root, index));
    return filteredTree.map((root, index) => {
      // Grupo re-criado pelo filtro não está no Map — cai no índice filtrado.
      const idx = originalIndex.get(root) ?? `f${index}`;
      return `root-${idx}-${root.title}`;
    });
  }, [assignableTree, filteredTree]);

  // Busca ativa → expande todos os grupos com match; busca limpa → colapsa.
  useEffect(() => {
    setExpanded(term ? rootKeys : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function toggleLeaf(uuid: string) {
    const next = new Set(selected);
    if (next.has(uuid)) {
      next.delete(uuid);
    } else {
      next.add(uuid);
    }
    onChange(next);
  }

  function toggleGroup(group: PermissionTreeGroup) {
    const uuids = collectSelectableUuids(group, canAssign);
    if (uuids.length === 0) return;

    const allSelected = uuids.every((uuid) => selected.has(uuid));
    const next = new Set(selected);
    if (allSelected) {
      uuids.forEach((uuid) => next.delete(uuid));
    } else {
      uuids.forEach((uuid) => next.add(uuid));
    }
    onChange(next);
  }

  const common: CommonNodeProps = {
    selected,
    onToggleLeaf: toggleLeaf,
    onToggleGroup: toggleGroup,
    readOnly,
    canAssign,
    languageGB,
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner />
      </Flex>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      <Flex gap={4} align="center" wrap="wrap">
        <Input
          size="sm"
          maxW="420px"
          placeholder={strings.searchPlaceholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Badge colorPalette="green" variant="subtle" py={1} px={3}>
          {selected.size} {strings.selectedSuffix}
        </Badge>
      </Flex>

      {readOnly && (
        <Text fontSize="sm" color="fg.muted">
          {strings.readOnlyHint}
        </Text>
      )}

      {filteredTree.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" py={4}>
          {strings.noResults}
        </Text>
      ) : (
        <Accordion.Root
          multiple
          value={expanded}
          onValueChange={(event: { value: string[] }) =>
            setExpanded(event.value)
          }
          lazyMount
          unmountOnExit
          variant="enclosed"
        >
          {filteredTree.map((root, index) => {
            const rootKey = rootKeys[index];
            const selectableUuids = collectSelectableUuids(root, canAssign);
            const { state, selectedCount } = groupCheckState(
              selectableUuids,
              selected,
            );

            return (
              <Accordion.Item key={rootKey} value={rootKey}>
                <Flex align="center" gap={3} px={4}>
                  <Checkbox
                    size="sm"
                    colorPalette="green"
                    checked={state}
                    disabled={readOnly || selectableUuids.length === 0}
                    onCheckedChange={() => toggleGroup(root)}
                  />
                  <Accordion.ItemTrigger
                    flex="1"
                    cursor="pointer"
                    py={3}
                    px={0}
                  >
                    <Flex flex="1" align="center" gap={3} minW={0}>
                      <Text fontWeight="semibold" lineClamp="1">
                        {root.title}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {selectedCount}/{selectableUuids.length}
                      </Text>
                    </Flex>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                </Flex>

                <Accordion.ItemContent>
                  <Accordion.ItemBody pl={12} pr={4}>
                    <VStack align="stretch" gap={3}>
                      {root.items.map((child, childIndex) =>
                        isLeaf(child) ? (
                          <LeafRow
                            key={`${rootKey}-${childIndex}-${child.name}`}
                            leaf={child}
                            selected={selected}
                            onToggleLeaf={toggleLeaf}
                            readOnly={readOnly}
                            canAssign={canAssign}
                            languageGB={languageGB}
                          />
                        ) : (
                          <GroupBlock
                            key={`${rootKey}-${childIndex}-${child.title}`}
                            group={child}
                            depth={1}
                            {...common}
                          />
                        ),
                      )}
                    </VStack>
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      )}
    </VStack>
  );
}
