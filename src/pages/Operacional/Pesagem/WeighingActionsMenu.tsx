// src/pages/Operacional/Pesagem/WeighingActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Pesagem — Visualizar/Editar/
// Relatório Individual/Excluir (contrato-tela-lane-c-pesagem-frontend.md
// §6.2, TASK-PES-FE-02). Composição fina sobre `Actions`/`Actions.Item`,
// mirror `Sanitario/SanitarioActionsMenu.tsx` (Visualizar/Editar/Excluir) +
// `Marcacao/MarkingActionsMenu.tsx` (ação "Imprimir"/`onPrint`, ícone
// `FiPrinter`) + `VendaAnimais/VendaAnimaisActionsMenu.tsx` (prop
// `isDownloadingReport` que desabilita o item enquanto o blob do relatório
// está sendo baixado — mesmo padrão de loading por linha).
//
// "Relatório Individual" NÃO navega — dispara `onPrint` (download de blob,
// sem tela própria, contrato-tela §1.1/§6.2). Gate `weighing_view` (MESMO
// gate de Visualizar — a ação de relatório não tem permissão própria,
// `EP-PES-08` roteado por `permission:weighing_view` no
// `WeighingRecordController`, confirmado por leitura direta do worktree da
// API).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiPrinter, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

export interface WeighingActionsMenuLabels {
  view: string;
  edit: string;
  report: string;
  delete: string;
}

export interface WeighingActionsMenuProps {
  /** Permissão `weighing_view` — também gateia "Relatório Individual" (§6.2). */
  canView: boolean;
  /** Permissão `weighing_edit`. */
  canEdit: boolean;
  /** Permissão `weighing_delete`. */
  canDelete: boolean;
  isDeleting?: boolean;
  /** `true` enquanto o blob do relatório desta linha está sendo baixado — desabilita o item (mirror `VendaAnimaisActionsMenu.isDownloadingReport`). */
  isDownloadingReport?: boolean;
  labels: WeighingActionsMenuLabels;
  onView: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
}

export function WeighingActionsMenu({
  canView,
  canEdit,
  canDelete,
  isDeleting = false,
  isDownloadingReport = false,
  labels,
  onView,
  onEdit,
  onPrint,
  onDelete,
}: WeighingActionsMenuProps) {
  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canView && (
        <Actions.Item
          icon={<Icon as={FiPrinter} />}
          onClick={onPrint}
          disabled={isDownloadingReport}
        >
          {labels.report}
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

export default WeighingActionsMenu;
