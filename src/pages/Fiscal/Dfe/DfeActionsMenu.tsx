// src/pages/Fiscal/Dfe/DfeActionsMenu.tsx
// -----------------------------------------------------------------------------
// Dropdown de ações por linha da Listagem de DFe Recebidas (Dfe — domínio
// Fiscal, execução 044, TASK-DFE-FE-05/06/08). Mirror ESTRUTURAL EXATO de
// `Fiscal/NfeEmitidas/NfeActionsMenu.tsx` (composição fina sobre
// `Actions`/`Actions.Item`, props `can*`/`on*`/`labels`): a visibilidade de
// CADA item é calculada pelo CALLER (`index.tsx`, conforme
// `CONTRATO-TELA-DFE-FE.md §6.2`) — este componente só OCULTA (nunca
// desabilita por regra de estado); os únicos `disabled` aqui são guardas de
// EM-VOO (download/mutação em andamento na própria linha), mirror
// `isDeleting` de `NfeActionsMenu`.
//
// Regras de visibilidade aplicadas pelo caller (não reimplementar aqui):
//   - Manifestar: `tipo_evento ∈ {0,1}` (mesma elegibilidade do checkbox de
//     seleção em massa, `TASK-DFE-FE-05`).
//   - Lançar Produto/Animal/Despesa: `tipo !== '0'` + `tipo_evento ∈ {1,2}` +
//     `launched_in === null` + `!is_personal` + `!is_shipment`.
//   - Lançar Retorno: `tipo === '0'` + mesmas 3 últimas condições acima.
//   - DANFE/XML: `tipo_evento ∈ {1,2,3}`.
//   - Alternar Pessoal: oculto se `launched_in !== null || is_shipment`.
//   - Alternar Remessa: oculto se `launched_in !== null || is_personal`.
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import {
  FiCheckSquare,
  FiDownload,
  FiFileText,
  FiPackage,
  FiRepeat,
  FiShoppingBag,
  FiTruck,
  FiUser,
} from 'react-icons/fi';

import { Actions } from '@/components/Action';

export interface DfeActionsMenuLabels {
  manifestar: string;
  alternarPessoal: string;
  alternarRemessa: string;
  lancarProduto: string;
  lancarAnimal: string;
  lancarDespesa: string;
  lancarRetorno: string;
  gerarDanfe: string;
  baixarXml: string;
}

export interface DfeActionsMenuProps {
  canManifest: boolean;
  onManifest: () => void;

  canLaunchInvoice: boolean;
  onLaunchInvoice: () => void;
  canLaunchAnimal: boolean;
  onLaunchAnimal: () => void;
  canLaunchExpense: boolean;
  onLaunchExpense: () => void;
  canLaunchReturn: boolean;
  onLaunchReturn: () => void;
  /** Loading POR LINHA do download de XML para lançamento cross-módulo
   *  (TASK-DFE-FE-08) — guarda as 3 ações de lançamento (produto/animal/
   *  despesa) contra duplo clique enquanto o XML está sendo baixado. */
  isLaunching?: boolean;

  canDanfe: boolean;
  onDanfe: () => void;
  isDanfeLoading?: boolean;

  canXml: boolean;
  onXml: () => void;
  isXmlLoading?: boolean;

  canTogglePersonal: boolean;
  onTogglePersonal: () => void;
  canToggleShipment: boolean;
  onToggleShipment: () => void;
  isToggling?: boolean;

  labels: DfeActionsMenuLabels;
}

export function DfeActionsMenu({
  canManifest,
  onManifest,
  canLaunchInvoice,
  onLaunchInvoice,
  canLaunchAnimal,
  onLaunchAnimal,
  canLaunchExpense,
  onLaunchExpense,
  canLaunchReturn,
  onLaunchReturn,
  isLaunching = false,
  canDanfe,
  onDanfe,
  isDanfeLoading = false,
  canXml,
  onXml,
  isXmlLoading = false,
  canTogglePersonal,
  onTogglePersonal,
  canToggleShipment,
  onToggleShipment,
  isToggling = false,
  labels,
}: DfeActionsMenuProps) {
  const hasLaunchAction =
    canLaunchInvoice || canLaunchAnimal || canLaunchExpense || canLaunchReturn;
  const hasDocumentAction = canDanfe || canXml;
  const hasToggleAction = canTogglePersonal || canToggleShipment;

  return (
    <Actions size="sm">
      {canManifest && (
        <Actions.Item icon={<Icon as={FiCheckSquare} />} onClick={onManifest}>
          {labels.manifestar}
        </Actions.Item>
      )}

      {hasLaunchAction && (
        <>
          {canManifest && <Actions.Separator />}
          {canLaunchInvoice && (
            <Actions.Item
              icon={<Icon as={FiShoppingBag} />}
              onClick={onLaunchInvoice}
              disabled={isLaunching}
            >
              {labels.lancarProduto}
            </Actions.Item>
          )}
          {canLaunchAnimal && (
            <Actions.Item
              icon={<Icon as={FiPackage} />}
              onClick={onLaunchAnimal}
              disabled={isLaunching}
            >
              {labels.lancarAnimal}
            </Actions.Item>
          )}
          {canLaunchExpense && (
            <Actions.Item
              icon={<Icon as={FiFileText} />}
              onClick={onLaunchExpense}
              disabled={isLaunching}
            >
              {labels.lancarDespesa}
            </Actions.Item>
          )}
          {canLaunchReturn && (
            <Actions.Item
              icon={<Icon as={FiRepeat} />}
              onClick={onLaunchReturn}
              disabled={isLaunching}
            >
              {labels.lancarRetorno}
            </Actions.Item>
          )}
        </>
      )}

      {hasDocumentAction && (
        <>
          {(canManifest || hasLaunchAction) && <Actions.Separator />}
          {canDanfe && (
            <Actions.Item
              icon={<Icon as={FiFileText} />}
              onClick={onDanfe}
              disabled={isDanfeLoading}
            >
              {labels.gerarDanfe}
            </Actions.Item>
          )}
          {canXml && (
            <Actions.Item icon={<Icon as={FiDownload} />} onClick={onXml} disabled={isXmlLoading}>
              {labels.baixarXml}
            </Actions.Item>
          )}
        </>
      )}

      {hasToggleAction && (
        <>
          {(canManifest || hasLaunchAction || hasDocumentAction) && <Actions.Separator />}
          {canTogglePersonal && (
            <Actions.Item
              icon={<Icon as={FiUser} />}
              onClick={onTogglePersonal}
              disabled={isToggling}
            >
              {labels.alternarPessoal}
            </Actions.Item>
          )}
          {canToggleShipment && (
            <Actions.Item
              icon={<Icon as={FiTruck} />}
              onClick={onToggleShipment}
              disabled={isToggling}
            >
              {labels.alternarRemessa}
            </Actions.Item>
          )}
        </>
      )}
    </Actions>
  );
}
