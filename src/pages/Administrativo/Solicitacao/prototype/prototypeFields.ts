// src/pages/Administrativo/Solicitacao/prototype/prototypeFields.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (ver `config/v2/purchaseOrderPrototype.ts`) — campos que a API da
// Ordem de compra ainda não tem e que só existem nos dados de demonstração
// (`mocks/dev-api/handlers/purchaseOrdersDemo.ts`), com os nomes sugeridos no
// documento do desenvolvedor. Mais as regras puras que a tela usa.
// -----------------------------------------------------------------------------

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import type { RequestItemRow, RequestPurchaseData } from '@/@types/v2/RequestPurchases';

import type { GeneratedOrder } from './generateOrders';
import type { PurchaseOrderFlowProfile, PurchaseOrderStepKey } from './purchaseOrderSteps';

export interface PurchaseOrderDelivery {
  freight_type: 'CIF' | 'FOB';
  /** Fazenda ou depósito de destino. */
  place: string;
  carrier?: string | null;
  needs_unloading: boolean;
  note?: string | null;
}

/** Uma aprovação da ordem, por nível de alçada. */
export interface PurchaseOrderApproval {
  level: number;
  /** Nome do nível (ex.: "Encarregado", "Diretoria — acima de R$ 100.000"). */
  level_label: string;
  user: { uuid: string; name: string };
  status: 'approved' | 'rejected' | 'pending';
  decided_at: string | null;
  note: string | null;
}

/** Parcela de pagamento da ordem. */
export interface PurchaseOrderInstallment {
  seq: number;
  due_date: string;
  value: number;
  status: 'open' | 'paid';
}

/** Condição de pagamento, parcelas e despesas da ordem (F4). */
export interface PurchaseOrderPayment {
  condition: string;
  installments: PurchaseOrderInstallment[];
  expenses: { freight: number; insurance: number; other: number };
}

/** Nota fiscal de entrada ligada à ordem (F4). */
export interface PurchaseOrderInvoice {
  uuid: string;
  issuer: string;
  number: string;
  series: string;
  issued_at: string;
  entered_at: string;
  value: number;
}

/** Campos de protótipo na ordem (lista e detalhe). */
export interface PurchaseOrderPrototypeFields {
  payment?: PurchaseOrderPayment | null;
  invoices?: PurchaseOrderInvoice[];
  /** Recebida em parte (situação 7 com saldo e ao menos uma entrega). */
  receipt_partial?: boolean;
  /** Aprovações por nível de alçada (detalhe). */
  approvals?: PurchaseOrderApproval[];
  flow_profile?: PurchaseOrderFlowProfile;
  /** Fornecedor da cotação aprovada. */
  winning_provider?: { uuid: string; name: string } | null;
  /** Quem compra (setor de compras). */
  buyer?: { uuid: string; name: string } | null;
  /** Etapa em que a ordem foi cancelada (situação 10). */
  cancelled_at_step?: PurchaseOrderStepKey;
  /** Previsão de entrega da ORDEM: uma data só, porque o fornecedor é único (26/11); não há previsão por item. */
  delivery_forecast?: string | null;
  delivery?: PurchaseOrderDelivery | null;
  /** Ordens de compra geradas por esta Solicitação, uma por fornecedor (26/11). */
  generated_orders?: GeneratedOrder[];
  /** Fornecedores que podem receber uma Ordem (só nos dados de demonstração). */
  provider_options?: { uuid: string; name: string }[];
}

/** Campos de protótipo no item. */
export interface PurchaseOrderPrototypeItemFields {
  unit_price?: number | null;
  received_quantity?: number | null;
  /** Item cancelado (o saldo deixa de ser esperado). */
  cancelled?: boolean;
}

/**
 * Conferência do pagamento: parcelas devem somar o total dos itens mais as
 * despesas. `diff` > 0 = falta parcelar; < 0 = parcelado a mais.
 */
export function paymentCheck(itemsTotal: number, payment: PurchaseOrderPayment) {
  const expenses = payment.expenses.freight + payment.expenses.insurance + payment.expenses.other;
  const expected = Math.round((itemsTotal + expenses) * 100) / 100;
  const scheduled = Math.round(payment.installments.reduce((sum, p) => sum + p.value, 0) * 100) / 100;
  return { expenses, expected, scheduled, diff: Math.round((expected - scheduled) * 100) / 100 };
}

export type PrototypePurchaseOrder = RequestPurchaseData &
  PurchaseOrderPrototypeFields & { items: (RequestItemRow & PurchaseOrderPrototypeItemFields)[] };

// Situações em que a entrega ainda é esperada (antes de receber, sem recusa nem
// cancelamento). Recebida (8), finalizada (9), recusada (5) e cancelada (10) não atrasam.
const AWAITING_DELIVERY = new Set<number>([
  requestPurchaseStatus.solicitacao,
  requestPurchaseStatus.cotacaoEmAndamento,
  requestPurchaseStatus.aguardandoAprovacao,
  requestPurchaseStatus.aguardandoCiencia,
  requestPurchaseStatus.aguardandoCompra,
  requestPurchaseStatus.compraEfetuada,
  requestPurchaseStatus.analisarProcesso,
]);

/** Atrasada: previsão de entrega anterior a hoje e a entrega ainda é esperada. */
export function isDeliveryLate(
  forecast: string | null | undefined,
  status: number,
  today: string = new Date().toISOString().slice(0, 10)
): boolean {
  if (!forecast) return false;
  return AWAITING_DELIVERY.has(status) && forecast.slice(0, 10) < today;
}

/** Valor unitário (do protótipo ou valor ÷ quantidade), total, recebido e saldo do item. */
export function itemTotals(item: RequestItemRow & PurchaseOrderPrototypeItemFields) {
  const quantity = item.quantity ?? null;
  const total = item.amount ?? 0;
  const unit = item.unit_price ?? (quantity ? total / quantity : total);
  const received = item.received_quantity ?? 0;
  const balance =
    quantity === null ? null : item.cancelled ? 0 : Math.max(quantity - received, 0);
  return { quantity, unit, total, received, balance, cancelled: !!item.cancelled };
}
