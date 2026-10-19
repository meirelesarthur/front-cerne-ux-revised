// src/pages/Operacional/Romaneios/RomaneioActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Romaneios — Visualizar/Editar/
// Excluir (contrato de tela §4.2). Composição fina sobre `Actions`/
// `Actions.Item` (`src/components/Action.tsx`), mirror `InvoiceActionsMenu.tsx`.
//
// "Visualizar" tem rota PRÓPRIA (`/detalhe`, GAP-TRF-FE-10 — tela dedicada,
// não formulário read-only) — diferente de Equipes, aqui NÃO há dedup entre
// Visualizar/Editar: os dois convivem no menu quando o usuário tem ambos os
// gates.
//
// GAP-TRF-FE-05 (P0) — travas de imutabilidade visíveis ANTES do clique:
// "Editar"/"Excluir" ficam desabilitados quando `has_fiscal_document ||
// has_financial_posting`, sempre com `Tooltip` explicando o motivo — nunca
// botão morto sem explicação.
//
// "Finalizar" (UT-000728) aparece com `transfers_edit` e só é habilitada com
// status Pendente, com `Tooltip` explicando o motivo quando não for.
// Imprimir, Duplicar, Emitir NF-e e Gerar Financeiro NÃO aparecem — ausência
// limpa, não desabilitadas (GAP-TRF-FE-11).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiCheckSquare, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Tooltip } from '@/components/TooLtip';

export interface RomaneioActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** `has_fiscal_document || has_financial_posting` — desabilita
   *  Editar/Excluir (GAP-TRF-FE-05). */
  isLocked: boolean;
  /** `status === 'P'` — habilita "Finalizar". */
  isFinishable: boolean;
  onView: () => void;
  onEdit: () => void;
  onFinish: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  labels: {
    view: string;
    edit: string;
    delete: string;
    finish: string;
    finishDisabledTooltip: string;
    editDisabledTooltip: string;
    deleteDisabledTooltip: string;
  };
}

export function RomaneioActionsMenu({
  canView,
  canEdit,
  canDelete,
  isLocked,
  isFinishable,
  onView,
  onEdit,
  onFinish,
  onDelete,
  isDeleting = false,
  labels,
}: RomaneioActionsMenuProps) {
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
          disabled={!isLocked}
          positioning={{ placement: 'left' }}
        >
          <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit} disabled={isLocked}>
            {labels.edit}
          </Actions.Item>
        </Tooltip>
      )}
      {canEdit && (
        <Tooltip
          content={labels.finishDisabledTooltip}
          disabled={isFinishable}
          positioning={{ placement: 'left' }}
        >
          <Actions.Item
            icon={<Icon as={FiCheckSquare} />}
            onClick={onFinish}
            disabled={!isFinishable}
          >
            {labels.finish}
          </Actions.Item>
        </Tooltip>
      )}
      {canDelete && (
        <>
          <Actions.Separator />
          <Tooltip
            content={labels.deleteDisabledTooltip}
            disabled={!isLocked}
            positioning={{ placement: 'left' }}
          >
            <Actions.Item
              icon={<Icon as={FiTrash2} />}
              tone="danger"
              onClick={onDelete}
              disabled={isLocked || isDeleting}
            >
              {labels.delete}
            </Actions.Item>
          </Tooltip>
        </>
      )}
    </Actions>
  );
}
