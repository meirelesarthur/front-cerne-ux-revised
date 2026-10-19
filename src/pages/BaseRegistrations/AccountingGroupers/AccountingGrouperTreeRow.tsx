// src/pages/BaseRegistrations/AccountingGroupers/AccountingGrouperTreeRow.tsx
// -----------------------------------------------------------------------------
// Mapeador de LINHA da árvore de Agrupadores Contábeis — adaptação de
// `Agrupadores/GrouperTreeView.tsx`, SEM estado de expandir/recolher e SEM
// busca de filhos sob demanda (a API de `AccountingGrouper` devolve a árvore
// INTEIRA, já ordenada por depth/nested-set, em uma única chamada — ver
// "Leitura do dev" da TASK-ACG-01). Cada nó é sempre visível, indentado por
// `item.depth`.
//
// `hasChildren` é calculado no CLIENTE (index.tsx, via `Set` de
// `parent_uuid`) porque `AccountingGrouperResource` não expõe
// `children_count` (diferente de `Grouper`) — mas como todos os nós já estão
// em memória, é 100% confiável. Usado para esconder "Excluir" em nós com
// filhos (fidelidade de UX ao Blade legado,
// `accounting-groupers/tree.blade.php:27`) — cosmético, a guarda REAL é do
// backend (`CheckAccountingGrouperDependenciesAction`, 422 `errors.in_use`).
//
// Linhas são `Table.Row`/`Table.Cell` (Chakra) DIRETOS — sem
// `TableProvider`/`useTable()` (mesma decisão de `GrouperTreeNode`: a
// expansão por seleção do `Table`/`Pagination` genérico do projeto é
// semântica de "detalhe de uma linha selecionada", não navegação
// hierárquica). O `<Table.Root>`/`<Table.Header>`/`<Table.Body>` que envolve
// tudo mora UMA ÚNICA VEZ em index.tsx.
// -----------------------------------------------------------------------------

import { Badge, Flex, Icon, Table, Text } from '@chakra-ui/react';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import { useLanguage } from '@/hooks/useLanguage';

import type { AccountingGrouperListItem } from '@/@types/v2/AccountingGroupers';

export interface AccountingGrouperTreeRowProps {
  node: AccountingGrouperListItem;
  /** Calculado no cliente (index.tsx) a partir de `parent_uuid` — ver nota de topo. */
  hasChildren: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  /** Desabilita a ação "Excluir" enquanto uma exclusão está em andamento (mesma UX de `GrouperTreeNode`). */
  isDeleting?: boolean;
  onEdit: (node: AccountingGrouperListItem) => void;
  onCreateChild: (node: AccountingGrouperListItem) => void;
  /** Só oferecido para nós SEM filhos (ver nota de topo do arquivo). */
  onDeleteClick: (node: AccountingGrouperListItem) => void;
}

export function AccountingGrouperTreeRow({
  node,
  hasChildren,
  canEdit,
  canCreate,
  canDelete,
  isDeleting,
  onEdit,
  onCreateChild,
  onDeleteClick,
}: AccountingGrouperTreeRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.baseRegistrations.accountingGroupers;

  // "Excluir" só aparece em nós SEM filhos (fidelidade de UX ao legado — ver
  // nota de topo do arquivo). Backend não impõe limite de profundidade para
  // "Criar descendente" (diferente de `Grouper`) — sem checagem de `depth`
  // aqui (TASK-ACG-01, DoD).
  const canShowDelete = canDelete && !hasChildren;
  const indent = 4 + node.depth * 6;

  return (
    <Table.Row
      borderBottom="1px solid"
      borderColor="borderGrid"
      backgroundColor={node.depth === 0 ? 'gridBG' : 'gridBGAlternate'}
    >
      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Flex align="center" gap={2} paddingLeft={indent}>
          <Text fontFamily="mono" fontSize="sm" color="fg.muted" lineClamp="1">
            {node.code}
          </Text>
        </Flex>
      </Table.Cell>

      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Text fontWeight={node.depth === 0 ? 'semibold' : 'normal'} lineClamp="1">
          {node.name}
        </Text>
      </Table.Cell>

      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Text>{node.order}</Text>
      </Table.Cell>

      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Badge colorPalette={node.is_enabled ? 'green' : 'gray'} variant="subtle" py={1} px={3}>
          {node.is_enabled ? text.list.table.active : text.list.table.inactive}
        </Badge>
      </Table.Cell>

      <Table.Cell borderBottom="1px solid" borderColor="borderGrid" paddingY="10px" paddingX="4">
        <Flex justify="flex-end">
          <Actions size="sm" languageGB={languageGB}>
            {canEdit && (
              <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => onEdit(node)}>
                {text.list.actions.edit}
              </Actions.Item>
            )}
            {canCreate && (
              <Actions.Item icon={<Icon as={FiPlus} />} onClick={() => onCreateChild(node)}>
                {text.list.actions.addChild}
              </Actions.Item>
            )}
            {canShowDelete && (
              <Actions.Item
                icon={<Icon as={FiTrash2} />}
                onClick={() => onDeleteClick(node)}
                color="red.400"
                disabled={isDeleting}
              >
                {text.list.actions.delete}
              </Actions.Item>
            )}
          </Actions>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}
