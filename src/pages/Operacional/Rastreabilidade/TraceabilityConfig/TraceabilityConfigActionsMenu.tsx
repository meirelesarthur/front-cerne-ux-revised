// src/pages/Operacional/Rastreabilidade/TraceabilityConfig/TraceabilityConfigActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Configuração (Rastreabilidade) —
// TASK-TR-FE-09, mirror `Traceability/TraceabilityActionsMenu.tsx` (composição
// fina sobre `Actions`/`Actions.Item`), reduzido a 2 ações (contrato de tela
// `## 5.1`): "Editar" e "Excluir" — sem "Ver"/"Galeria"/"Etiqueta" (exclusivos
// de Produto).
//
// Gate ÚNICO `tracconfig_view` cobre TODOS os verbos (`## 6.1` do contrato de
// destino, ratificado) — `canEdit`/`canDelete` chegam do call site derivados
// da MESMA permissão (não existem `tracconfig_edit`/`tracconfig_delete`
// separadas).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

export interface TraceabilityConfigActionsMenuLabels {
  edit: string;
  delete: string;
}

export interface TraceabilityConfigActionsMenuProps {
  canEdit: boolean;
  canDelete: boolean;
  isDeleting?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  labels: TraceabilityConfigActionsMenuLabels;
}

export function TraceabilityConfigActionsMenu({
  canEdit,
  canDelete,
  isDeleting = false,
  onEdit,
  onDelete,
  labels,
}: TraceabilityConfigActionsMenuProps) {
  return (
    <Actions size="sm">
      {canEdit && (
        <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit}>
          {labels.edit}
        </Actions.Item>
      )}

      {canDelete && (
        <Actions.Item
          icon={<Icon as={FiTrash2} />}
          tone="danger"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {labels.delete}
        </Actions.Item>
      )}
    </Actions>
  );
}
