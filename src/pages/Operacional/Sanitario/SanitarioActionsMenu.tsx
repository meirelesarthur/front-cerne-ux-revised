// src/pages/Operacional/Sanitario/SanitarioActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Sanitário — Visualizar/Editar/
// Excluir (contrato-tela-lane-c-sanitario-frontend.md §6.2, TASK-SAN-FE-02
// regras 3/4). Composição fina sobre `Actions`/`Actions.Item`, mirror
// `Operacional/Reproducao/Acasalamento/AcasalamentoActionsMenu.tsx`.
//
// Nenhuma flag `can_*` do servidor foi documentada para este recurso — as 3
// ações ficam gateadas SÓ por permissão RBAC (`sanitary_view/edit/delete`),
// mirror `mode_matrix` (regra 3 da Tarefa: correção definitiva de CL-01/
// OQ-02 — NUNCA `weighing_*`).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

export interface SanitarioActionsMenuLabels {
  view: string;
  edit: string;
  delete: string;
}

export interface SanitarioActionsMenuProps {
  /** Permissão `sanitary_view`. */
  canView: boolean;
  /** Permissão `sanitary_edit`. */
  canEdit: boolean;
  /** Permissão `sanitary_delete`. */
  canDelete: boolean;
  isDeleting?: boolean;
  labels: SanitarioActionsMenuLabels;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SanitarioActionsMenu({
  canView,
  canEdit,
  canDelete,
  isDeleting = false,
  labels,
  onView,
  onEdit,
  onDelete,
}: SanitarioActionsMenuProps) {
  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canEdit && (
        <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit}>
          {labels.edit}
        </Actions.Item>
      )}
      {canDelete && (
        <>
          <Actions.Separator />
          <Actions.Item
            icon={<Icon as={FiTrash2} />}
            tone="danger"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {labels.delete}
          </Actions.Item>
        </>
      )}
    </Actions>
  );
}

export default SanitarioActionsMenu;
