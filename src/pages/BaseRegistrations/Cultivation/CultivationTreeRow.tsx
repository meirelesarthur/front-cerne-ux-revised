// src/pages/BaseRegistrations/Cultivation/CultivationTreeRow.tsx
// -----------------------------------------------------------------------------
// Linha de ÁRVORE DEDICADA para a listagem de Cultura/Variedade.
//
// DECISÃO DO DEV (ver "Decisão do Desenvolvedor" em
// 07-Tarefas_Frontend/TASK-CV-04a-cultivation-listagem-arvore.md, Alternativa
// A confirmada, 2026-07-16): o mecanismo de expansão de linha já existente em
// `Table`/`TableProvider` (src/components/Table.tsx:289,
// `row.getIsSelected() && row.getCanExpand()`) liga expansão à SELEÇÃO por
// checkbox — pensado para "detalhe extra de UMA linha selecionada", não para
// navegação hierárquica Cultura↔Variedades. Reaproveitá-lo forçaria o usuário
// a "selecionar" uma Cultura só para ver suas Variedades. Por isso esta
// composição é DEDICADA: ícone de expandir/recolher próprio da feature,
// indentação visual para Variedades, badge de status e ações por linha —
// usando as primitivas atômicas já existentes do catálogo real do projeto
// (`Badge`/`Icon`/`Table.*` do Chakra, `Actions` de @/components/Action),
// nunca importando componente do Storybook `cerne` direto.
//
// Uma Cultura (raiz) pode ter Variedades filhas (MAX_DEPTH=2 — uma Variedade
// nunca é pai de ninguém, por isso nunca tem "Nova Variedade" no menu de
// ações nem ícone de expandir).
// -----------------------------------------------------------------------------

import { Badge, Box, Flex, Icon, IconButton, Table, Text } from "@chakra-ui/react";
import { FiChevronDown, FiChevronRight, FiEdit, FiPlus, FiTrash2 } from "react-icons/fi";

import type { CultivationTreeNode } from "@/@types/v2/Cultivation/cultivation";
import { Actions } from "@/components/Action";
import { useLanguage } from "@/hooks/useLanguage";

export interface CultivationTreeRowProps {
  node: CultivationTreeNode;
  /** Só relevante para nós "cultura" com filhos. */
  isExpanded: boolean;
  onToggleExpand: (node: CultivationTreeNode) => void;
  onEdit: (node: CultivationTreeNode) => void;
  /** Só oferecido para nós "cultura" (uma Variedade nunca é pai — MAX_DEPTH=2). */
  onNewVariety: (parent: CultivationTreeNode) => void;
  onDelete: (node: CultivationTreeNode) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}

export function CultivationTreeRow({
  node,
  isExpanded,
  onToggleExpand,
  onEdit,
  onNewVariety,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: CultivationTreeRowProps) {
  const { languageGB } = useLanguage();

  const isRoot = node.type === "cultura";
  const hasChildren = isRoot && !!node.children?.length;

  return (
    <Table.Row
      borderBottom="1px solid"
      borderColor="borderGrid"
      backgroundColor={isRoot ? "gridBG" : "gridBGAlternate"}
    >
      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Flex align="center" gap={2} paddingLeft={isRoot ? 0 : 8}>
          {isRoot ? (
            hasChildren ? (
              <IconButton
                aria-label={
                  isExpanded
                    ? languageGB.cultivation.tree.collapse
                    : languageGB.cultivation.tree.expand
                }
                size="xs"
                variant="ghost"
                onClick={() => onToggleExpand(node)}
              >
                <Icon as={isExpanded ? FiChevronDown : FiChevronRight} />
              </IconButton>
            ) : (
              <Box boxSize="24px" flexShrink={0} />
            )
          ) : null}
          <Text fontWeight={isRoot ? "semibold" : "normal"} lineClamp="1">
            {node.name}
          </Text>
        </Flex>
      </Table.Cell>

      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Badge
          colorPalette={node.is_enabled ? "green" : "red"}
          variant="subtle"
          py={1}
          px={3}
        >
          {node.is_enabled
            ? languageGB.cultivation.table.active
            : languageGB.cultivation.table.inactive}
        </Badge>
      </Table.Cell>

      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        {isRoot ? (
          <Text fontSize="sm" color="fg.muted">
            {node.children?.length ?? 0}
          </Text>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            —
          </Text>
        )}
      </Table.Cell>

      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Flex justify="flex-end">
          <Actions size="sm" languageGB={languageGB}>
            {canEdit && (
              <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => onEdit(node)}>
                {languageGB.cultivation.actions.edit}
              </Actions.Item>
            )}
            {isRoot && canCreate && (
              <Actions.Item
                icon={<Icon as={FiPlus} />}
                onClick={() => onNewVariety(node)}
              >
                {languageGB.cultivation.actions.newVariety}
              </Actions.Item>
            )}
            {canDelete && (
              <Actions.Item
                icon={<Icon as={FiTrash2} />}
                onClick={() => onDelete(node)}
                color="red.400"
              >
                {languageGB.cultivation.actions.delete}
              </Actions.Item>
            )}
          </Actions>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}
