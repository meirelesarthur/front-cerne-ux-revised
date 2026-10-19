// src/pages/Operacional/Nascimentos/BirthAnimalActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Nascimentos — Visualizar/Editar/
// Excluir (contrato de tela §5.3). Composição fina sobre `Actions`/
// `Actions.Item`, mirror `Operacional/Romaneios/RomaneioActionsMenu.tsx`.
//
// GAP-NASC-09 — "Editar"/"Excluir" ficam desabilitados quando `has_weaning`
// (mirror A3/A4 do legado — UI replica o gate, servidor permanece
// permissivo, decisão já tomada, nunca replicar bloqueio server-side),
// sempre com `Tooltip` explicando o motivo — nunca botão morto sem
// explicação.
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Tooltip } from '@/components/TooLtip';

export interface BirthAnimalActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** `has_weaning` do Resource — desabilita Editar/Excluir (GAP-NASC-09). */
  hasWeaning: boolean;
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

export function BirthAnimalActionsMenu({
  canView,
  canEdit,
  canDelete,
  hasWeaning,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  labels,
}: BirthAnimalActionsMenuProps) {
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
          disabled={!hasWeaning}
          positioning={{ placement: 'left' }}
        >
          <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit} disabled={hasWeaning}>
            {labels.edit}
          </Actions.Item>
        </Tooltip>
      )}
      {canDelete && (
        <>
          <Actions.Separator />
          <Tooltip
            content={labels.deleteDisabledTooltip}
            disabled={!hasWeaning}
            positioning={{ placement: 'left' }}
          >
            <Actions.Item
              icon={<Icon as={FiTrash2} />}
              tone="danger"
              onClick={onDelete}
              disabled={hasWeaning || isDeleting}
            >
              {labels.delete}
            </Actions.Item>
          </Tooltip>
        </>
      )}
    </Actions>
  );
}
