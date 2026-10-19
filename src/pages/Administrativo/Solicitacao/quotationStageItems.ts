// src/pages/Administrativo/Solicitacao/quotationStageItems.ts
// -----------------------------------------------------------------------------
// Conversões PURAS do quadro de itens da aba Cotações (execução 081,
// T-081-FE-08; `PUT request-purchases/{uuid}/quotation-items`): linha do
// detalhe -> linha do formulário e formulário -> payload da API.
// -----------------------------------------------------------------------------

import type { RequestItemRow } from '@/@types/v2/RequestPurchases';
import type {
  QuotationStageItemFormRow,
  QuotationStageItemsForm,
  QuotationStageItemsPayload,
} from '@/@types/v2/RequestQuotations';

/** `maxlength` da descrição no legado (`_card-item`). */
export const STAGE_ITEM_DESCRIPTION_MAX = 60;

export function buildStageItemRows(
  items: ReadonlyArray<RequestItemRow> | null | undefined
): QuotationStageItemFormRow[] {
  return (items ?? []).map((item) => ({
    uuid: item.uuid,
    product: item.product ? { value: item.product.uuid, label: item.product.description } : null,
    quantity: item.quantity ?? null,
    description: item.description ?? '',
  }));
}

export function buildStageItemsPayload(form: QuotationStageItemsForm): QuotationStageItemsPayload {
  return {
    items: form.items.map((row) => ({
      uuid: row.uuid,
      product_uuid: row.product?.value ?? null,
      quantity: Number(row.quantity ?? 0),
      description: row.description.trim() || null,
    })),
  };
}
