// src/pages/Operacional/PesagemRodoviaria/ModuleWeighingActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Pesagem Rodoviária (ModuleWeighing,
// FE-SCR-01, TASK-MWG-FE-02, `AM-005..AM-010`) — a superfície mais
// condicional da tela: 6 ações, cada uma com sua própria `state_condition`
// (contrato legado §action_manifest). Nenhuma condição é ambígua — todas
// vêm do legado, sem Gap (ver `CONTRATO-TELA-PESAGEM-FE §1`/`TASK-MWG-FE-02`).
//
// | Ação            | state_condition                                              |
// |-----------------|---------------------------------------------------------------|
// | Editar          | status==1                                                     |
// | Próxima etapa   | status not in [4,5]                                           |
// | Finalizar       | status==4                                                     |
// | Emitir NFe      | status==5 && type==0 (VendaSaida) && nfe_uuid==null           |
// | Emitir Romaneio | status>=4 && type∈{0,3,4} && transfer_uuid==null              |
// | Excluir         | qualquer status, gate `module-weighing_delete` (GAP-PES-02 —  |
// |                 | a UI não decide a regra, só reage à resposta da API)          |
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import {
  FiArrowRightCircle,
  FiCheckCircle,
  FiEdit,
  FiFileText,
  FiTrash2,
  FiTruck,
} from 'react-icons/fi';

import { Actions } from '@/components/Action';

import { moduleWeighingType } from '@/constants/ModuleWeighing/module-weighing-type';

import type {
  ModuleWeighingStatus,
  ModuleWeighingType as ModuleWeighingTypeValue,
} from '@/@types/v2/ModuleWeighing/module-weighing';

export interface ModuleWeighingActionsMenuLabels {
  edit: string;
  nextStep: string;
  finalize: string;
  issueNfe: string;
  issueTransfer: string;
  delete: string;
}

export interface ModuleWeighingActionsMenuProps {
  status: ModuleWeighingStatus;
  type: ModuleWeighingTypeValue;
  nfeUuid: string | null;
  transferUuid: string | null;
  /** Permissão `module-weighing_edit` — gateia editar/próxima etapa/finalizar/NFe/romaneio. */
  canEdit: boolean;
  /** Permissão `module-weighing_delete`. */
  canDelete: boolean;
  isDeleting?: boolean;
  labels: ModuleWeighingActionsMenuLabels;
  onEdit: () => void;
  onNextStep: () => void;
  onFinalize: () => void;
  onIssueNfe: () => void;
  onIssueTransfer: () => void;
  onDelete: () => void;
}

export function ModuleWeighingActionsMenu({
  status,
  type,
  nfeUuid,
  transferUuid,
  canEdit,
  canDelete,
  isDeleting = false,
  labels,
  onEdit,
  onNextStep,
  onFinalize,
  onIssueNfe,
  onIssueTransfer,
  onDelete,
}: ModuleWeighingActionsMenuProps) {
  // Correção 050 (BUG-5) — `status` chega STRING do `ModuleWeighingResource`
  // (backed enum string-based no backend, mesma causa-raiz do BUG-4), mas
  // este componente compara com NÚMERO (tipo declarado como
  // `ModuleWeighingStatus` = união de literais numéricos, checagem só em
  // compile-time). `Number(...)` aqui normaliza a comparação para
  // número×número de forma robusta, aceitando string OU number vindos da
  // API — sem essa coerção `canShowEdit` nunca era `true` (Editar nunca
  // aparecia), `canShowNextStep` era sempre `true` (Próxima Etapa aparecia
  // até em registro Finalizado) e `canShowFinalize`/`canShowIssueNfe` nunca
  // disparavam.
  const statusNumber = Number(status);
  const canShowEdit = canEdit && statusNumber === 1;
  const canShowNextStep = canEdit && statusNumber !== 4 && statusNumber !== 5;
  const canShowFinalize = canEdit && statusNumber === 4;
  const canShowIssueNfe =
    canEdit && statusNumber === 5 && type === moduleWeighingType.vendaSaida && nfeUuid == null;
  const canShowIssueTransfer =
    canEdit &&
    statusNumber >= 4 &&
    (type === moduleWeighingType.vendaSaida ||
      type === moduleWeighingType.entradaColheita ||
      type === moduleWeighingType.entradaTerceiros) &&
    transferUuid == null;

  return (
    <Actions size="sm">
      {canShowEdit && (
        <Actions.Item icon={<Icon as={FiEdit} />} onClick={onEdit}>
          {labels.edit}
        </Actions.Item>
      )}
      {canShowNextStep && (
        <Actions.Item icon={<Icon as={FiArrowRightCircle} />} onClick={onNextStep}>
          {labels.nextStep}
        </Actions.Item>
      )}
      {canShowFinalize && (
        <Actions.Item icon={<Icon as={FiCheckCircle} />} onClick={onFinalize}>
          {labels.finalize}
        </Actions.Item>
      )}
      {canShowIssueNfe && (
        <Actions.Item icon={<Icon as={FiFileText} />} onClick={onIssueNfe}>
          {labels.issueNfe}
        </Actions.Item>
      )}
      {canShowIssueTransfer && (
        <Actions.Item icon={<Icon as={FiTruck} />} onClick={onIssueTransfer}>
          {labels.issueTransfer}
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

export default ModuleWeighingActionsMenu;
