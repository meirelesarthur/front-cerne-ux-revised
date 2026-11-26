// src/pages/Administrativo/OrdensCompra/prototype/purchaseOrderEntity.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — a ORDEM DE COMPRA como entidade própria: de UM
// fornecedor, nasce de uma Solicitação ("Gerar ordens") ou sozinha. A
// Solicitação continua viva e ligada às Ordens. Previsão de entrega é uma só,
// da ordem. Chama rotas `/prototype/purchase-orders*` que só existem nos dados
// de demonstração (`mocks/dev-api/handlers/purchaseOrdersDemo.ts`).
// Tipos, chamadas e regras puras (testadas).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PrototypeReceiptPayload } from '../../Solicitacao/prototype/prototypeActions';
import type {
  PurchaseOrderCategoryKey,
  PurchaseOrderMarkKey,
} from '../../Solicitacao/prototype/purchaseOrderCategories';

import type { StandaloneOrderPayload } from './standaloneOrder';
import type {
  PurchaseOrderDelivery,
  PurchaseOrderInvoice,
  PurchaseOrderPayment,
} from '../../Solicitacao/prototype/prototypeFields';
import { PURCHASE_ORDERS_PATH } from '../purchaseOrderViews';

/** Lista e detalhe da Ordem de compra (a lista de Solicitações segue em `PURCHASE_ORDERS_PATH`). */
export const PURCHASE_ORDER_ENTITY_PATH = `${PURCHASE_ORDERS_PATH}/ordens`;

export const purchaseOrderEntityPath = (uuid: string) => `${PURCHASE_ORDER_ENTITY_PATH}/${uuid}`;

export interface PurchaseOrderSummary {
  uuid: string;
  code: string;
  provider: { uuid: string; name: string };
  status: number;
  status_label: string;
  date: string;
  farm: { uuid: string; description: string };
  delivery_forecast: string | null;
  /** Solicitação de origem; `null` quando a Ordem começou sozinha. */
  request: { uuid: string; code: string; description: string } | null;
  /** Categoria (as 4 de 25/11) e marcação; na ordem gerada, vêm do tipo da Solicitação. */
  category: PurchaseOrderCategoryKey | null;
  mark: PurchaseOrderMarkKey | null;
  items_count: number;
  total: number;
}

export interface PurchaseOrderEntityItem {
  uuid: string;
  description: string;
  product: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  received_quantity: number;
  cancelled: boolean;
  request_item_uuid: string | null;
}

/** Entrega, pagamento, NFs e recebimento são da ORDEM (fornecedor único), 26/11. */
export interface PurchaseOrderEntity extends PurchaseOrderSummary {
  provider_contact: { email: string; phone: string };
  delivery: PurchaseOrderDelivery | null;
  payment: PurchaseOrderPayment | null;
  invoices: PurchaseOrderInvoice[];
  items: PurchaseOrderEntityItem[];
}

/** Saldo do item: o que falta receber (0 quando cancelado). */
export function purchaseOrderItemBalance(item: PurchaseOrderEntityItem): number {
  return item.cancelled ? 0 : Math.max(0, item.quantity - item.received_quantity);
}

/** Ainda há o que receber? (para "Registrar recebimento" e "Cancelar saldo"). */
export function purchaseOrderHasBalance(order: Pick<PurchaseOrderEntity, 'items' | 'status'>): boolean {
  return [6, 7].includes(order.status) && order.items.some((item) => purchaseOrderItemBalance(item) > 0);
}

export const purchaseOrderEntityQueryKey = {
  list: ['prototype-purchase-orders'] as const,
  detail: (uuid: string) => ['prototype-purchase-orders', uuid] as const,
};

// Resposta no envelope de sempre da API: `{ data: ... }`.
export async function fetchPurchaseOrders(): Promise<PurchaseOrderSummary[]> {
  const { data } = await api.V2.get<{ data: PurchaseOrderSummary[] }>('/prototype/purchase-orders');
  return data.data ?? [];
}

export async function fetchPurchaseOrder(uuid: string): Promise<PurchaseOrderEntity> {
  const { data } = await api.V2.get<{ data: PurchaseOrderEntity }>(`/prototype/purchase-orders/${uuid}`);
  return data.data;
}

export interface StandaloneOrderOptions {
  providers: { uuid: string; name: string }[];
  farms: { uuid: string; description: string }[];
}

export async function fetchStandaloneOrderOptions(): Promise<StandaloneOrderOptions> {
  const { data } = await api.V2.get<{ data: StandaloneOrderOptions }>('/prototype/purchase-orders/options');
  return data.data;
}

/** Cria a Ordem avulsa (sem Solicitação) e devolve o detalhe dela. */
export async function createStandaloneOrder(payload: StandaloneOrderPayload): Promise<PurchaseOrderEntity> {
  const { data } = await api.V2.post<{ data: PurchaseOrderEntity }>('/prototype/purchase-orders', payload);
  return data.data;
}

export const PURCHASE_ORDER_NEW_PATH = `${PURCHASE_ORDER_ENTITY_PATH}/nova`;

export function setPurchaseOrderForecast(uuid: string, date: string) {
  return api.V2.post(`/prototype/purchase-orders/${uuid}/forecast`, { date });
}

export function registerPurchaseOrderReceipt(uuid: string, payload: PrototypeReceiptPayload) {
  return api.V2.post(`/prototype/purchase-orders/${uuid}/receipt`, payload);
}

export function cancelPurchaseOrderBalance(uuid: string, justify: string) {
  return api.V2.post(`/prototype/purchase-orders/${uuid}/cancel-balance`, { justify });
}

/** Visões da lista: abertas (aguardando ou compra efetuada), recebidas e todas. */
export type PurchaseOrderEntityView = 'abertas' | 'recebidas' | 'todas';

const VIEW_STATUS: Record<Exclude<PurchaseOrderEntityView, 'todas'>, number[]> = {
  abertas: [6, 7],
  recebidas: [8, 9],
};

/** Origem: só as que nasceram de Solicitação, só as avulsas, ou as duas. */
export type PurchaseOrderOrigin = 'todas' | 'solicitacao' | 'avulsa';

export function filterPurchaseOrders(
  orders: PurchaseOrderSummary[],
  { view, origin, search }: { view: PurchaseOrderEntityView; origin: PurchaseOrderOrigin; search: string }
): PurchaseOrderSummary[] {
  const term = search.trim().toLocaleLowerCase('pt-BR');
  return orders.filter((order) => {
    if (view !== 'todas' && !VIEW_STATUS[view].includes(order.status)) return false;
    if (origin === 'solicitacao' && !order.request) return false;
    if (origin === 'avulsa' && order.request) return false;
    if (!term) return true;
    return [order.code, order.provider.name, order.request?.code ?? '', order.farm.description].some((value) =>
      value.toLocaleLowerCase('pt-BR').includes(term)
    );
  });
}

/** Quantas ordens em cada visão (para o seletor). */
export function countPurchaseOrderViews(orders: PurchaseOrderSummary[]): Record<PurchaseOrderEntityView, number> {
  return {
    abertas: orders.filter((o) => VIEW_STATUS.abertas.includes(o.status)).length,
    recebidas: orders.filter((o) => VIEW_STATUS.recebidas.includes(o.status)).length,
    todas: orders.length,
  };
}

/** Cor da situação (tokens do tema). */
export function purchaseOrderStatusColor(status: number): string {
  if (status === 8 || status === 9) return 'green.700';
  if (status === 7) return 'blue.600';
  return 'orange.600';
}
