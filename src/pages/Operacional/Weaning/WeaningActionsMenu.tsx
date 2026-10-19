// src/pages/Operacional/Weaning/WeaningActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Desmama — Visualizar/Editar/
// Excluir. Composição fina sobre `Actions`/`Actions.Item`, mirror
// `Operacional/Nascimentos/BirthAnimalActionsMenu.tsx`.
//
// `finishedProcessing` (`WeaningResource.finished_processing`, GAP-WN-03) —
// desabilita Editar/Excluir quando a Desmama já tem processamento
// finalizado (mirror do gate de UI já aplicado em `BirthAnimalActionsMenu`
// para `has_weaning`; aqui o servidor TAMBÉM reforça com 422
// `UpdateWeaningAction`/`DestroyWeaningAction` — a UI só evita a tentativa
// óbvia, sempre com `Tooltip` explicando o motivo).
// -----------------------------------------------------------------------------

import { Box, Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Tooltip } from '@/components/TooLtip';

export interface WeaningActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** `finished_processing` do Resource — desabilita Editar/Excluir (GAP-WN-03). */
  finishedProcessing: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  labels: {
    view: string;
    edit: string;
    delete: string;
    editDisabledTooltip: string;
    deleteDisabledTooltip: string;
  };
}

export function WeaningActionsMenu({
  canView,
  canEdit,
  canDelete,
  finishedProcessing,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  labels,
}: WeaningActionsMenuProps) {
  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canEdit && (
        <Tooltip
          content={labels.editDisabledTooltip}
          disabled={!finishedProcessing}
          positioning={{ placement: 'left' }}
        >
          {/* Gatilho no wrapper: item `disabled` não dispara eventos de ponteiro. */}
          <Box
            tabIndex={finishedProcessing ? 0 : undefined}
            cursor={finishedProcessing ? 'not-allowed' : undefined}
            display="block"
            w="full"
          >
            <Actions.Item
              icon={<Icon as={FiEdit} />}
              onClick={onEdit}
              disabled={finishedProcessing}
            >
              {labels.edit}
            </Actions.Item>
          </Box>
        </Tooltip>
      )}
      {canDelete && (
        <>
          <Actions.Separator />
          <Tooltip
            content={labels.deleteDisabledTooltip}
            disabled={!finishedProcessing}
            positioning={{ placement: 'left' }}
          >
            <Box
              tabIndex={finishedProcessing ? 0 : undefined}
              cursor={finishedProcessing ? 'not-allowed' : undefined}
              display="block"
              w="full"
            >
              <Actions.Item
                icon={<Icon as={FiTrash2} />}
                tone="danger"
                onClick={onDelete}
                disabled={finishedProcessing || isDeleting}
              >
                {labels.delete}
              </Actions.Item>
            </Box>
          </Tooltip>
        </>
      )}
    </Actions>
  );
}
