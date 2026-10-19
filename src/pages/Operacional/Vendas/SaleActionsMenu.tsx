// src/pages/Operacional/Vendas/SaleActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Vendas COMERCIAL (Sale —
// Operacional / Vendas, venda de PRODUTOS, 97-Esteiras/043, SALE-FE-COM-02).
// Composição fina sobre `Actions`/`Actions.Item`, mirror
// `Operacional/Pedidos/OrderActionsMenu.tsx`.
//
// CHOKEPOINT (contrato-tela §10): este arquivo nasce aqui com Visualizar/
// Editar/Excluir (A004/A007/A008) e é ADITIVO em Tarefas futuras — `06`
// acrescenta "Emitir NFe" (A006), `07` acrescenta "Gerar Adiantamento"
// (A005). Nenhuma reimplementação de regra de negócio no cliente: `canEdit`/
// `canDelete` são os flags `can_edit`/`can_delete` do `SaleListResource`
// (contrato-api §3.3) — a RBAC (`sales_edit`/`sales_delete`) decide se o
// item aparece; o flag do Resource decide se ele fica habilitado (Tooltip
// quando desabilitado, nunca oculto silenciosamente).
//
// SALE-FE-COM-06 — "Emitir NFe" (A006, task-packet §"Componentes"): item só
// RENDERIZA quando `nfe == null` (`SaleListItem.nfe`, nunca recalculado no
// cliente — some de vez quando a NFe é vinculada); gate `nfe_create` (RBAC)
// desabilita com `Tooltip` quando visível mas sem permissão (padrão
// INVERSO do Editar/Excluir, onde a RBAC oculta e o flag do Resource
// desabilita — aqui a visibilidade é do FLAG e o desabilitar é da RBAC,
// conforme task-packet literal).
//
// SALE-FE-COM-07 — "Gerar Adiantamento" (A005): MESMO padrão do Editar/
// Excluir — RBAC (`incomes_create`) oculta o item inteiro; o flag
// `can_advance_income` do `SaleListResource` (nunca recalculado no cliente,
// contrato-tela §7.2) desabilita com Tooltip quando a Venda já tem
// adiantamento.
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiDollarSign, FiEdit, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

export interface SaleActionsMenuLabels {
  view: string;
  edit: string;
  delete: string;
  generateNfe: string;
  advanceIncome: string;
  editDisabledTooltip: string;
  deleteDisabledTooltip: string;
  generateNfePermissionTooltip: string;
  advanceIncomeDisabledTooltip: string;
}

export interface SaleActionsMenuProps {
  /** Permissão RBAC `sales_edit` — decide se o item aparece no menu. */
  canEdit: boolean;
  /** Permissão RBAC `sales_delete` — decide se o item aparece no menu. */
  canDelete: boolean;
  /** Permissão RBAC `nfe_create` (gate duplo, junto de `sales_view` que já
   *  concede acesso à tela) — decide se o item "Emitir NFe" aparece. */
  canGenerateNfe: boolean;
  /** Permissão RBAC `incomes_create` (contrato-api §8 DEC-02) — decide se o
   *  item "Gerar Adiantamento" aparece. */
  canAdvanceIncome: boolean;
  /** Flag `can_edit` do `SaleListResource` — decide se o item habilitado
   *  (nunca recalculado no cliente, contrato-tela §7.2). */
  rowCanEdit: boolean;
  /** Flag `can_delete` do `SaleListResource`. */
  rowCanDelete: boolean;
  /** `nfe == null` — Nfe ainda não vinculada a esta Venda. */
  rowCanGenerateNfe: boolean;
  /** Flag `can_advance_income` do `SaleListResource`. */
  rowCanAdvanceIncome: boolean;
  isDeleting?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateNfe: () => void;
  onAdvanceIncome: () => void;
  labels: SaleActionsMenuLabels;
}

export function SaleActionsMenu({
  canEdit,
  canDelete,
  canGenerateNfe,
  canAdvanceIncome,
  rowCanEdit,
  rowCanDelete,
  rowCanGenerateNfe,
  rowCanAdvanceIncome,
  isDeleting = false,
  onView,
  onEdit,
  onDelete,
  onGenerateNfe,
  onAdvanceIncome,
  labels,
}: SaleActionsMenuProps) {
  return (
    <Actions size="sm">
      <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
        {labels.view}
      </Actions.Item>
      {canEdit && (
        <Actions.Item
          icon={<Icon as={FiEdit} />}
          onClick={onEdit}
          disabled={!rowCanEdit}
          disabledReason={!rowCanEdit ? labels.editDisabledTooltip : undefined}
        >
          {labels.edit}
        </Actions.Item>
      )}
      {rowCanGenerateNfe && (
        <Actions.Item
          icon={<Icon as={FiFileText} />}
          onClick={onGenerateNfe}
          disabled={!canGenerateNfe}
          disabledReason={!canGenerateNfe ? labels.generateNfePermissionTooltip : undefined}
        >
          {labels.generateNfe}
        </Actions.Item>
      )}
      {canAdvanceIncome && (
        <Actions.Item
          icon={<Icon as={FiDollarSign} />}
          onClick={onAdvanceIncome}
          disabled={!rowCanAdvanceIncome}
          disabledReason={!rowCanAdvanceIncome ? labels.advanceIncomeDisabledTooltip : undefined}
        >
          {labels.advanceIncome}
        </Actions.Item>
      )}
      {canDelete && (
        <>
          <Actions.Separator />
          <Actions.Item
            icon={<Icon as={FiTrash2} />}
            tone="danger"
            onClick={onDelete}
            disabled={!rowCanDelete || isDeleting}
            disabledReason={!rowCanDelete ? labels.deleteDisabledTooltip : undefined}
          >
            {labels.delete}
          </Actions.Item>
        </>
      )}
    </Actions>
  );
}

export default SaleActionsMenu;
