// src/pages/Operacional/CompraAnimais/CompraAnimaisActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Compra de Animais — mirror
// `VendaAnimaisActionsMenu.tsx` (props `can*`/`on*`, `Tooltip` reservado para
// item desabilitado). Contrato de tela §5/§6.
//
// Ordem final do legado (mirror `SCR-B3` de Vendas, ACT-01..07, SEM "Emitir
// NFe" — `GAP-CP-01`, decisão de escopo do backend, nenhuma Tarefa desta
// esteira constrói essa superfície): Visualizar → Relatório → Documentos →
// Relatório SISBOV → Editar → Excluir.
//
// `onDocuments` é OPCIONAL (mesmo racional de `onPrint`/`onEmitNfe` na
// fundação de Vendas, TASK-VD-FE-01): o modal de anexos
// (`MovementPurchaseDocumentsModal`) ainda não existe (`TASK-CP-08`) — sem a
// prop, o item "Documentos" simplesmente NÃO É RENDERIZADO (ausência limpa,
// SEM MOCK), em vez de um botão morto sem efeito.
//
// Trava `!finished_processing` (Editar E Excluir, CLM-45) — T6 (088): a API
// expõe `finished_processing` na listagem; `isLocked` (fonte única
// `isMovementPurchaseLocked`) desabilita Editar e Excluir, cada um com dica.
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiFile, FiFileText, FiPrinter, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Tooltip } from '@/components/TooLtip';

export interface CompraAnimaisActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** `isMovementPurchaseLocked(item)` — processamento finalizado; desabilita
   *  Editar e Excluir quando `true`. */
  isLocked?: boolean;
  onView: () => void;
  onEdit?: () => void;
  /** `GET .../{uuid}/report` — sempre disponível a quem pode visualizar. */
  onReport?: () => void;
  /** Abre o modal de Documentos (`POST .../documents`, `TASK-CP-08`) — sem
   *  esta prop, o item não é renderizado (modal ainda não existe). */
  onDocuments?: () => void;
  /** `GET .../{uuid}/sisbov-report` — endpoint ÚNICO (diferente de Vendas,
   *  sem variantes recria/abate). */
  onSisbovReport?: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  /** Baixando o relatório/SISBOV desta LINHA especificamente (não a
   *  listagem inteira) — desabilita só o próprio item. */
  isDownloadingReport?: boolean;
  isDownloadingSisbovReport?: boolean;
  labels: {
    view: string;
    report: string;
    documents: string;
    sisbovReport: string;
    edit: string;
    delete: string;
    editDisabledTooltip: string;
    deleteDisabledTooltip: string;
  };
}

export function CompraAnimaisActionsMenu({
  canView,
  canEdit,
  canDelete,
  isLocked = false,
  onView,
  onEdit,
  onReport,
  onDocuments,
  onSisbovReport,
  onDelete,
  isDeleting = false,
  isDownloadingReport = false,
  isDownloadingSisbovReport = false,
  labels,
}: CompraAnimaisActionsMenuProps) {
  return (
    <Actions size="sm">
      {/* Ordem do legado (mirror `SCR-B3` de Vendas): Visualizar →
          Relatório → Documentos → Relatório SISBOV → Editar → Excluir. */}
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canView && onReport && (
        <Actions.Item
          icon={<Icon as={FiPrinter} />}
          onClick={onReport}
          disabled={isDownloadingReport}
        >
          {labels.report}
        </Actions.Item>
      )}
      {canView && onDocuments && (
        <Actions.Item icon={<Icon as={FiFile} />} onClick={onDocuments}>
          {labels.documents}
        </Actions.Item>
      )}
      {canView && onSisbovReport && (
        <Actions.Item
          icon={<Icon as={FiFileText} />}
          onClick={onSisbovReport}
          disabled={isDownloadingSisbovReport}
        >
          {labels.sisbovReport}
        </Actions.Item>
      )}
      {canEdit && onEdit && (
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
              disabled={isDeleting || isLocked}
            >
              {labels.delete}
            </Actions.Item>
          </Tooltip>
        </>
      )}
    </Actions>
  );
}
