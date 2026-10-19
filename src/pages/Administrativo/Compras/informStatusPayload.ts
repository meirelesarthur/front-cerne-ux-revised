// src/pages/Administrativo/Compras/informStatusPayload.ts
// -----------------------------------------------------------------------------
// Regras PURAS do "Informar Status" da Compra (execução 081, T-081-FE-09;
// contrato LEGADO-SUPRIMENTOS-08, §4.2/§5.4, e EXEC-API-04):
//  - a tabela lista SÓ os itens com cotação autorizada (`is_authorized`);
//  - "Dt. Entrega" abre preenchida com `forecast_delivery_date ?? delivery_date`;
//  - o payload leva TODAS as linhas autorizadas: linha em branco vira `null` e a
//    API zera a previsão (como o legado); sem linhas autorizadas o campo não
//    vai (a API então não mexe nos itens);
//  - `financial_due_date` em branco vai `null` explícito (o legado sobrescreve o
//    valor anterior mesmo vazio).
// -----------------------------------------------------------------------------

import type {
  InformRequestPurchaseStatusForm,
  InformRequestPurchaseStatusPayload,
  RequestItemDeliveryDateFormRow,
  RequestItemRow,
} from '@/@types/v2/RequestPurchases';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}/;

// Normaliza para `yyyy-MM-dd` (o `DateInput` só aceita esse formato).
export function toDateOnly(value?: string | null): string | null {
  if (!value) return null;
  return DATE_ONLY.test(value) ? value.slice(0, 10) : null;
}

export function buildDeliveryDateRows(items: RequestItemRow[]): RequestItemDeliveryDateFormRow[] {
  return items
    .filter((item) => item.is_authorized === true)
    .map((item) => ({
      item_uuid: item.uuid,
      item_label:
        item.product?.description ?? item.description ?? item.service_description ?? item.uuid,
      quantity: item.quantity,
      item_description: item.description,
      delivery_date: toDateOnly(item.forecast_delivery_date ?? item.delivery_date),
    }));
}

export function buildInformStatusPayload(
  data: InformRequestPurchaseStatusForm
): InformRequestPurchaseStatusPayload {
  const rows = data.item_delivery_dates;

  return {
    status: data.status!.value,
    justify: data.justify.trim(),
    financial_due_date: data.financial_due_date || null,
    item_delivery_dates:
      rows.length > 0
        ? Object.fromEntries(rows.map((row) => [row.item_uuid, row.delivery_date || null]))
        : undefined,
  };
}
