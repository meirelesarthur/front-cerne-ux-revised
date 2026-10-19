// src/pages/Operacional/Separations/SeparationActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Apartação — Visualizar/Editar/
// Excluir (frontend-contract-apartacao.md §5). Composição fina sobre
// `Actions`/`Actions.Item`, mirror estrutural
// `Operacional/Nascimentos/BirthAnimalActionsMenu.tsx`.
//
// Diferença DELIBERADA do mirror (contrato §5, tabela de Ações): quando
// `isFinishedProcessing` é `true`, "Editar"/"Excluir" simplesmente NÃO SÃO
// RENDERIZADAS (mirror exato do legado) — SEM `Tooltip`/estado desabilitado,
// porque o próprio badge de status já explica o motivo. Diferente de
// `has_weaning` (Nascimentos), que mantém o item visível-porém-desabilitado
// com tooltip explicativo.
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

export interface SeparationActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** `finished_processing` do Resource — some Editar/Excluir (contrato §5). */
  isFinishedProcessing: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  labels: {
    view: string;
    edit: string;
    delete: string;
  };
}

export function SeparationActionsMenu({
  canView,
  canEdit,
  canDelete,
  isFinishedProcessing,
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  labels,
}: SeparationActionsMenuProps) {
  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canEdit && !isFinishedProcessing && (
        <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit}>
          {labels.edit}
        </Actions.Item>
      )}
      {canDelete && !isFinishedProcessing && (
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
