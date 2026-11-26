// src/pages/Administrativo/OrdensCompra/prototype/standaloneOrder.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (26/11/2026) — Ordem de compra AVULSA, que começa sozinha, sem
// Solicitação. Um fornecedor, uma fazenda, a categoria (as 4 decididas em
// 25/11) e, se for o caso, a marcação (Urgência ou Regularização), uma
// previsão de entrega da ordem e os itens com quantidade e valor unitário.
// Regra pura, testada: validação e montagem do envio.
// -----------------------------------------------------------------------------

import type {
  PurchaseOrderCategoryKey,
  PurchaseOrderMarkKey,
} from '../../Solicitacao/prototype/purchaseOrderCategories';

export interface StandaloneOrderItemForm {
  key: string;
  description: string;
  quantity: number | null;
  unit_price: number | null;
}

/** Entrega combinada com o fornecedor (opcional: só vai se tiver o local). */
export interface StandaloneDeliveryForm {
  freight_type: 'CIF' | 'FOB';
  place: string;
  carrier: string;
  needs_unloading: boolean;
  note: string;
}

/** Pagamento (opcional: só vai se tiver a condição): parcelas iguais a partir do 1º vencimento. */
export interface StandalonePaymentForm {
  condition: string;
  installments: number | null;
  first_due: string;
  interval_days: number | null;
  freight: number | null;
  insurance: number | null;
  other: number | null;
}

export interface StandaloneOrderForm {
  provider_uuid: string | null;
  farm_uuid: string | null;
  category: PurchaseOrderCategoryKey | null;
  mark: PurchaseOrderMarkKey | null;
  delivery_forecast: string;
  items: StandaloneOrderItemForm[];
  delivery: StandaloneDeliveryForm;
  payment: StandalonePaymentForm;
}

export interface InstallmentRow {
  seq: number;
  due_date: string;
  value: number;
  status: 'open';
}

export interface StandaloneOrderPayload {
  provider_uuid: string;
  farm_uuid: string;
  category: PurchaseOrderCategoryKey;
  mark: PurchaseOrderMarkKey | null;
  delivery_forecast: string | null;
  items: { description: string; quantity: number; unit_price: number }[];
  delivery: {
    freight_type: 'CIF' | 'FOB';
    place: string;
    carrier: string | null;
    needs_unloading: boolean;
    note: string | null;
  } | null;
  payment: {
    condition: string;
    installments: InstallmentRow[];
    expenses: { freight: number; insurance: number; other: number };
  } | null;
}

export type StandaloneOrderError =
  | 'provider'
  | 'farm'
  | 'category'
  | 'items'
  | 'itemIncomplete'
  | 'paymentIncomplete';

/** Soma `days` dias a uma data `yyyy-MM-dd` (sem fuso). */
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

/** Parcelas iguais (centavos), a última absorve o arredondamento. */
export function buildInstallments(total: number, count: number, firstDue: string, intervalDays: number): InstallmentRow[] {
  if (count <= 0 || !firstDue) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  return Array.from({ length: count }, (_, i) => ({
    seq: i + 1,
    due_date: addDays(firstDue, i * intervalDays),
    value: (i === count - 1 ? cents - base * (count - 1) : base) / 100,
    status: 'open' as const,
  }));
}

const expensesOf = (p: StandalonePaymentForm) => ({
  freight: p.freight ?? 0,
  insurance: p.insurance ?? 0,
  other: p.other ?? 0,
});

let seq = 0;
export const newStandaloneItem = (): StandaloneOrderItemForm => ({
  key: `novo-${++seq}`,
  description: '',
  quantity: null,
  unit_price: null,
});

export const emptyStandaloneOrder = (): StandaloneOrderForm => ({
  provider_uuid: null,
  farm_uuid: null,
  category: null,
  mark: null,
  delivery_forecast: '',
  items: [newStandaloneItem()],
  delivery: { freight_type: 'CIF', place: '', carrier: '', needs_unloading: false, note: '' },
  payment: { condition: '', installments: 1, first_due: '', interval_days: 30, freight: null, insurance: null, other: null },
});

const isBlank = (item: StandaloneOrderItemForm) => !item.description.trim() && !item.quantity && !item.unit_price;
const isComplete = (item: StandaloneOrderItemForm) =>
  !!item.description.trim() && (item.quantity ?? 0) > 0 && (item.unit_price ?? 0) > 0;

/** Primeiro problema do formulário, na ordem em que aparece na tela; `null` quando dá para salvar. */
export function validateStandaloneOrder(form: StandaloneOrderForm): StandaloneOrderError | null {
  if (!form.provider_uuid) return 'provider';
  if (!form.farm_uuid) return 'farm';
  if (!form.category) return 'category';
  const filled = form.items.filter((item) => !isBlank(item));
  if (filled.length === 0) return 'items';
  if (filled.some((item) => !isComplete(item))) return 'itemIncomplete';
  // Com condição de pagamento, precisa de nº de parcelas e 1º vencimento.
  const p = form.payment;
  if (p.condition.trim() && (!(p.installments ?? 0) || !p.first_due)) return 'paymentIncomplete';
  return null;
}

/** Valor a parcelar: itens + despesas (frete, seguro, outras). */
export function standaloneOrderPayable(form: StandaloneOrderForm): number {
  const e = expensesOf(form.payment);
  return standaloneOrderTotal(form) + e.freight + e.insurance + e.other;
}

/** Total da ordem (só linhas completas). */
export function standaloneOrderTotal(form: StandaloneOrderForm): number {
  return form.items.filter(isComplete).reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unit_price ?? 0), 0);
}

/** Monta o envio: ignora linhas em branco; exige um formulário válido. */
export function buildStandaloneOrderPayload(form: StandaloneOrderForm): StandaloneOrderPayload {
  if (validateStandaloneOrder(form)) throw new Error('Ordem avulsa inválida');
  return {
    provider_uuid: form.provider_uuid as string,
    farm_uuid: form.farm_uuid as string,
    category: form.category as PurchaseOrderCategoryKey,
    mark: form.mark,
    delivery_forecast: form.delivery_forecast || null,
    items: form.items.filter(isComplete).map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity as number,
      unit_price: item.unit_price as number,
    })),
    delivery: form.delivery.place.trim()
      ? {
          freight_type: form.delivery.freight_type,
          place: form.delivery.place.trim(),
          carrier: form.delivery.carrier.trim() || null,
          needs_unloading: form.delivery.needs_unloading,
          note: form.delivery.note.trim() || null,
        }
      : null,
    payment: form.payment.condition.trim()
      ? {
          condition: form.payment.condition.trim(),
          installments: buildInstallments(
            standaloneOrderPayable(form),
            form.payment.installments ?? 1,
            form.payment.first_due,
            form.payment.interval_days ?? 30
          ),
          expenses: expensesOf(form.payment),
        }
      : null,
  };
}
