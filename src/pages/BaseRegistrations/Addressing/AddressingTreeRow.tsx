// src/pages/BaseRegistrations/Addressing/AddressingTreeRow.tsx
// -----------------------------------------------------------------------------
// Linha de ÁRVORE GENUINAMENTE RECURSIVA para a listagem de Endereçamentos.
//
// Diferente do precedente `Cultivation` (`CultivationTreeRow.tsx`, fixo em 2
// níveis — "raiz"/"filha" tratados como 2 casos hardcoded, sem recursão de
// componente), `Addressing` tem 4 níveis fixos (Setor→Corredor→Prateleira→
// Nível) — esta linha se CHAMA A SI MESMA para `node.children`, controlando a
// indentação visual pelo `depth` (0-3) recebido via prop, não por um `type`
// hardcoded. Mesma composição de primitivas atômicas do catálogo real do
// projeto (`Badge`/`Icon`/`Table.*` do Chakra, `Actions` de @/components/
// Action) já usada por `CultivationTreeRow` — nunca importando componente do
// Storybook `cerne` direto.
//
// `node.children`/`node.children_count` ficam AUSENTES (não `0`/`[]`) nos
// nós do último nível eager-carregado por `/tree` (Nível, `type===4`) —
// `AddressingResource::toArray()` só inclui essas chaves quando a relação
// Eloquent `children` foi carregada (`relationLoaded`), e `/tree` eager-
// carrega só 3 níveis de aninhamento a partir da raiz. Por isso a contagem
// de filhos e a decisão de mostrar o ícone de expandir usam sempre o
// fallback defensivo `node.children?.length ?? node.children_count ?? 0`
// (funciona nos dois casos — ver TASK-AD-03a, "Riscos").
//
// Rótulo de nível SEMPRE via `languageGB.baseRegistrations.addressing.levels[node.type]` —
// NUNCA `node.type_label` (PT-BR fixo do backend, quebraria i18n EN/ES; ver
// "Achado técnico" em TASK-AD-03a).
// -----------------------------------------------------------------------------

import { Fragment } from "react";

import { Badge, Box, Flex, Icon, IconButton, Table, Text } from "@chakra-ui/react";
import { FiChevronDown, FiChevronRight, FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";

import type { AddressingTreeNode } from "@/@types/v2/Addressing/addressing";
import { Actions } from "@/components/Action";
import { useLanguage } from "@/hooks/useLanguage";

export interface AddressingTreeRowProps {
  node: AddressingTreeNode;
  /** 0 (Setor) a 3 (Nível) — controla a indentação visual. */
  depth: number;
  expandedIds: Set<string>;
  /** `true` durante a busca — expande automaticamente todo ramo com match,
   *  em qualquer profundidade (generaliza `isSearching` de `Cultivation`). */
  forceExpanded: boolean;
  onToggleExpand: (node: AddressingTreeNode) => void;
  onEdit: (node: AddressingTreeNode) => void;
  /** Só oferecido quando `node.type < 4` — um Nível nunca é pai. */
  onAddChild: (parent: AddressingTreeNode) => void;
  onDelete: (node: AddressingTreeNode) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}

export function AddressingTreeRow({
  node,
  depth,
  expandedIds,
  forceExpanded,
  onToggleExpand,
  onEdit,
  onAddChild,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: AddressingTreeRowProps) {
  const { languageGB } = useLanguage();

  // Fallback defensivo — ver nota de topo do arquivo (children_count/children
  // ausentes, não zerados, no último nível eager-carregado por `/tree`).
  const childrenCount = node.children?.length ?? node.children_count ?? 0;
  const hasChildren = childrenCount > 0;
  const isExpanded = forceExpanded || expandedIds.has(node.uuid);
  const canAddChild = node.type < 4;

  const levelLabel = languageGB.baseRegistrations.addressing.levels[node.type];
  const nextLevelLabel =
    node.type < 4
      ? languageGB.baseRegistrations.addressing.levels[(node.type + 1) as 1 | 2 | 3 | 4]
      : undefined;

  return (
    <Fragment>
      <Table.Row
        borderBottom="1px solid"
        borderColor="borderGrid"
        backgroundColor={depth === 0 ? "gridBG" : "gridBGAlternate"}
      >
        <Table.Cell
          borderBottom="1px solid"
          borderColor="borderGrid"
          paddingY="10px"
          paddingX="4"
        >
          <Flex align="center" gap={2} paddingLeft={depth * 6}>
            {hasChildren ? (
              <IconButton
                aria-label={
                  isExpanded
                    ? languageGB.baseRegistrations.addressing.tree.collapse
                    : languageGB.baseRegistrations.addressing.tree.expand
                }
                size="xs"
                variant="ghost"
                onClick={() => onToggleExpand(node)}
              >
                <Icon as={isExpanded ? FiChevronDown : FiChevronRight} />
              </IconButton>
            ) : (
              <Box boxSize="24px" flexShrink={0} />
            )}
            <Text fontWeight={depth === 0 ? "semibold" : "normal"} lineClamp="1">
              {node.description}
            </Text>
          </Flex>
        </Table.Cell>

        <Table.Cell
          borderBottom="1px solid"
          borderColor="borderGrid"
          paddingY="10px"
          paddingX="4"
        >
          <Badge colorPalette="blue" variant="subtle" py={1} px={3}>
            {levelLabel}
          </Badge>
        </Table.Cell>

        <Table.Cell
          borderBottom="1px solid"
          borderColor="borderGrid"
          paddingY="10px"
          paddingX="4"
        >
          <Text fontSize="sm" color="fg.muted">
            {childrenCount}
          </Text>
        </Table.Cell>

        <Table.Cell
          borderBottom="1px solid"
          borderColor="borderGrid"
          paddingY="10px"
          paddingX="4"
        >
          <Flex justify="flex-end">
            <Actions size="sm" languageGB={languageGB}>
              {canEdit && (
                <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => onEdit(node)}>
                  {languageGB.baseRegistrations.addressing.actions.edit}
                </Actions.Item>
              )}
              {canAddChild && canCreate && (
                <Actions.Item
                  icon={<Icon as={FiPlus} />}
                  onClick={() => onAddChild(node)}
                >
                  {languageGB.baseRegistrations.addressing.actions.addChild.replace(
                    "{level}",
                    nextLevelLabel ?? ""
                  )}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => onDelete(node)}
                  color="red.400"
                >
                  {languageGB.baseRegistrations.addressing.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        </Table.Cell>
      </Table.Row>

      {/* Recursão genuína: a linha se chama a si mesma para `node.children`,
          um nível por vez — sem caso "raiz"/"filha" hardcoded. */}
      {isExpanded &&
        (node.children ?? []).map((child) => (
          <AddressingTreeRow
            key={child.uuid}
            node={child}
            depth={depth + 1}
            expandedIds={expandedIds}
            forceExpanded={forceExpanded}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
            onAddChild={onAddChild}
            onDelete={onDelete}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
          />
        ))}
    </Fragment>
  );
}
