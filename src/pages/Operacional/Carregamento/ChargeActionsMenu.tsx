// src/pages/Operacional/Carregamento/ChargeActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Carregamentos — mirror
// `RomaneioActionsMenu.tsx` (composição fina sobre `Actions`/`Actions.Item`).
//
// Nota técnica 5 do plano de arquitetura frontend: NÃO existe surface
// separada de "Visualizar" para Carregamento (mirror `Transfer`/
// `isReadOnly`) — a MESMA tela `CreateOrUpdateCharge.tsx` (TASK-FE-CG-03)
// cobre criar/editar/visualizar. Por isso este menu mostra UMA única entrada
// de navegação por linha: "Editar" quando o usuário tem `charge_edit`,
// "Visualizar" quando só tem `charge_view` — ambas para a MESMA rota
// `/operacional/carregamento/:chargeUuid` (a rota nasce em `TASK-FE-CG-03`;
// até lá o link cai no catch-all — comportamento aceito, mirror do padrão já
// usado pelo fork para fatiamento incremental de listagem→formulário).
//
// AM-06 (contrato legado, `action_manifest`) — "Excluir" só é permitido
// quando `status === 'pendente'`; um Carregamento `finalizada` mostra o
// item desabilitado com tooltip explicando o motivo (nunca botão morto sem
// explicação, mesmo racional de `has_fiscal_document`/`has_financial_
// posting` em `RomaneioActionsMenu`).
//
// AM-01..08 (documentos/finalizar/gerar romaneio/imprimir) — decisão (a) do
// dono já fechada na camada `api`: `finish`/`transfer` reusam `charge_edit`
// (não uma permissão nova). As 4 ações nasceram como itens de menu
// desabilitados ("em breve") em `TASK-FE-CG-02`; `TASK-FE-CG-05` HABILITOU
// "Finalizar" (AM-05, `status==='pendente'`) e "Gerar Romaneio" (AM-07,
// `status==='finalizada'` — `transfer_id` NÃO exposto pelo `ChargeResource`,
// nota técnica do plano de arquitetura frontend: o servidor mesmo assim
// guarda a checagem completa via 422 de negócio no clique). `TASK-FE-CG-06`
// HABILITA "Documentos" (AM-03, `condition: sempre` — visível para
// `canView`, mirror `ChargeDocumentsModal`, que por sua vez gateia a
// ESCRITA por `charge_edit` internamente). "Imprimir" continua "em breve" —
// os 2 relatórios de `TASK-FE-CG-07` são globais (por período), não uma
// ação de UM carregamento, e por isso vivem em botões do `HeaderTable`, não
// neste menu por linha.
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiFileText, FiPrinter, FiRepeat, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Tooltip } from '@/components/TooLtip';

export interface ChargeActionsMenuProps {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** `status === 'pendente'` — habilita a exclusão (AM-06). */
  isDeletable: boolean;
  isDeleting?: boolean;
  /** AM-05 — `status === 'pendente'` habilita "Finalizar". */
  isFinishable: boolean;
  /** AM-07 — `status === 'finalizada'` habilita "Gerar Romaneio". */
  isTransferable: boolean;
  onEditOrView: () => void;
  onDelete: () => void;
  onFinish: () => void;
  onGenerateTransfer: () => void;
  /** AM-03 (`TASK-FE-CG-06`) — abre `ChargeDocumentsModal`. */
  onOpenDocuments: () => void;
  labels: {
    view: string;
    edit: string;
    delete: string;
    documents: string;
    finish: string;
    transfer: string;
    print: string;
    deleteDisabledTooltip: string;
    finishDisabledTooltip: string;
    transferDisabledTooltip: string;
    comingSoonTooltip: string;
  };
}

export function ChargeActionsMenu({
  canView,
  canEdit,
  canDelete,
  isDeletable,
  isDeleting = false,
  isFinishable,
  isTransferable,
  onEditOrView,
  onDelete,
  onFinish,
  onGenerateTransfer,
  onOpenDocuments,
  labels,
}: ChargeActionsMenuProps) {
  return (
    <Actions size="sm">
      {canEdit ? (
        <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEditOrView}>
          {labels.edit}
        </Actions.Item>
      ) : (
        canView && (
          <Actions.Item icon={<Icon as={FiEye} />} onClick={onEditOrView}>
            {labels.view}
          </Actions.Item>
        )
      )}

      {canView && (
        <Actions.Item icon={<Icon as={FiFileText} />} onClick={onOpenDocuments}>
          {labels.documents}
        </Actions.Item>
      )}

      {canEdit && (
        <>
          <Tooltip
            content={labels.finishDisabledTooltip}
            disabled={isFinishable}
            positioning={{ placement: 'left' }}
          >
            <Actions.Item icon={<Icon as={FiRepeat} />} onClick={onFinish} disabled={!isFinishable}>
              {labels.finish}
            </Actions.Item>
          </Tooltip>
          <Tooltip
            content={labels.transferDisabledTooltip}
            disabled={isTransferable}
            positioning={{ placement: 'left' }}
          >
            <Actions.Item
              icon={<Icon as={FiRepeat} />}
              onClick={onGenerateTransfer}
              disabled={!isTransferable}
            >
              {labels.transfer}
            </Actions.Item>
          </Tooltip>
        </>
      )}

      {canView && (
        <Tooltip content={labels.comingSoonTooltip} positioning={{ placement: 'left' }}>
          <Actions.Item icon={<Icon as={FiPrinter} />} disabled>
            {labels.print}
          </Actions.Item>
        </Tooltip>
      )}

      {canDelete && (
        <>
          <Actions.Separator />
          <Tooltip
            content={labels.deleteDisabledTooltip}
            disabled={isDeletable}
            positioning={{ placement: 'left' }}
          >
            <Actions.Item
              icon={<Icon as={FiTrash2} />}
              tone="danger"
              onClick={onDelete}
              disabled={!isDeletable || isDeleting}
            >
              {labels.delete}
            </Actions.Item>
          </Tooltip>
        </>
      )}
    </Actions>
  );
}
