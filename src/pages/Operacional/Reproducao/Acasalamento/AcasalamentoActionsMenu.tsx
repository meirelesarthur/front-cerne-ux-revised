// src/pages/Operacional/Reproducao/Acasalamento/AcasalamentoActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Acasalamento — 7 nós de ação
// (contrato de tela §6.2, regra 7 da Tarefa 03). Cada nó é governado pela
// PERMISSÃO **e** pela flag `can_*` do servidor — NUNCA por condição
// recalculada aqui. PROIBIDO neste arquivo: qualquer comparação com
// `status`/`type`/`protocol`/`last_protocol_identification` para decidir
// exibição de ação (regra 7; ver DoD — grep de guarda).
//
// `Próxima Etapa` e `Próxima Etapa Individual` compartilham a MESMA flag
// `can_next_step` — defeito do legado preservado por decisão do dono
// (`GAP-FE-BM-03` §2, `CLM-022`). Não inventar condição própria para a
// "individual".
//
// `Finalizar`/`Excluir` só ABREM o diálogo de confirmação aqui — a mutação
// real vive em `index.tsx` (regra 8: nunca mutar no `onClick` da linha).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiCheckCircle, FiEdit, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

import type { BreedingMatingListItem } from '@/@types/v2/BreedingMating';

export interface AcasalamentoActionsMenuLabels {
  view: string;
  edit: string;
  nextStep: string;
  nextStepIndividual: string;
  finish: string;
  pregnancyDiagnosis: string;
  delete: string;
}

export interface AcasalamentoActionsMenuProps {
  /** Linha da grid — fonte das flags `can_*` (autoridade do servidor). */
  item: BreedingMatingListItem;
  /** Permissão `breeding-matings_view`. */
  canView: boolean;
  /** Permissão `breeding-matings_edit` — guarda Editar/Próxima Etapa/Finalizar. */
  canEdit: boolean;
  /** Permissão `pregnancy-diagnosis_view`. */
  canViewPregnancyDiagnosis: boolean;
  /** Permissão `breeding-matings_delete`. */
  canDelete: boolean;
  isFinishing?: boolean;
  isDeleting?: boolean;
  labels: AcasalamentoActionsMenuLabels;
  onView: () => void;
  onEdit: () => void;
  onNextStep: () => void;
  onNextStepIndividual: () => void;
  onFinish: () => void;
  onPregnancyDiagnosis: () => void;
  onDelete: () => void;
}

export function AcasalamentoActionsMenu({
  item,
  canView,
  canEdit,
  canViewPregnancyDiagnosis,
  canDelete,
  isFinishing = false,
  isDeleting = false,
  labels,
  onView,
  onEdit,
  onNextStep,
  onNextStepIndividual,
  onFinish,
  onPregnancyDiagnosis,
  onDelete,
}: AcasalamentoActionsMenuProps) {
  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canEdit && item.can_edit && (
        <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit}>
          {labels.edit}
        </Actions.Item>
      )}
      {/* `Próxima Etapa`/`Próxima Etapa Individual` — MESMA flag `can_next_step`
          (CLM-022, GAP-FE-BM-03 §2). Nunca diferenciar sem decisão do dono. */}
      {canEdit && item.can_next_step && (
        <Actions.Item icon={<Icon as={FiCheckCircle} />} onClick={onNextStep}>
          {labels.nextStep}
        </Actions.Item>
      )}
      {canEdit && item.can_next_step && (
        <Actions.Item icon={<Icon as={FiCheckCircle} />} onClick={onNextStepIndividual}>
          {labels.nextStepIndividual}
        </Actions.Item>
      )}
      {canEdit && item.can_finish && (
        <Actions.Item icon={<Icon as={FiCheckCircle} />} onClick={onFinish} disabled={isFinishing}>
          {labels.finish}
        </Actions.Item>
      )}
      {canViewPregnancyDiagnosis && item.can_pregnancy_diagnosis && (
        <Actions.Item icon={<Icon as={FiFileText} />} onClick={onPregnancyDiagnosis}>
          {labels.pregnancyDiagnosis}
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

export default AcasalamentoActionsMenu;
