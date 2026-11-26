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

export interface StandaloneOrderForm {
  provider_uuid: string | null;
  farm_uuid: string | null;
  category: PurchaseOrderCategoryKey | null;
  mark: PurchaseOrderMarkKey | null;
  delivery_forecast: string;
  items: StandaloneOrderItemForm[];
}

export interface StandaloneOrderPayload {
  provider_uuid: string;
  farm_uuid: string;
  category: PurchaseOrderCategoryKey;
  mark: PurchaseOrderMarkKey | null;
  delivery_forecast: string | null;
  items: { description: string; quantity: number; unit_price: number }[];
}

export type StandaloneOrderError = 'provider' | 'farm' | 'category' | 'items' | 'itemIncomplete';

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
  return null;
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
  };
}
