// src/pages/Administrativo/Solicitacao/prototype/generateOrders.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO — Solicitação gera N Ordens de compra (decisão do dono, 26/11/2026).
// Cada Ordem é de UM fornecedor; se um fornecedor não tem todos os itens, a
// Solicitação gera mais de uma Ordem. A Solicitação continua viva e ligada às
// Ordens: o quanto de cada item já está em ordem é a "cobertura".
// Regra pura, testada. Campos ainda não existem na API (só nos dados de
// demonstração).
// -----------------------------------------------------------------------------

export interface GeneratedOrderItem {
  request_item_uuid: string;
  quantity: number;
}

/** Ordem de compra nascida da Solicitação (campo de protótipo `generated_orders`). */
export interface GeneratedOrder {
  uuid: string;
  code: string;
  provider: { uuid: string; name: string };
  status_label: string;
  items: GeneratedOrderItem[];
}

/** Uma linha do diálogo "Gerar ordens": quanto do item vai para qual fornecedor. */
export interface GenerateOrdersRow {
  item_uuid: string;
  quantity: number;
  provider_uuid: string | null;
}

export interface GenerateOrdersPayload {
  orders: { provider_uuid: string; items: { item_uuid: string; quantity: number }[] }[];
}

export interface ItemCoverage {
  requested: number;
  ordered: number;
  pending: number;
}

interface CoverageItem {
  uuid: string;
  quantity: number | null;
  cancelled?: boolean;
}

/** Quanto de cada item da Solicitação já está em ordem e quanto falta. */
export function itemCoverage(items: CoverageItem[], orders: GeneratedOrder[]): Record<string, ItemCoverage> {
  const ordered = new Map<string, number>();
  orders.forEach((order) =>
    order.items.forEach((row) =>
      ordered.set(row.request_item_uuid, (ordered.get(row.request_item_uuid) ?? 0) + row.quantity)
    )
  );
  return Object.fromEntries(
    items.map((item) => {
      const requested = item.cancelled ? 0 : (item.quantity ?? 0);
      const inOrder = ordered.get(item.uuid) ?? 0;
      return [item.uuid, { requested, ordered: inOrder, pending: Math.max(0, requested - inOrder) }];
    })
  );
}

/** A Solicitação já está toda em ordens (nada pendente)? */
export function isFullyOrdered(coverage: Record<string, ItemCoverage>): boolean {
  const rows = Object.values(coverage).filter((row) => row.requested > 0);
  return rows.length > 0 && rows.every((row) => row.pending === 0);
}

export type GenerateOrdersError = 'empty' | 'missingProvider' | 'overPending';

/** Confere as linhas: algo a gerar, fornecedor em cada linha usada e sem passar do pendente. */
export function validateGenerateOrders(
  rows: GenerateOrdersRow[],
  coverage: Record<string, ItemCoverage>
): GenerateOrdersError | null {
  const used = rows.filter((row) => row.quantity > 0);
  if (used.length === 0) return 'empty';
  if (used.some((row) => !row.provider_uuid)) return 'missingProvider';
  const perItem = new Map<string, number>();
  used.forEach((row) => perItem.set(row.item_uuid, (perItem.get(row.item_uuid) ?? 0) + row.quantity));
  for (const [itemUuid, quantity] of perItem) {
    if (quantity > (coverage[itemUuid]?.pending ?? 0)) return 'overPending';
  }
  return null;
}

/** Agrupa as linhas por fornecedor: uma Ordem por fornecedor, na ordem em que aparecem. */
export function buildGenerateOrdersPayload(rows: GenerateOrdersRow[]): GenerateOrdersPayload {
  const byProvider = new Map<string, Map<string, number>>();
  rows
    .filter((row) => row.quantity > 0 && row.provider_uuid)
    .forEach((row) => {
      const provider = row.provider_uuid as string;
      const items = byProvider.get(provider) ?? new Map<string, number>();
      items.set(row.item_uuid, (items.get(row.item_uuid) ?? 0) + row.quantity);
      byProvider.set(provider, items);
    });
  return {
    orders: [...byProvider].map(([provider_uuid, items]) => ({
      provider_uuid,
      items: [...items].map(([item_uuid, quantity]) => ({ item_uuid, quantity })),
    })),
  };
}
