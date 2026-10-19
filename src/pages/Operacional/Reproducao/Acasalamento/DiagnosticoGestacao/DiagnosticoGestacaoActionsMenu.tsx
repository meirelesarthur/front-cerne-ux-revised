// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/DiagnosticoGestacaoActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Diagnóstico de Gestação — 2 nós de
// ação (`pd-action-view`, `pd-action-delete`), mirror
// `Acasalamento/AcasalamentoActionsMenu.tsx` (TASK-BM-FE-03/contrato de tela
// §6.6). `Excluir` é governado pela PERMISSÃO **e** por `row.can_delete`
// (regra 7 da Tarefa) — `can_delete` só é `true` no ÚLTIMO diagnóstico do
// Acasalamento (CLM-PD-024, autoridade do SERVIDOR). PROIBIDO recalcular "é
// o último registro" aqui — nenhuma comparação de índice/posição na lista.
//
// Não existe modo editar nesta sub-árvore (regra 11 da Tarefa) — este menu
// não tem, e nunca terá, um nó "Editar".
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import type { PregnancyDiagnosisListItem } from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

export interface DiagnosticoGestacaoActionsMenuLabels {
  view: string;
  delete: string;
}

export interface DiagnosticoGestacaoActionsMenuProps {
  /** Linha da grid — fonte de `can_delete` (autoridade do servidor). */
  item: PregnancyDiagnosisListItem;
  /** Permissão `pregnancy-diagnosis_view`. */
  canView: boolean;
  /** Permissão `pregnancy-diagnosis_delete`. */
  canDelete: boolean;
  isDeleting?: boolean;
  labels: DiagnosticoGestacaoActionsMenuLabels;
  onView: () => void;
  onDelete: () => void;
}

export function DiagnosticoGestacaoActionsMenu({
  item,
  canView,
  canDelete,
  isDeleting = false,
  labels,
  onView,
  onDelete,
}: DiagnosticoGestacaoActionsMenuProps) {
  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canDelete && item.can_delete && (
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

export default DiagnosticoGestacaoActionsMenu;
