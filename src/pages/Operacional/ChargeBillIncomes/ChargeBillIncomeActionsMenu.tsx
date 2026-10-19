// src/pages/Operacional/ChargeBillIncomes/ChargeBillIncomeActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações de linha da listagem de Contas a Receber — TASK-CBI-FE-02
// (contrato de tela §4/§8 SURF-FE-ACTIONS). Mirror `Actions`/`Actions.Item`
// já usado em `FechamentoSemana/index.tsx`/`ContasBancarias/index.tsx`.
// Gates por `charge_income_view`/`charge_income_edit`/`charge_income_delete`
// (ACT-02..04 do contrato legado).
// -----------------------------------------------------------------------------

import { Flex, Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';
import type { ChargeBillIncomeListItem } from '@/@types/v2/ChargeBillIncome';

export interface ChargeBillIncomeActionsMenuProps {
  chargeBillIncome: ChargeBillIncomeListItem;
  languageGB: LanguageDate;
  onView: (item: ChargeBillIncomeListItem) => void;
  onEdit: (item: ChargeBillIncomeListItem) => void;
  onDelete: (item: ChargeBillIncomeListItem) => void;
  isDeleting?: boolean;
}

export function ChargeBillIncomeActionsMenu({
  chargeBillIncome,
  languageGB,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
}: ChargeBillIncomeActionsMenuProps) {
  const { can } = usePermissions();
  const text = languageGB.chargeBillIncomes.chargeBillIncome.list.actions;

  const canView = can('charge_income_view');
  const canEdit = can('charge_income_edit');
  const canDelete = can('charge_income_delete');

  return (
    <Flex justify="flex-end">
      <Actions size="sm">
        {canView && (
          <Actions.Item icon={<Icon as={FiEye} />} onClick={() => onView(chargeBillIncome)}>
            {text.view}
          </Actions.Item>
        )}
        {canEdit && (
          <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => onEdit(chargeBillIncome)}>
            {text.edit}
          </Actions.Item>
        )}
        {canDelete && (
          <Actions.Item
            icon={<Icon as={FiTrash2} />}
            tone="danger"
            onClick={() => onDelete(chargeBillIncome)}
            disabled={isDeleting}
          >
            {text.delete}
          </Actions.Item>
        )}
      </Actions>
    </Flex>
  );
}
