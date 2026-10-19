// src/utils/orderTotals.ts
// -----------------------------------------------------------------------------
// Fonte ÚNICA do cálculo de totais do Pedido (Order — Operacional / Vendas,
// F-051, 97-Esteiras/043, CV-004..007). Extraído de
// `pages/Operacional/Pedidos/CreateOrUpdateOrder.tsx` (PED-FE-03/04) para
// `src/utils/` em PED-FE-05, para `OrderPaymentsEditor.tsx` reusar o MESMO
// cálculo (PARADA-DEF-C, corrige CLM-025: o cronograma de parcelas
// re-dispara o recompute em toda mudança de `total`/`freight`/`discount` do
// cabeçalho) sem import cruzado entre os dois componentes de página.
//
// Consumido por: `CreateOrUpdateOrder.tsx` (rodapé `OrderFooterTotals` +
// `tryPersistOrder`, payload) E `OrderPaymentsEditor.tsx` (`total` do
// recompute `calcInstallments`/`adjustInstallmentsDifference`) — os três
// nunca podem divergir entre si.
// -----------------------------------------------------------------------------

import type { OrderItemForm } from '@/@types/v2/Orders';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  total: number;
}

export function computeOrderTotals(
  items: OrderItemForm[] | undefined,
  freight: number
): OrderTotals {
  const rows = items ?? [];
  const subtotal = roundTo2(
    rows.reduce((sum, item) => sum + (Number(item?.quantity) || 0) * (Number(item?.price) || 0), 0)
  );
  const discount = roundTo2(rows.reduce((sum, item) => sum + (Number(item?.discount) || 0), 0));
  const total = roundTo2(subtotal + freight - discount);
  return { subtotal, discount, total };
}
