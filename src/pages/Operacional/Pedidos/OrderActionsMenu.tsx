// src/pages/Operacional/Pedidos/OrderActionsMenu.tsx
// -----------------------------------------------------------------------------
// Menu de ações por linha da listagem de Pedidos (Order — Operacional /
// Vendas, F-051, 97-Esteiras/043, PED-FE-02). Composição fina sobre
// `Actions`/`Actions.Item` (`src/components/Action.tsx`), mirror
// `RomaneioActionsMenu.tsx`/`InvoiceActionsMenu.tsx`.
//
// Contrato-tela §7.4 (AM-001..011): Visualizar/Imprimir sempre disponíveis
// (RBAC própria) · Editar/Excluir gateados por `status < 2` (`orders_edit`/
// `orders_delete`) — desabilitados com `Tooltip` explicando o motivo, nunca
// botão morto sem explicação (mesma disciplina de `RomaneioActionsMenu`).
//
// "Gerar Venda" (SALE-FE-COM-10, 97-Esteiras/063 — backend já em produção
// desde a execução 043, `SALE-02`/DEC-166) — habilitada quando
// `status < 3 && sales_create` (gate do contrato `POST /orders/{uuid}/
// sales`, `Order.status < 3` senão `BusinessRuleException`); desabilitada +
// tooltip explicando o motivo (status Finalizado/Cancelado) quando o gate
// falha. Navega para `/operacional/pedidos/{uuid}/gerar-venda`
// (`GerarVendaFromOrder.tsx`). Ajuda (AM-001) omitida (PARADA-M, default v1
// — sem helper correspondente no design system `cerne`).
// -----------------------------------------------------------------------------

import { Icon } from '@chakra-ui/react';
import { FiEdit, FiEye, FiPrinter, FiShoppingCart, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';

const ORDER_EDITABLE_STATUS_THRESHOLD = 2;
// Mirror `contrato-api-pedidos.md`/`SaleFromOrderRequest` — gate real de
// `POST /orders/{uuid}/sales` é `Order.status < 3` (Finalizado=3,
// Cancelado=9 ficam de fora), roteiro `pedidos-f051-roteiro.md §2`.
const ORDER_SALE_GENERATABLE_STATUS_THRESHOLD = 3;

export interface OrderActionsMenuLabels {
  view: string;
  edit: string;
  delete: string;
  print: string;
  generateSale: string;
  generateSaleTooltip: string;
  editDisabledTooltip: string;
  deleteDisabledTooltip: string;
}

export interface OrderActionsMenuProps {
  /** `status` numérico da linha (1/2/3/9) — gate de Editar/Excluir é
   *  `status < 2` (contrato-tela §7.4), nunca `status_label`. */
  status: number;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canGenerateSale: boolean;
  isDeleting?: boolean;
  isPrinting?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  /** SALE-FE-COM-10 — navega para `/operacional/pedidos/{uuid}/gerar-venda`. */
  onGenerateSale: () => void;
  labels: OrderActionsMenuLabels;
}

export function OrderActionsMenu({
  status,
  canView,
  canEdit,
  canDelete,
  canGenerateSale,
  isDeleting = false,
  isPrinting = false,
  onView,
  onEdit,
  onDelete,
  onPrint,
  onGenerateSale,
  labels,
}: OrderActionsMenuProps) {
  const isEditable = status < ORDER_EDITABLE_STATUS_THRESHOLD;
  const canGenerateSaleNow = status < ORDER_SALE_GENERATABLE_STATUS_THRESHOLD;

  return (
    <Actions size="sm">
      {canView && (
        <Actions.Item icon={<Icon as={FiEye} />} onClick={onView}>
          {labels.view}
        </Actions.Item>
      )}
      {canView && (
        <Actions.Item icon={<Icon as={FiPrinter} />} onClick={onPrint} disabled={isPrinting}>
          {labels.print}
        </Actions.Item>
      )}
      {canEdit && (
        <Actions.Item
          icon={<Icon as={FiEdit} />}
          onClick={onEdit}
          disabled={!isEditable}
          disabledReason={!isEditable ? labels.editDisabledTooltip : undefined}
        >
          {labels.edit}
        </Actions.Item>
      )}
      {canGenerateSale && (
        <Actions.Item
          icon={<Icon as={FiShoppingCart} />}
          onClick={onGenerateSale}
          disabled={!canGenerateSaleNow}
          disabledReason={!canGenerateSaleNow ? labels.generateSaleTooltip : undefined}
        >
          {labels.generateSale}
        </Actions.Item>
      )}
      {canDelete && (
        <>
          <Actions.Separator />
          <Actions.Item
            icon={<Icon as={FiTrash2} />}
            tone="danger"
            onClick={onDelete}
            disabled={!isEditable || isDeleting}
            disabledReason={!isEditable ? labels.deleteDisabledTooltip : undefined}
          >
            {labels.delete}
          </Actions.Item>
        </>
      )}
    </Actions>
  );
}

export default OrderActionsMenu;
