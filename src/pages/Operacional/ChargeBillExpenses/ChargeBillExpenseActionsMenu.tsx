// src/pages/Operacional/ChargeBillExpenses/ChargeBillExpenseActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações de linha da listagem de Contas a Pagar — TASK-CBE-05,
// esteira 97-Esteiras/062 (contrato de tela §2.4). Mirror
// `ChargeBillIncomeActionsMenu.tsx` (gêmeo). Gates por
// `charge_expense_view`/`charge_expense_edit`/`charge_expense_delete`.
// -----------------------------------------------------------------------------

import { Flex, Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';
import type { ChargeBillExpenseListItem } from '@/@types/v2/ChargeBillExpense';

export interface ChargeBillExpenseActionsMenuProps {
  chargeBillExpense: ChargeBillExpenseListItem;
  languageGB: LanguageDate;
  onView: (item: ChargeBillExpenseListItem) => void;
  onEdit: (item: ChargeBillExpenseListItem) => void;
  onDelete: (item: ChargeBillExpenseListItem) => void;
  isDeleting?: boolean;
}

export function ChargeBillExpenseActionsMenu({
  chargeBillExpense,
  languageGB,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
}: ChargeBillExpenseActionsMenuProps) {
  const { can } = usePermissions();
  const text = languageGB.chargeBillExpenses.chargeBillExpense.list.actions;

  const canView = can('charge_expense_view');
  const canEdit = can('charge_expense_edit');
  const canDelete = can('charge_expense_delete');

  return (
    <Flex justify="flex-end">
      <Actions size="sm">
        {canView && (
          <Actions.Item icon={<Icon as={FiEye} />} onClick={() => onView(chargeBillExpense)}>
            {text.view}
          </Actions.Item>
        )}
        {canEdit && (
          <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => onEdit(chargeBillExpense)}>
            {text.edit}
          </Actions.Item>
        )}
        {canDelete && (
          <Actions.Item
            icon={<Icon as={FiTrash2} />}
            tone="danger"
            onClick={() => onDelete(chargeBillExpense)}
            disabled={isDeleting}
          >
            {text.delete}
          </Actions.Item>
        )}
      </Actions>
    </Flex>
  );
}
